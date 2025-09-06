'use client'

import React from 'react'
import { AppShell } from '@/components/app-shell'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Check, 
  X, 
  Calendar,
  CreditCard,
  Users,
  Megaphone,
  Clock
} from 'lucide-react'

const mockNotifications = [
  {
    id: '1',
    title: 'New booking request',
    message: '@fashionista_jane wants to collaborate on your Summer Collection campaign',
    time: '2 minutes ago',
    type: 'booking',
    read: false,
    icon: Calendar,
    color: 'bg-blue-500'
  },
  {
    id: '2', 
    title: 'Payment received',
    message: '₫2,500,000 payment received for Summer Campaign from Acme Brand',
    time: '1 hour ago',
    type: 'payment',
    read: false,
    icon: CreditCard,
    color: 'bg-green-500'
  },
  {
    id: '3',
    title: 'Campaign completed',
    message: 'Your "Tech Product Launch" campaign has been marked as completed',
    time: '2 hours ago',
    type: 'campaign',
    read: true,
    icon: Megaphone,
    color: 'bg-purple-500'
  },
  {
    id: '4',
    title: 'New creator joined',
    message: '@beauty_influencer has joined your platform and is available for bookings',
    time: '1 day ago',
    type: 'creator',
    read: true,
    icon: Users,
    color: 'bg-orange-500'
  },
  {
    id: '5',
    title: 'Reminder: Campaign deadline',
    message: 'Your "Skincare Routine" campaign deadline is approaching (2 days left)',
    time: '2 days ago',
    type: 'reminder',
    read: true,
    icon: Clock,
    color: 'bg-yellow-500'
  }
]

function NotificationsContent() {
  const [notifications, setNotifications] = React.useState(mockNotifications)

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-gray-700" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-500 mt-1">
                  Stay updated with your latest activities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Badge variant="secondary" className="px-3 py-1">
                  {unreadCount} unread
                </Badge>
              )}
              <Button variant="outline" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const IconComponent = notification.icon
              return (
                <Card key={notification.id} className={`transition-all duration-200 hover:shadow-md ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-2 rounded-full ${notification.color} text-white flex-shrink-0`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={`text-base font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {notification.time}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No notifications
                </h3>
                <p className="text-gray-500">
                  You're all caught up! New notifications will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute requiredRoles={['customer', 'service_provider', 'business_admin', 'super_admin']}>
      <NotificationsContent />
    </ProtectedRoute>
  )
}
