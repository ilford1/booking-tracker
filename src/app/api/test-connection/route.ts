import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/client'

export async function GET() {
  try {
    // Log environment variables (without exposing sensitive data)
    console.log('Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)
    })

    // Create client
    const supabase = createClient()
    
    // Try a simple query to test the connection
    const { data, error, count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error,
        env: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      bookingsCount: count || 0,
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    })
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return NextResponse.json({
      success: false,
      error: err.message || 'Unknown error',
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    }, { status: 500 })
  }
}
