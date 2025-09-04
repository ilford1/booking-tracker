import { createBrowserClient } from '@supabase/ssr'

// Custom fetch with better error handling and timeout
const customFetch = async (input: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const url = typeof input === 'string' ? input : input.toString()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'booking-tracker/1.0',
        ...options.headers,
      },
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('Fetch error:', error)
    throw error
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
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
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'booking-tracker-client'
        },
        fetch: customFetch
      }
    }
  )
}
