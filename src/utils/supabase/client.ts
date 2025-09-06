import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use hardcoded values if environment variables are not available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ggwkkxmufcjnwgeqllev.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnd2treG11ZmNqbndnZXFsbGV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Mzk5MzMsImV4cCI6MjA3MjUxNTkzM30.dHBQTlMPLkmwXkr-gUf5T2rDUPYPB4Hkmd-zOiqiaFw'
  
  console.log('Creating Supabase client with config:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlValue: supabaseUrl,
    keyLength: supabaseAnonKey?.length || 0,
    environment: process.env.NODE_ENV,
    allEnvVars: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  })
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
      urlValue: supabaseUrl,
      keyValue: supabaseAnonKey?.substring(0, 20) + '...' || 'MISSING'
    })
    throw new Error('Missing Supabase configuration')
  }
  
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
          'X-Client-Info': 'booking-tracker-client',
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
