import { createBrowserClient } from '@supabase/ssr'

// Temporary fallback client with hardcoded values for testing
export function createClientFallback() {
  // Hardcoded values as fallback (from your .env.local)
  const supabaseUrl = 'https://ggwkkxmufcjnwgeqllev.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnd2treG11ZmNqbndnZXFsbGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Mzk5MzMsImV4cCI6MjA3MjUxNTkzM30.dHBQTlMPLkmwXkr-gUf5T2rDUPYPB4Hkmd-zOiqiaFw'
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      },
      global: {
        headers: {
          'X-Client-Info': 'booking-tracker-fallback-client',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      },
      db: {
        schema: 'public'
      }
    }
  )
}

// Enhanced client that tries environment variables first, then fallback
export function createClientWithFallback() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Environment variables check:', {
    hasEnvUrl: !!envUrl,
    hasEnvKey: !!envKey,
    envUrl: envUrl,
    envKeyLength: envKey?.length || 0
  })
  
  if (envUrl && envKey) {
    console.log('Using environment variables for Supabase client')
    return createBrowserClient(envUrl, envKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      },
      global: {
        headers: {
          'X-Client-Info': 'booking-tracker-env-client',
          'apikey': envKey,
          'Authorization': `Bearer ${envKey}`
        }
      },
      db: {
        schema: 'public'
      }
    })
  } else {
    console.log('Environment variables missing, using fallback values')
    return createClientFallback()
  }
}
