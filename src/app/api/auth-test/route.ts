import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current auth user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Test database connectivity by querying user_profiles
    const { data: profiles, error: dbError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...',
      user: user ? { id: user.id, email: user.email } : null,
      session_exists: !!session,
      database_working: !dbError,
      errors: {
        user_error: userError?.message || null,
        session_error: sessionError?.message || null,
        db_error: dbError?.message || null
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
