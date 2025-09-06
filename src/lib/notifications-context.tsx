'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface Notification {
  id: string
  title: string
  message: string
  time: string
  type: 'booking' | 'payment' | 'campaign' | 'creator' | 'reminder'
  read: boolean
  createdAt: Date
}

interface NotificationsContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAllNotifications: () => void
  unreadCount: number
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

const STORAGE_KEY = 'booking-tracker-notifications'

// Initial mock notifications - only used if no stored data
const initialNotifications: Omit<Notification, 'createdAt'>[] = [
  {
    id: '1',
    title: 'New booking request',
    message: '@fashionista_jane wants to collaborate on your Summer Collection campaign',
    time: '2 minutes ago',
    type: 'booking',
    read: false
  },
  {
    id: '2', 
    title: 'Payment received',
    message: '₫2,500,000 payment received for Summer Campaign from Acme Brand',
    time: '1 hour ago',
    type: 'payment',
    read: false
  },
  {
    id: '3',
    title: 'Campaign completed',
    message: 'Your "Tech Product Launch" campaign has been marked as completed',
    time: '2 hours ago',
    type: 'campaign',
    read: true
  },
  {
    id: '4',
    title: 'New creator joined',
    message: '@beauty_influencer has joined your platform and is available for bookings',
    time: '1 day ago',
    type: 'creator',
    read: true
  },
  {
    id: '5',
    title: 'Reminder: Campaign deadline',
    message: 'Your "Skincare Routine" campaign deadline is approaching (2 days left)',
    time: '2 days ago',
    type: 'reminder',
    read: true
  }
]

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedNotifications = JSON.parse(stored).map((notif: any) => ({
          ...notif,
          createdAt: new Date(notif.createdAt)
        }))
        setNotifications(parsedNotifications)
      } else {
        // First time - set initial notifications
        const withCreatedAt = initialNotifications.map(notif => ({
          ...notif,
          createdAt: new Date()
        }))
        setNotifications(withCreatedAt)
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error)
      // Fallback to initial notifications
      const withCreatedAt = initialNotifications.map(notif => ({
        ...notif,
        createdAt: new Date()
      }))
      setNotifications(withCreatedAt)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
      } catch (error) {
        console.error('Failed to save notifications to localStorage:', error)
      }
    }
  }, [notifications, isLoaded])

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    }
    setNotifications(prev => [newNotification, ...prev])
  }

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

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const value: NotificationsContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    unreadCount
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
