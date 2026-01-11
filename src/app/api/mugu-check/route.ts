import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { inputText } = await req.json()
    
    // Quick heuristic check first to save API calls
    if (inputText.length < 5) return NextResponse.json({ isMugu: false })

    const apiKey = process.env.MENTOR_API_KEY
    const apiUrl = process.env.MENTOR_API_URL || 'https://api.x.ai/v1/chat/completions'

    // Strict detector prompt
    const systemPrompt = `
    You are a "Mugu Detector" for the Man-United social strategy app.
    Your job is to analyze the user's proposed text message to a woman.
    
    CRITERIA FOR "MUGU" (Simp/Needy) BEHAVIOR:
    - Overly complimentary (pedestalizing)
    - Seeking validation or permission
    - Apologizing unnecessarily
    - Double texting or showing anxiety
    - Breaking the "Bang Rule" (investing more than her)

    Output JSON ONLY:
    {
      "isMugu": boolean,
      "correction": "Better alternative text here (optional)",
      "explanation": "Why it's bad (concise)"
    }
    `

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this text: "${inputText}"` }
        ],
        temperature: 0.1, // Low temp for strict logical checking
        response_format: { type: "json_object" } // Force JSON if supported, else rely on prompt
      })
    })

    if (!response.ok) {
        throw new Error('Grok API failed')
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)

    // Save check to DB for analytics
    if (result.isMugu) {
        await supabase.from('mugu_checks').insert({
            user_id: user.id,
            input_text: inputText,
            is_mugu: true,
            correction: result.correction,
            explanation: result.explanation
        } as any)
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Mugu check error:', error)
    return NextResponse.json({ isMugu: false }) // Fail open to avoid blocking user
  }
}
