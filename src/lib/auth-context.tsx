'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { createSimpleClient, createFallbackClient } from '@/utils/supabase/fallback-client'
import { toast } from 'sonner'

// Types for user roles and profile
export type UserRole = 'customer' | 'service_provider' | 'business_admin' | 'super_admin'

export interface UserProfile {
  id: string
  user_role: UserRole
  business_id?: string
  provider_id?: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  preferences?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AuthUser extends User {
  profile?: UserProfile
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ user: User | null; error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  signInWithOAuth: (provider: 'google' | 'github' | 'apple') => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Try different client configurations for better reliability
  const getSupabaseClient = () => {
    try {
      // First try the enhanced client with retries
      return createFallbackClient()
    } catch (error) {
      console.warn('Fallback client failed, trying simple client:', error)
      try {
        return createSimpleClient()
      } catch (simpleError) {
        console.warn('Simple client failed, using default:', simpleError)
        return createClient()
      }
    }
  }
  
  const supabase = getSupabaseClient()

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('Error fetching user profile:', error)
        
        // If profile doesn't exist, try to create one
        if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
          console.log('User profile not found, creating default profile...')
          return await createDefaultUserProfile(userId)
        }
        
        return null
      }

      return data
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error)
      return null
    }
  }

  // Create a default user profile
  const createDefaultUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          user_role: 'customer',
          first_name: '',
          last_name: '',
          onboarded: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating default user profile:', error)
        return null
      }

      console.log('Created default user profile:', data)
      return data
    } catch (error) {
      console.error('Error creating default user profile:', error)
      return null
    }
  }

  // Set user with profile
  const setUserWithProfile = async (authUser: User | null) => {
    if (!authUser) {
      setUser(null)
      return
    }

    try {
      const profile = await fetchUserProfile(authUser.id)
      setUser({ ...authUser, profile: profile || undefined })
      
      if (!profile) {
        console.warn('User profile could not be loaded or created')
        // Still set the user without profile to allow basic functionality
        setUser({ ...authUser, profile: undefined })
      }
    } catch (error) {
      console.error('Error setting user with profile:', error)
      // Set user without profile as fallback
      setUser({ ...authUser, profile: undefined })
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        setUserWithProfile(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        
        if (session?.user) {
          await setUserWithProfile(session.user)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Sign up
  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) {
        toast.error(error.message)
        return { user: null, error }
      }

      if (data.user && !data.session) {
        toast.success('Please check your email to confirm your account')
      }

      return { user: data.user, error: null }
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message)
      return { user: null, error: authError }
    }
  }

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        toast.error(error.message)
        return { user: null, error }
      }

      toast.success('Signed in successfully')
      return { user: data.user, error: null }
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message)
      return { user: null, error: authError }
    }
  }

  // OAuth sign in
  const signInWithOAuth = async (provider: 'google' | 'github' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false
        }
      })

      if (error) {
        toast.error(error.message)
        return { error }
      }

      return { error: null }
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message)
      return { error: authError }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast.error(error.message)
        return { error }
      }

      toast.success('Signed out successfully')
      return { error: null }
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message)
      return { error: authError }
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        toast.error(error.message)
        return { error }
      }

      toast.success('Password reset email sent')
      return { error: null }
    } catch (error) {
      const authError = error as AuthError
      toast.error(authError.message)
      return { error: authError }
    }
  }

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        throw new Error('No user logged in')
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        toast.error(error.message)
        return { error: new Error(error.message) }
      }

      // Refresh the user profile
      await refreshProfile()
      toast.success('Profile updated successfully')
      return { error: null }
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
      return { error: err }
    }
  }

  // Refresh user profile
  const refreshProfile = async () => {
    if (user) {
      await setUserWithProfile(user)
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for checking user permissions
export function useUserPermissions() {
  const { user } = useAuth()
  
  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user?.profile?.user_role) return false
    
    if (Array.isArray(role)) {
      return role.includes(user.profile.user_role)
    }
    
    return user.profile.user_role === role
  }

  const canAccessAdminFeatures = () => {
    return hasRole(['business_admin', 'super_admin'])
  }

  const canManageBookings = () => {
    return hasRole(['service_provider', 'business_admin', 'super_admin'])
  }

  const canViewAllBookings = () => {
    return hasRole(['business_admin', 'super_admin'])
  }

  return {
    hasRole,
    canAccessAdminFeatures,
    canManageBookings,
    canViewAllBookings,
    userRole: user?.profile?.user_role || null
  }
}
