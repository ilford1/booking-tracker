'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Notification } from '@/types/notification'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationCount
} from '@/lib/actions/notifications'

interface NotificationsContextType {
  notifications: Notification[]
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refresh: () => Promise<void>
  unreadCount: number
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

// Helper function to format relative time
function formatRelativeTime(date: string): string {
  const now = new Date()
  const created = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return created.toLocaleDateString()
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications from database on mount
  const loadNotifications = async () => {
    try {
      setLoading(true)
      // For now, we'll use a hardcoded user ID until we have proper auth
      // In a real app, you'd get this from auth context
      const mockUserId = 'user-123'
      
      const [notificationsData, countData] = await Promise.all([
        getNotifications(mockUserId),
        getNotificationCount(mockUserId)
      ])
      
      // Transform notifications to include relative time
      const transformedNotifications = notificationsData.map(notif => ({
        ...notif,
        time: formatRelativeTime(notif.created_at)
      }))
      
      setNotifications(transformedNotifications)
      setUnreadCount(countData.unread)
      
    } catch (error) {
      console.error('Failed to load notifications:', error)
      toast.error('Failed to load notifications')
      // For demo purposes, we'll still show empty state rather than crash
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      
      // Update local state for immediate UI feedback
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true, read_at: new Date().toISOString() } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      const mockUserId = 'user-123' // Same as above
      await markAllNotificationsAsRead(mockUserId)
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
      
      toast.success('All notifications marked as read')
      
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
  }

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id)
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      toast.success('Notification deleted')
      
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const refresh = async () => {
    await loadNotifications()
  }

  const value: NotificationsContextType = {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification: handleDeleteNotification,
    refresh,
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
