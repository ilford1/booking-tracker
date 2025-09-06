// Debug utility to check environment variables
export function debugEnvironmentVariables() {
  console.log('Environment Variables Check:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    URL_VALUE: process.env.NEXT_PUBLIC_SUPABASE_URL,
    KEY_VALUE: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'MISSING'
  })
}

export function checkSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const hasUrl = !!url
  const hasKey = !!key
  const isComplete = hasUrl && hasKey
  
  console.log('Supabase Configuration Status:', {
    hasUrl,
    hasKey,
    isComplete,
    urlLength: url?.length || 0,
    keyLength: key?.length || 0
  })
  
  return { hasUrl, hasKey, isComplete, url, key }
}
