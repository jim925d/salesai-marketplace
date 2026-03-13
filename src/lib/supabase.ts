import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper to set the Supabase auth token from Firebase
// This allows RLS policies to use auth.uid() with Firebase UIDs
export async function setSupabaseAuth(firebaseToken: string | null) {
  if (firebaseToken) {
    // Set the auth header for all subsequent Supabase requests
    // Supabase will use this JWT to evaluate RLS policies
    await supabase.auth.setSession({
      access_token: firebaseToken,
      refresh_token: '',
    })
  } else {
    await supabase.auth.signOut()
  }
}

// Typed helper for common queries
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
