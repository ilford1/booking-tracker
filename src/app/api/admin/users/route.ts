import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the current user to verify admin access
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Verify admin permissions
    if (!['business_admin', 'super_admin'].includes(userProfile.user_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create service role client for admin operations
    const serviceRoleClient = createClient()
    
    // For now, let's just use the regular profiles data without auth.admin
    // In production, you would set up the service role key properly

    // Get user profiles from database
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        user_role,
        first_name,
        last_name,
        phone,
        business_id,
        provider_id,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 })
    }

    // For now, we'll just return the profile data we have
    // In a full implementation, you'd set up proper service role access
    const usersWithBasicInfo = profiles?.map(profile => ({
      ...profile,
      email: 'Email access requires service role', // Placeholder
      last_sign_in_at: null,
      email_confirmed_at: null
    })) || []

    return NextResponse.json({ users: usersWithBasicInfo })

  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle other HTTP methods
export async function POST(request: NextRequest) {
  // TODO: Implement user creation
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

export async function PUT(request: NextRequest) {
  // TODO: Implement user updates
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

export async function DELETE(request: NextRequest) {
  // TODO: Implement user deletion
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
