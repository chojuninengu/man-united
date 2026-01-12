'use client'

import { useState } from 'react'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function useChat({ missionId }: { missionId: string | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async (content: string, mode: string) => {
    if (!missionId) return
    
    // Optimistic UI
    const newMessage: Message = { role: 'user', content }
    setMessages(prev => [...prev, newMessage])
    setLoading(true)
    setError(null)

    try {
      const controller = new AbortController()
      // Give Groq 20 seconds to generate deep tactical advice
      const timeoutId = setTimeout(() => controller.abort(), 20000)

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newMessage], // Setup for context window
          missionId,
          mode
        }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (!res.ok) throw new Error('Communication failed')

      const data = await res.json()
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content
      }])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { messages, sendMessage, loading, error, setMessages }
}
