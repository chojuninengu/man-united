import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HEAD_COACH_SYSTEM_PROMPT } from '@/lib/mentor/prompts'
import { Groq } from 'groq-sdk'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { messages, missionId, mode } = await req.json()

    // 1. Prepare context (same as before)
    const systemMessage = {
      role: 'system',
      content: HEAD_COACH_SYSTEM_PROMPT + `\n\nCURRENT OPERATIONAL MODE: ${mode?.toUpperCase() || 'HOME'}`
    }

    const conversation = [systemMessage, ...messages]
    const lastUserMessage = messages[messages.length - 1]

    // 2. Save USER message to Supabase
    if (missionId && lastUserMessage?.role === 'user') {
        await supabase.from('messages').insert({
            mission_id: missionId,
            role: 'user',
            content: lastUserMessage.content
        } as any)
    }

    // 3. Call Groq SDK
    const apiKey = process.env.GROQ_API_KEY || process.env.MENTOR_API_KEY
    if (!apiKey) {
      console.error('MENTOR_API_ERROR: Missing Groq API Key')
      return NextResponse.json({ error: 'Head Coach configuration missing' }, { status: 500 })
    }

    const groq = new Groq({ apiKey })

    const completion = await groq.chat.completions.create({
        messages: conversation as any,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
    })

    const assistantMessage = completion.choices[0]?.message?.content || "The Head Coach is silent."

    // 3. Save to Supabase (Assistant response)
    if (missionId) {
        // Explicitly assert as any or Partial<Row> if types are mismatching due to Json vs string
        await supabase.from('messages').insert({
            mission_id: missionId,
            role: 'assistant',
            content: assistantMessage,
            metadata: { model: 'llama-3.3-70b-versatile' }
        } as any) 
    }

    return NextResponse.json({ content: assistantMessage })

  } catch (error: any) {
    console.error('Mentor API Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to communicate with Head Coach' },
      { status: 500 }
    )
  }
}
