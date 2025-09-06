'use client'

import { useAuth, UserRole } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Calendar, 
  Briefcase,
  UserCog
} from 'lucide-react'
import Link from 'next/link'

function getUserRoleDisplay(role: UserRole) {
  switch (role) {
    case 'customer':
      return { label: 'Customer', color: 'bg-blue-100 text-blue-800', icon: User }
    case 'service_provider':
      return { label: 'Provider', color: 'bg-green-100 text-green-800', icon: Briefcase }
    case 'business_admin':
      return { label: 'Admin', color: 'bg-purple-100 text-purple-800', icon: UserCog }
    case 'super_admin':
      return { label: 'Super Admin', color: 'bg-red-100 text-red-800', icon: Shield }
    default:
      return { label: 'User', color: 'bg-gray-100 text-gray-800', icon: User }
  }
}

function getInitials(firstName?: string, lastName?: string, email?: string) {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase()
  }
  if (email) {
    return email.charAt(0).toUpperCase()
  }
  return 'U'
}

interface UserMenuProps {
  showFullProfile?: boolean
}

export function UserMenu({ showFullProfile = false }: UserMenuProps) {
  const { user, signOut, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/auth/signin">
          <Button variant="ghost">Sign In</Button>
        </Link>
        <Link href="/auth/signup">
          <Button>Sign Up</Button>
        </Link>
      </div>
    )
  }

  const profile = user.profile
  const userRole = profile?.user_role || 'customer'
  const roleDisplay = getUserRoleDisplay(userRole)
  const RoleIcon = roleDisplay.icon
  
  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.first_name || user.email || 'User'
  
  const initials = getInitials(profile?.first_name, profile?.last_name, user.email || '')

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex items-center space-x-4">
      {showFullProfile && (
        <div className="hidden md:flex md:items-center md:space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <Badge variant="secondary" className={`text-xs ${roleDisplay.color}`}>
              <RoleIcon className="w-3 h-3 mr-1" />
              {roleDisplay.label}
            </Badge>
          </div>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8" key={profile?.avatar_url || 'no-avatar'}>
              <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              <Badge variant="secondary" className={`text-xs w-fit ${roleDisplay.color}`}>
                <RoleIcon className="w-3 h-3 mr-1" />
                {roleDisplay.label}
              </Badge>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          
          {userRole === 'service_provider' && (
            <DropdownMenuItem asChild>
              <Link href="/provider/calendar" className="cursor-pointer">
                <Calendar className="mr-2 h-4 w-4" />
                <span>My Calendar</span>
              </Link>
            </DropdownMenuItem>
          )}
          
          {(userRole === 'business_admin' || userRole === 'super_admin') && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <UserCog className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="cursor-pointer text-red-600 focus:text-red-600"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Simple sign-in prompt for unauthenticated users
export function SignInPrompt() {
  return (
    <div className="text-center py-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Sign in to access this feature
      </h2>
      <p className="text-gray-600 mb-4">
        You need to be signed in to view this content.
      </p>
      <div className="space-x-2">
        <Link href="/auth/signin">
          <Button variant="outline">Sign In</Button>
        </Link>
        <Link href="/auth/signup">
          <Button>Create Account</Button>
        </Link>
      </div>
    </div>
  )
}
