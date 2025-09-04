import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // First test environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
          nodeEnv: process.env.NODE_ENV
        }
      })
    }
    
    // Test basic fetch connectivity first
    let fetchTest = null
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'User-Agent': 'booking-tracker-test'
        },
      })
      fetchTest = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      }
    } catch (fetchError: any) {
      fetchTest = {
        error: fetchError.message,
        type: fetchError.constructor.name
      }
    }
    
    // Now try Supabase client
    let supabaseTest = null
    try {
      const supabase = await createClient()
      
      // Get the current auth user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Test basic connectivity without RLS-protected tables
      const { data: profiles, error: dbError } = await supabase
        .from('creators')
        .select('id')
        .limit(1)
        
      supabaseTest = {
        userError: userError?.message || null,
        sessionError: sessionError?.message || null,
        dbError: dbError?.message || null,
        hasProfiles: !!profiles && profiles.length > 0
      }
    } catch (supabaseError: any) {
      supabaseTest = {
        error: supabaseError.message,
        type: supabaseError.constructor.name
      }
    }
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      url: supabaseUrl?.substring(0, 30) + '...',
      anon_key: supabaseAnonKey?.substring(0, 30) + '...',
      fetchTest,
      supabaseTest,
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
