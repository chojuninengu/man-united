'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function useAuthActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const signIn = async (email: string) => {
    setLoading(true)
    setError(null)
    
    // For this app, we'll use Magic Links as they are easiest to set up without heavy password logic initially
    // But per user request we can do password based. Let's do Password for simplicity if they want standard login.
    // However, Magic Link is very "PWA" friendly. Let's stick to Magic Link for MVP unless specified?
    // Wait, typical apps utilize passwords. Let's use Email/Password to look "Pro".
    
    // Actually, let's implement the standard Email/Password flow
    // NOTE: This assumes the user will register with a password.
    
    // Re-reading user request: "Implement the standard password reset UI" from history.
    // Standard email/password is safer bet for "Head Coach".
    
    try {
        // Implementation for Magic Link (Passwordless) - simpler for MVP
        // const { error } = await supabase.auth.signInWithOtp({
        //   email,
        //   options: {
        //     emailRedirectTo: `${location.origin}/api/auth/callback`,
        //   },
        // })
        
        // Let's go with magic link for now as it handles "Reset" automatically
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        })

        if (error) throw error
        
        alert('Check your email for the login link!')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Actually, let's provide a strictly password-based approach as it feels more "App-like"
  // and less "Website-like".
  
  const signUpWithPassword = async (email: string, password: string) => {
     setLoading(true)
     setError(null)
     try {
         const { error } = await supabase.auth.signUp({
             email,
             password,
             options: {
                 emailRedirectTo: `${window.location.origin}/api/auth/callback`,
             }
         })
         if (error) throw error
         router.push('/chat') // Auto login often works, or check email
     } catch (e: any) {
         setError(e.message)
     } finally {
         setLoading(false)
     }
  }

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error
        router.push('/chat')
    } catch (e: any) {
        setError(e.message)
    } finally {
        setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`,
            }
        })
        if (error) throw error
    } catch (e: any) {
        setError(e.message)
    } finally {
        setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return { 
    signInWithPassword, 
    signUpWithPassword,
    signInWithGoogle,
    signOut, 
    loading, 
    error 
  }
}
