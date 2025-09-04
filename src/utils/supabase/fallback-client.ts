import { createBrowserClient } from '@supabase/ssr'

// Simple fetch without custom modifications for fallback
const simpleFetch = (input: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  return fetch(input, options)
}

// Retry fetch with exponential backoff
const retryFetch = async (input: RequestInfo | URL, options: RequestInit = {}, maxRetries = 3): Promise<Response> => {
  const url = typeof input === 'string' ? input : input.toString()
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetch attempt ${attempt}/${maxRetries} to:`, url)
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...options.headers,
        },
      })
      
      console.log(`Fetch attempt ${attempt} response:`, response.status, response.statusText)
      return response
    } catch (error) {
      console.error(`Fetch attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff: 1s, 2s, 4s...
      const delay = Math.pow(2, attempt - 1) * 1000
      console.log(`Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('All retry attempts failed')
}

export function createFallbackClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    throw new Error('Missing Supabase configuration')
  }
  
  console.log('Creating fallback Supabase client with URL:', supabaseUrl)
  
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
        fetch: retryFetch
      }
    }
  )
}

// Simple client without any custom fetch
export function createSimpleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration')
  }
  
  console.log('Creating simple Supabase client')
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  })
}
