import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  supabaseUrl !== 'your_supabase_project_url'

// Chainable no-op that always resolves with a "not configured" error
// Handles patterns like: supabase.from('x').select(), .upsert().eq(), etc.
function makeNoOp() {
  const result = Promise.resolve({
    data: null,
    error: { message: 'Supabase not configured — add credentials to client/.env' }
  })
  // Make the resolved promise also chainable (for builder patterns)
  const handler = {
    get: (_t, prop) => {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return result[prop].bind(result)
      }
      return () => new Proxy({}, handler)
    }
  }
  return new Proxy({}, handler)
}

const noOpClient = {
  from: () => makeNoOp(),
  auth: { getUser: () => Promise.resolve({ data: null, error: null }) }
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : noOpClient


