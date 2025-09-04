import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Successful authentication - redirect to dashboard or intended page
        const redirectUrl = new URL(next, origin)
        return NextResponse.redirect(redirectUrl)
      } else {
        console.error('OAuth callback error:', error)
        // Redirect to signin with error
        const errorUrl = new URL('/auth/signin', origin)
        errorUrl.searchParams.set('error', 'Authentication failed')
        return NextResponse.redirect(errorUrl)
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      // Redirect to signin with error
      const errorUrl = new URL('/auth/signin', origin)
      errorUrl.searchParams.set('error', 'Authentication failed')
      return NextResponse.redirect(errorUrl)
    }
  }

  // No code present - redirect to signin
  const signinUrl = new URL('/auth/signin', origin)
  signinUrl.searchParams.set('error', 'No authentication code received')
  return NextResponse.redirect(signinUrl)
}
