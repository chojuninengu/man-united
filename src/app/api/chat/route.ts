import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HEAD_COACH_SYSTEM_PROMPT } from '@/lib/mentor/prompts'
import { Groq } from 'groq-sdk'

export const maxDuration = 30; // Extend Vercel limit if on Pro, but for Hobby it's ignored.
// However, adding it doesn't hurt.

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

    // 5. Call Groq SDK
    const groq = new Groq({ apiKey })

    let completion;
    try {
      // Use a race to implement a manual timeout for the Groq call
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Groq API Timeout')), 25000)
      );

      const groqPromise = groq.chat.completions.create({
          messages: conversation as any,
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          stream: false
      });

      completion = await Promise.race([groqPromise, timeoutPromise]) as any;
    } catch (groqError: any) {
      console.error('GROQ_PRIMARY_MODEL_ERROR:', groqError);

      // Attempt fallback if it's not a timeout
      if (groqError.message !== 'Groq API Timeout') {
          try {
              completion = await groq.chat.completions.create({
                  messages: conversation as any,
                  model: "llama-3.1-8b-instant",
                  temperature: 0.7,
                  max_tokens: 1024,
                  top_p: 1,
                  stream: false
              });
          } catch (fallbackError: any) {
              console.error('GROQ_FALLBACK_MODEL_ERROR:', fallbackError);
              throw fallbackError;
          }
      } else {
          throw groqError;
      }
    }

    const assistantMessage = completion.choices[0]?.message?.content || "The Head Coach is silent."

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
