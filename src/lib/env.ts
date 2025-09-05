// Environment configuration helper
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 
         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
          'http://localhost:3000'),
    isProd: process.env.NODE_ENV === 'production',
    isDev: process.env.NODE_ENV === 'development'
  }
}

// Get the correct callback URL based on environment
export function getAuthCallbackUrl() {
  if (typeof window !== 'undefined') {
    // Client-side: use window.location.origin
    return `${window.location.origin}/auth/callback`
  }
  // Server-side: use configured app URL
  return `${env.app.url}/auth/callback`
}

// Get the base URL for the application
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.origin
  }
  // Server-side
  return env.app.url
}
