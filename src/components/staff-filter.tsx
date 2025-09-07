'use client'

import React from 'react'
import { Check, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { UserAvatar } from '@/components/ui/user-avatar'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/types/database'

interface StaffFilterProps {
  users: UserProfile[]
  currentUser?: UserProfile | null
  selectedUserId?: string | null
  onUserSelect: (userId: string | null) => void
  className?: string
}

export function StaffFilter({ 
  users, 
  currentUser, 
  selectedUserId, 
  onUserSelect, 
  className = '' 
}: StaffFilterProps) {
  const [open, setOpen] = React.useState(false)

  const selectedUser = users.find(user => user.id === selectedUserId)
  
  const getDisplayText = () => {
    if (!selectedUserId) return 'All Staff'
    if (selectedUserId === currentUser?.id) return 'My Bookings'
    return selectedUser ? 
      (selectedUser.first_name && selectedUser.last_name ? 
        `${selectedUser.first_name} ${selectedUser.last_name}` : 
        selectedUser.first_name || selectedUser.last_name || 'Unknown') 
      : 'Unknown Staff'
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between min-w-[200px]', className)}
        >
          <div className="flex items-center gap-2">
            {selectedUserId ? (
              selectedUserId === currentUser?.id ? (
                <User className="h-4 w-4" />
              ) : (
                <UserAvatar user={selectedUser} size="sm" />
              )
            ) : (
              <Users className="h-4 w-4" />
            )}
            <span className="truncate">{getDisplayText()}</span>
          </div>
          <div className="ml-2 h-4 w-4 shrink-0 opacity-50">
            ⌄
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search staff..." />
          <CommandList>
            <CommandEmpty>No staff found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all-staff"
                onSelect={() => {
                  onUserSelect(null)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedUserId === null ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <Users className="mr-2 h-4 w-4" />
                All Staff
              </CommandItem>
              
              {currentUser && (
                <CommandItem
                  value="my-bookings"
                  onSelect={() => {
                    onUserSelect(currentUser.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedUserId === currentUser.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <User className="mr-2 h-4 w-4" />
                  My Bookings
                </CommandItem>
              )}
              
              {users
                .filter(user => user.id !== currentUser?.id)
                .map((user) => {
                  const displayName = user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}`
                    : user.first_name || user.last_name || 'Unknown'
                  
                  return (
                    <CommandItem
                      key={user.id}
                      value={displayName}
                      onSelect={() => {
                        onUserSelect(user.id)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedUserId === user.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <UserAvatar 
                        user={user} 
                        size="sm" 
                        showName 
                        showRole 
                        className="flex-1" 
                      />
                    </CommandItem>
                  )
                })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
