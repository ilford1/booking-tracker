'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  BookOpen,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Search,
} from 'lucide-react'

const commands = [
  // Navigation
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'View dashboard and KPIs',
    icon: LayoutDashboard,
    action: () => '/dashboard',
  },
  {
    id: 'creators',
    title: 'Creators',
    description: 'Manage KOL/creator directory',
    icon: Users,
    action: () => '/creators',
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    description: 'Manage marketing campaigns',
    icon: Megaphone,
    action: () => '/campaigns',
  },
  {
    id: 'bookings',
    title: 'Bookings',
    description: 'View booking workflow',
    icon: BookOpen,
    action: () => '/bookings',
  },
  {
    id: 'calendar',
    title: 'Calendar',
    description: 'View deliverables calendar',
    icon: Calendar,
    action: () => '/calendar',
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Manage payments and invoices',
    icon: CreditCard,
    action: () => '/payments',
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'View analytics and performance',
    icon: BarChart3,
    action: () => '/reports',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure system settings',
    icon: Settings,
    action: () => '/settings',
  },
  
  // Quick Actions
  {
    id: 'add-creator',
    title: 'Add Creator',
    description: 'Add new KOL/creator to directory',
    icon: Plus,
    action: () => 'add-creator',
  },
  {
    id: 'add-campaign',
    title: 'Add Campaign',
    description: 'Create new marketing campaign',
    icon: Plus,
    action: () => 'add-campaign',
  },
  {
    id: 'add-booking',
    title: 'Add Booking',
    description: 'Create new creator booking',
    icon: Plus,
    action: () => 'add-booking',
  },
  {
    id: 'search-creators',
    title: 'Search Creators',
    description: 'Find creators by name or tags',
    icon: Search,
    action: () => 'search-creators',
  },
]

interface CommandPaletteProps {
  onOpenChange?: (open: boolean) => void
}

export function CommandPalette({ onOpenChange }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Keyboard shortcut disabled - using global search instead
  // useEffect(() => {
  //   const down = (e: KeyboardEvent) => {
  //     if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
  //       e.preventDefault()
  //       setOpen((open) => !open)
  //     }
  //   }

  //   document.addEventListener('keydown', down)
  //   return () => document.removeEventListener('keydown', down)
  // }, [])

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  const runCommand = (commandAction: string) => {
    setOpen(false)
    
    if (commandAction.startsWith('/')) {
      router.push(commandAction)
    } else {
      // Handle custom actions
      console.log('Execute action:', commandAction)
      // TODO: Implement custom actions like opening forms
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {commands.filter(cmd => cmd.action().startsWith('/')).map((command) => (
            <CommandItem
              key={command.id}
              onSelect={() => runCommand(command.action())}
            >
              <command.icon className="mr-2 h-4 w-4" />
              <div>
                <div>{command.title}</div>
                <div className="text-xs text-muted-foreground">{command.description}</div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Quick Actions">
          {commands.filter(cmd => !cmd.action().startsWith('/')).map((command) => (
            <CommandItem
              key={command.id}
              onSelect={() => runCommand(command.action())}
            >
              <command.icon className="mr-2 h-4 w-4" />
              <div>
                <div>{command.title}</div>
                <div className="text-xs text-muted-foreground">{command.description}</div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

// Hook to use command palette
export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  const toggle = () => setOpen(!open)
  const close = () => setOpen(false)

  return { open, toggle, close, setOpen }
}
