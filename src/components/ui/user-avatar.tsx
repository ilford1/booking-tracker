import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { UserProfile } from '@/types/database'

interface UserAvatarProps {
  user?: UserProfile | null
  size?: 'sm' | 'md' | 'lg'
  showRole?: boolean
  showName?: boolean
  className?: string
}

export function UserAvatar({ 
  user, 
  size = 'sm', 
  showRole = false, 
  showName = false, 
  className = '' 
}: UserAvatarProps) {
  if (!user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className={getAvatarSize(size)}>
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        {showName && <span className="text-sm text-gray-500">Unknown</span>}
      </div>
    )
  }

  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user.first_name || user.last_name || 'Unknown'
  
  const initials = getInitials(displayName)
  const roleColor = getRoleColor(user.user_role)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className={getAvatarSize(size)}>
        {user.avatar_url && (
          <AvatarImage src={user.avatar_url} alt={displayName} />
        )}
        <AvatarFallback className={`bg-gray-100 text-gray-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col">
        {showName && (
          <span className={`font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {displayName}
          </span>
        )}
        {showRole && (
          <Badge 
            variant="outline" 
            className={`text-xs ${roleColor} w-fit`}
          >
            {formatRole(user.user_role)}
          </Badge>
        )}
      </div>
    </div>
  )
}

function getAvatarSize(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'h-6 w-6'
    case 'md':
      return 'h-8 w-8'
    case 'lg':
      return 'h-10 w-10'
    default:
      return 'h-6 w-6'
  }
}

function getInitials(name: string): string {
  const words = name.split(' ')
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'super_admin':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'business_admin':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'service_provider':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'customer':
      return 'bg-gray-50 text-gray-700 border-gray-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

function formatRole(role: string): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin'
    case 'business_admin':
      return 'Admin'
    case 'service_provider':
      return 'Staff'
    case 'customer':
      return 'Customer'
    default:
      return 'Unknown'
  }
}
