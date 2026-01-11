import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HEAD_COACH_SYSTEM_PROMPT } from '@/lib/mentor/prompts'

export async function POST(req: Request) {
  const supabase = await createClient()
  
  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { messages, missionId, mode } = body // Expecting history + current mission context

    // 2. Prepare Grok API payload
    // We assume Grok is OpenAI compatible for simplicity in this MVP implementation plan,
    // otherwise we would adapt to specific xAI SDK.
    const apiKey = process.env.MENTOR_API_KEY
    const apiUrl = process.env.MENTOR_API_URL || 'https://api.x.ai/v1/chat/completions'

    // Inject system prompt with dynamic context if needed (e.g. current mode)
    const systemMessage = {
      role: 'system',
      content: `${HEAD_COACH_SYSTEM_PROMPT}\n\nCURRENT OPERATING MODE: ${mode?.toUpperCase() || 'HOME GAMES'}`
    }

    const conversation = [systemMessage, ...messages]

    // 3. Call Grok API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-beta', // or specific model version
        messages: conversation,
        temperature: 0.7,
        stream: false // For MVP simplicity, we'll do blocking first, then streaming if time
      })
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Grok API Error:', errorText)
        throw new Error(`Grok API failed: ${response.statusText}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices[0].message.content

    // 4. Save to Supabase (User message + Assistant response)
    // In a real app we'd do this robustly. Here we assume the frontend sent the user message 
    // to DB already or we do it here. Let's assume frontend saves User msg, we save Assistant msg.
    
    if (missionId) {
        // Explicitly assert as any or Partial<Row> if types are mismatching due to Json vs string
        await supabase.from('messages').insert({
            mission_id: missionId,
            role: 'assistant',
            content: assistantMessage,
            metadata: { model: 'grok-beta' }
        } as any) 
    }

    return NextResponse.json({ content: assistantMessage })

  } catch (error: any) {
    console.error('Chat route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
