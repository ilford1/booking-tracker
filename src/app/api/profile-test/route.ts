import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated', 
        details: userError?.message 
      }, { status: 401 })
    }

    // Try to fetch the user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // If no profile exists, try to create one
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            user_role: 'customer',
            first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: user.user_metadata?.full_name?.split(' ')[1] || '',
            onboarded: false
          })
          .select()
          .single()

        if (createError) {
          return NextResponse.json({
            error: 'Failed to create profile',
            details: createError,
            user: { id: user.id, email: user.email }
          }, { status: 500 })
        }

        return NextResponse.json({
          message: 'Profile created successfully',
          profile: newProfile,
          user: { id: user.id, email: user.email }
        })
      }

      return NextResponse.json({
        error: 'Failed to fetch profile',
        details: profileError,
        user: { id: user.id, email: user.email }
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Profile found',
      profile,
      user: { id: user.id, email: user.email }
    })

  } catch (error) {
    console.error('Profile test error:', error)
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
