import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json()
    
    if (!email || !password || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: true,
        user: data.user,
        session: data.session
      })
      
    } else if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: true,
        user: data.user,
        session: data.session,
        needsVerification: !data.session
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
    
  } catch (error: any) {
    console.error('Server auth error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}
