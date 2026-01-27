import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HEAD_COACH_SYSTEM_PROMPT } from '@/lib/mentor/prompts'

// Prefer Edge runtime on Vercel Hobby to avoid short Serverless timeouts.
// We call Groq via fetch so it works in Edge environments.
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    // 1. Check critical environment variables immediately
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const apiKey = process.env.GROQ_API_KEY || process.env.MENTOR_API_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('MENTOR_ERROR: Missing Supabase configuration');
      return NextResponse.json({
        error: 'System configuration error (Supabase missing).',
        details: 'Check Vercel environment variables.'
      }, { status: 500 });
    }

    if (!apiKey) {
      console.error('MENTOR_ERROR: Missing Groq API Key');
      return NextResponse.json({
        error: 'Head Coach offline (Missing API Key).',
        details: 'Check MENTOR_API_KEY or GROQ_API_KEY in Vercel.'
      }, { status: 500 });
    }

    // 2. Initialize Supabase and authenticate
    // We wrap this in a try-catch because cookies() can sometimes fail in edge cases
    let user;
    let supabase;
    try {
        supabase = await createClient()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError;
        user = authUser;
    } catch (e: any) {
        console.error('MENTOR_AUTH_ERROR:', e);
        return NextResponse.json({ error: 'Authentication failed', details: e.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}));
    const { messages, missionId, mode } = body;

    // 3. Prepare context and trim conversation for performance/limits
    const systemMessage = {
      role: 'system',
      content: HEAD_COACH_SYSTEM_PROMPT + `\n\nCURRENT OPERATIONAL MODE: ${mode?.toUpperCase() || 'HOME'}`
    }

    // Keep last 8 messages for even more safety on payload/tokens
    const recentMessages = (messages || []).slice(-8);
    const conversation = [systemMessage, ...recentMessages]
    const lastUserMessage = recentMessages[recentMessages.length - 1]

    // 4. Save USER message to Supabase (Non-blocking)
    const isGeneralChat = !missionId || missionId === 'general';

    if (!isGeneralChat && missionId && lastUserMessage?.role === 'user') {
        supabase.from('messages').insert({
            mission_id: missionId,
            role: 'user',
            content: lastUserMessage.content
        } as any).then(({error}: any) => {
          if (error) console.error('Supabase User Message Insert Error:', error)
        })
    }

    // 5. Call Groq via fetch (Edge-safe)
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions'

    async function callGroq(model: string) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 25_000)

      try {
        const res = await fetch(groqUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: conversation,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
          }),
          signal: controller.signal,
        })

        const json = await res.json().catch(() => null)

        if (!res.ok) {
          const detail = json?.error?.message || json?.message || `HTTP ${res.status}`
          throw new Error(detail)
        }

        return json
      } finally {
        clearTimeout(timeout)
      }
    }

    let completion: any
    try {
      completion = await callGroq('llama-3.3-70b-versatile')
    } catch (groqError: any) {
      const msg = groqError?.name === 'AbortError' ? 'Groq API Timeout' : groqError?.message
      console.error('GROQ_PRIMARY_MODEL_ERROR:', msg)

      if (msg !== 'Groq API Timeout') {
        try {
          completion = await callGroq('llama-3.1-8b-instant')
        } catch (fallbackError: any) {
          console.error('GROQ_FALLBACK_MODEL_ERROR:', fallbackError?.message || fallbackError)
          throw fallbackError
        }
      } else {
        throw groqError
      }
    }

    const assistantMessage = completion?.choices?.[0]?.message?.content || 'The Head Coach is silent.'

    // 6. Save to Supabase (Assistant response, Non-blocking)
    if (!isGeneralChat && missionId) {
        supabase.from('messages').insert({
            mission_id: missionId,
            role: 'assistant',
            content: assistantMessage,
            metadata: { model: completion.model || 'unknown' }
        } as any).then(({error}: any) => {
          if (error) console.error('Supabase Assistant Message Insert Error:', error)
        })
    }

    return NextResponse.json({ content: assistantMessage })

  } catch (error: any) {
    console.error('GENERAL_MENTOR_API_ERROR:', error)
    return NextResponse.json(
      {
        error: 'The Head Coach encountered a tactical error.',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
