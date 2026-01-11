import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Groq } from 'groq-sdk'

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
    // Use SDK
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY || process.env.MENTOR_API_KEY
    })

    const completion = await groq.chat.completions.create({
      messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this text: "${inputText}"` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // Low temp for strict logical checking
      response_format: { type: "json_object" } 
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No content from Groq')

    const result = JSON.parse(content)

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
