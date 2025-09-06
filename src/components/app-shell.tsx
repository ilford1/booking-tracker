'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  Calendar,
  BookOpen,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Search,
  Bell,
  User,
  Shield,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { CommandPalette } from '@/components/command-palette'
import { GlobalSearch } from '@/components/global-search'
import { useGlobalSearch } from '@/hooks/use-global-search'
import { UserMenu } from '@/components/auth/user-menu'
import { useAuth, useUserPermissions } from '@/lib/auth-context'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Creators', href: '/creators', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Bookings', href: '/bookings', icon: BookOpen },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const globalSearch = useGlobalSearch()
  const { canAccessAdminFeatures } = useUserPermissions()
  
  // Sample notifications state - in real app this would come from a context or API
  const [notifications, setNotifications] = React.useState([
    {
      id: '1',
      title: 'New booking request',
      message: '@fashionista_jane wants to collaborate',
      time: '2 minutes ago',
      type: 'booking',
      read: false
    },
    {
      id: '2', 
      title: 'Payment received',
      message: '₫2,500,000 for Summer Campaign',
      time: '1 hour ago',
      type: 'payment',
      read: false
    }
  ])

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const handleViewAllNotifications = () => {
    router.push('/notifications')
  }

  // Global keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        globalSearch.open()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [globalSearch])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">
                KOL Tracker
              </span>
            </div>

            {/* Navigation */}
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              })}
              
              {/* Admin Panel Link - Only show for admin users */}
              {canAccessAdminFeatures() && (
                <Link
                  href="/admin"
                  className={cn(
                    pathname === '/admin'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <Shield
                    className={cn(
                      pathname === '/admin' ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-5 w-5'
                    )}
                    aria-hidden="true"
                  />
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <div className="flex-1 px-4 flex justify-between items-center">
            {/* Search */}
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full max-w-lg">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 sm:text-sm cursor-pointer"
                    placeholder="Search creators, campaigns..."
                    type="search"
                    readOnly
                    onClick={globalSearch.open}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="ml-4 flex items-center md:ml-6 space-x-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {/* Notification badge */}
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    <Badge variant="secondary" className="text-xs">
                      {notifications.length} new
                    </Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Dynamic notifications */}
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'booking' ? 'bg-blue-500' : 
                            notification.type === 'payment' ? 'bg-green-500' : 'bg-gray-500'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => console.log('Clicked notification:', notification.id)}>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-shrink-0 h-6 w-6 p-0 hover:bg-red-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            dismissNotification(notification.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No new notifications</p>
                    </div>
                  )}
                  
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Button 
                      variant="ghost" 
                      className="w-full text-sm hover:bg-gray-100"
                      onClick={handleViewAllNotifications}
                    >
                      View all notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User menu */}
              <div className="ml-3 relative">
                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        {/* Command Palette */}
        <CommandPalette />
        
        {/* Global Search */}
        <GlobalSearch 
          open={globalSearch.isOpen} 
          onClose={globalSearch.close} 
        />

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
