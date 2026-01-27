import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HEAD_COACH_SYSTEM_PROMPT } from '@/lib/mentor/prompts'
import { Groq } from 'groq-sdk'

export async function POST(req: Request) {
  // Debug environment presence (Server logs only)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) console.warn('MENTOR_DEBUG: NEXT_PUBLIC_SUPABASE_URL is missing')
  if (!process.env.GROQ_API_KEY && !process.env.MENTOR_API_KEY) console.warn('MENTOR_DEBUG: Groq/Mentor API Key is missing')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { messages, missionId, mode } = body;

    // 1. Prepare context
    const systemMessage = {
      role: 'system',
      content: HEAD_COACH_SYSTEM_PROMPT + `\n\nCURRENT OPERATIONAL MODE: ${mode?.toUpperCase() || 'HOME'}`
    }

    const conversation = [systemMessage, ...(messages || [])]
    const lastUserMessage = messages?.[messages.length - 1]

    // 2. Save USER message to Supabase (Non-blocking)
    const isGeneralChat = !missionId || missionId === 'general';

    if (!isGeneralChat && missionId && lastUserMessage?.role === 'user') {
        supabase.from('messages').insert({
            mission_id: missionId,
            role: 'user',
            content: lastUserMessage.content
        } as any).then(({error}) => {
          if (error) console.error('Supabase User Message Insert Error:', error)
        })
    }

    // 3. Call Groq SDK
    const apiKey = process.env.GROQ_API_KEY || process.env.MENTOR_API_KEY
    if (!apiKey) {
      console.error('MENTOR_API_ERROR: Missing Groq API Key in environment variables.')
      return NextResponse.json({
        error: 'Head Coach configuration missing (API Key). Please check your environment variables.'
      }, { status: 500 })
    }

    const groq = new Groq({ apiKey })

    let completion;
    try {
      completion = await groq.chat.completions.create({
          messages: conversation as any,
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          stream: false
      })
    } catch (groqError: any) {
      console.error('GROQ_PRIMARY_MODEL_ERROR:', groqError);
      // Fallback to a smaller, more widely available model if primary fails
      completion = await groq.chat.completions.create({
          messages: conversation as any,
          model: "llama-3.1-8b-instant",
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
          stream: false
      })
    }

    const assistantMessage = completion.choices[0]?.message?.content || "The Head Coach is silent."

    // 4. Save to Supabase (Assistant response, Non-blocking)
    if (!isGeneralChat && missionId) {
        supabase.from('messages').insert({
            mission_id: missionId,
            role: 'assistant',
            content: assistantMessage,
            metadata: { model: completion.model || 'unknown' }
        } as any).then(({error}) => {
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
