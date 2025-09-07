'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import type { UserProfile } from '@/types/database'

export async function getUserProfiles(): Promise<UserProfile[]> {
  const supabase = await createAdminClient()
  
  try {
    // Fetch user profiles with their auth data
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *
      `)
      .order('first_name', { ascending: true })

    if (error) {
      console.error('Error fetching user profiles:', error)
      throw error
    }

    // Transform the data to include computed fields
    const profiles = (data || []).map(profile => ({
      ...profile,
      full_name: profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}`
        : profile.first_name || profile.last_name || 'Unknown',
      email: 'No email' // We'll fetch this separately if needed
    }))

    return profiles
  } catch (error) {
    console.error('Error in getUserProfiles:', error)
    throw error
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createAdminClient()
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return {
      ...data,
      full_name: data.first_name && data.last_name 
        ? `${data.first_name} ${data.last_name}`
        : data.first_name || data.last_name || 'Unknown',
      email: 'No email'
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Error getting current user:', authError)
      return null
    }

    return await getUserProfile(user.id)
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

export async function isUserAdmin(userId?: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    let targetUserId = userId

    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      targetUserId = user.id
    }

    const profile = await getUserProfile(targetUserId)
    return profile?.user_role === 'super_admin' || profile?.user_role === 'business_admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}
