export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          preferences: Json
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          preferences?: Json
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          preferences?: Json
          created_at?: string
        }
      }
      missions: {
        Row: {
          id: string
          user_id: string
          target_name: string
          stage: 'sighting' | 'blanket' | 'physical'
          mode: 'home' | 'away'
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_name: string
          stage?: 'sighting' | 'blanket' | 'physical'
          mode?: 'home' | 'away'
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_name?: string
          stage?: 'sighting' | 'blanket' | 'physical'
          mode?: 'home' | 'away'
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          mission_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          mission_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          mission_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json
          created_at?: string
        }
      }
      mugu_checks: {
        Row: {
          id: string
          user_id: string
          input_text: string
          is_mugu: boolean
          correction: string | null
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          input_text: string
          is_mugu: boolean
          correction?: string | null
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          input_text?: string
          is_mugu?: boolean
          correction?: string | null
          explanation?: string | null
          created_at?: string
        }
      }
    }
  }
}
