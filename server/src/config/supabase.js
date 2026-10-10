import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

let supabaseInstance = null

export function getSupabaseAdmin() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseInstance
}

/**
 * Allows injecting a mock client for testing.
 */
export function setSupabaseAdmin(client) {
  supabaseInstance = client
}
