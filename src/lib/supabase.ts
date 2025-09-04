// Legacy file - use utils/supabase/client.ts or utils/supabase/server.ts instead
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for browser/public operations (legacy)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-only client with service role for bypassing RLS (legacy)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
