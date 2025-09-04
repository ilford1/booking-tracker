'use client'

import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  Save,
  Upload,
  Shield
} from 'lucide-react'

function ProfileContent() {
  const { user, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: '',
    preferences: {}
  })

  // Load user profile data
  useEffect(() => {
    if (user?.profile) {
      setProfileData({
        first_name: user.profile.first_name || '',
        last_name: user.profile.last_name || '',
        phone: user.profile.phone || '',
        avatar_url: user.profile.avatar_url || '',
        preferences: user.profile.preferences || {}
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { error } = await updateProfile(profileData)
      if (!error) {
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      'customer': { label: 'Customer', color: 'bg-blue-100 text-blue-800' },
      'service_provider': { label: 'Service Provider', color: 'bg-green-100 text-green-800' },
      'business_admin': { label: 'Business Admin', color: 'bg-purple-100 text-purple-800' },
      'super_admin': { label: 'Super Admin', color: 'bg-red-100 text-red-800' }
    }
    return roleMap[role as keyof typeof roleMap] || { label: role, color: 'bg-gray-100 text-gray-800' }
  }

  const roleDisplay = user?.profile?.user_role ? getRoleDisplay(user.profile.user_role) : null

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-500 mt-1">
                Manage your personal information and preferences
              </p>
            </div>
            <Button onClick={handleSave} disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatar_url} alt="Profile" />
                    <AvatarFallback className="text-lg">
                      {(profileData.first_name?.[0] || '') + (profileData.last_name?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Change Photo
                  </Button>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">
                      {profileData.first_name} {profileData.last_name}
                    </h3>
                    {roleDisplay && (
                      <Badge className={roleDisplay.color}>
                        <Shield className="h-3 w-3 mr-1" />
                        {roleDisplay.label}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  
                  {profileData.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{profileData.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {new Date(user?.created_at || '').toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Email cannot be changed here. Contact support if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  type="url"
                  value={profileData.avatar_url}
                  onChange={(e) => setProfileData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-gray-500">
                  Enter a URL to your profile picture, or use the upload button above.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input value={user?.id || ''} disabled className="bg-gray-50 font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Input 
                    value={roleDisplay?.label || 'Unknown'} 
                    disabled 
                    className="bg-gray-50" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Verified</Label>
                  <Input 
                    value={user?.email_confirmed_at ? 'Yes' : 'No'} 
                    disabled 
                    className="bg-gray-50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Sign In</Label>
                  <Input 
                    value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'} 
                    disabled 
                    className="bg-gray-50 text-xs" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute requiredRoles={['customer', 'service_provider', 'business_admin', 'super_admin']}>
      <ProfileContent />
    </ProtectedRoute>
  )
}
