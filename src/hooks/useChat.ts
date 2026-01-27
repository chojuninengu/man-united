'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function useChat({ missionId }: { missionId: string | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Fetch messages when mission changes
  useEffect(() => {
    setMessages([]) // Clear previous mission data immediately
    
    if (!missionId) {
        return
    }

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('mission_id', missionId)
            .order('created_at', { ascending: true })
        
        if (error) {
            console.error('Error fetching messages:', error)
            return
        }

        if (data) {
            setMessages((data as any[]).map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            })))
        }
    }

    fetchMessages()
  }, [missionId, supabase])

  const sendMessage = async (content: string, mode: string) => {
    // Optimistic UI
    const newMessage: Message = { role: 'user', content }
    setMessages(prev => [...prev, newMessage])
    setLoading(true)
    setError(null)

    try {
      const controller = new AbortController()
      // Give Groq 30 seconds for complex conversations
      const timeoutId = setTimeout(() => controller.abort(), 30000)

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
