'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import type { 
  Notification, 
  CreateNotificationData, 
  UpdateNotificationData,
  NotificationEvent,
  NotificationTemplate
} from '@/types/notification'

export async function getNotifications(userId?: string): Promise<Notification[]> {
  try {
    const supabase = await createAdminClient()
    
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    // If userId is provided, filter by user, otherwise get all for current user
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      // If the table doesn't exist, return empty array instead of throwing
      if (error.code === 'PGRST205' || error.message?.includes('notifications')) {
        console.log('Notifications table not found or error, returning empty array')
        return []
      }
      // For other errors, also return empty array to prevent app crashes
      console.log('Returning empty array due to error')
      return []
    }

    return data || []
  } catch (err) {
    console.error('Unexpected error in getNotifications:', err)
    return []
  }
}

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching unread notifications:', error)
      // Return empty array for any error to prevent app crashes
      return []
    }

    return data || []
  } catch (err) {
    console.error('Unexpected error in getUnreadNotifications:', err)
    return []
  }
}

export async function getNotificationCount(userId: string): Promise<{ total: number; unread: number }> {
  try {
    const supabase = await createAdminClient()
    
    const [totalResult, unreadResult] = await Promise.all([
      supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false)
    ])

    if (totalResult.error || unreadResult.error) {
      const error = totalResult.error || unreadResult.error
      console.error('Error getting notification counts:', error)
      // Return zero counts for any error to prevent app crashes
      return { total: 0, unread: 0 }
    }

    return {
      total: totalResult.count || 0,
      unread: unreadResult.count || 0
    }
  } catch (err) {
    console.error('Unexpected error in getNotificationCount:', err)
    return { total: 0, unread: 0 }
  }
}

export async function createNotification(notificationData: CreateNotificationData): Promise<Notification | null> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      // If table doesn't exist, return null instead of throwing
      if (error.code === 'PGRST205' || error.message?.includes('notifications')) {
        console.log('Notifications table not found, skipping notification creation')
        return null
      }
      // For other errors, also return null to prevent crashes
      return null
    }

    revalidatePath('/notifications')
    return data
  } catch (err) {
    console.error('Unexpected error in createNotification:', err)
    return null
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<Notification | null> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) {
      console.error('Error marking notification as read:', error)
      return null
    }

    revalidatePath('/notifications')
    return data
  } catch (err) {
    console.error('Unexpected error in markNotificationAsRead:', err)
    return null
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('notifications')
    .update({ 
      read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    // If the table doesn't exist, just log and return instead of throwing
    if (error.code === 'PGRST205') {
      console.log('Notifications table not found, skipping mark as read')
      return
    }
    throw new Error('Failed to mark all notifications as read')
  }

  revalidatePath('/notifications')
}

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('Error deleting notification:', error)
      // Don't throw, just log the error
      return
    }

    revalidatePath('/notifications')
  } catch (err) {
    console.error('Unexpected error in deleteNotification:', err)
  }
}

export async function deleteAllReadNotifications(userId: string): Promise<void> {
  try {
    const supabase = await createAdminClient()
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true)

    if (error) {
      console.error('Error deleting read notifications:', error)
      // Don't throw, just log the error
      return
    }

    revalidatePath('/notifications')
  } catch (err) {
    console.error('Unexpected error in deleteAllReadNotifications:', err)
  }
}

// Utility functions for generating notifications from events
export async function generateNotificationFromEvent(event: NotificationEvent): Promise<void> {
  try {
    const template = getNotificationTemplate(event)
    if (!template) return

    await createNotification({
      user_id: event.user_id,
      title: template.title,
      message: template.message,
      type: template.type,
      priority: template.priority,
      related_id: event.related_id || null,
      related_type: event.related_type || null,
      action_url: template.action_url || null,
      expires_at: template.expires_at?.toISOString() || null
    })
  } catch (err) {
    console.error('Error generating notification from event:', err)
    // Don't throw - just log and continue
  }
}

// Helper function to get notification templates based on event type
function getNotificationTemplate(event: NotificationEvent): NotificationTemplate | null {
  const { event_type, data } = event

  switch (event_type) {
    case 'booking_created':
      return {
        title: 'New Booking Created',
        message: `A new booking has been created${data?.campaign_name ? ` for ${data.campaign_name}` : ''}`,
        type: 'booking',
        priority: 'medium',
        action_url: event.related_id ? `/bookings/${event.related_id}` : '/bookings'
      }

    case 'booking_status_changed':
      return {
        title: 'Booking Status Updated',
        message: `Booking status changed to ${data?.new_status?.replace('_', ' ') || 'updated'}${data?.campaign_name ? ` for ${data.campaign_name}` : ''}`,
        type: 'booking',
        priority: 'medium',
        action_url: event.related_id ? `/bookings/${event.related_id}` : '/bookings'
      }

    case 'payment_received':
      return {
        title: 'Payment Received',
        message: `Payment of ${data?.amount || 'unknown amount'} has been received${data?.campaign_name ? ` for ${data.campaign_name}` : ''}`,
        type: 'payment',
        priority: 'high',
        action_url: event.related_id ? `/payments/${event.related_id}` : '/payments'
      }

    case 'payment_failed':
      return {
        title: 'Payment Failed',
        message: `Payment failed${data?.campaign_name ? ` for ${data.campaign_name}` : ''}. Please check payment details.`,
        type: 'payment',
        priority: 'urgent',
        action_url: event.related_id ? `/payments/${event.related_id}` : '/payments'
      }

    case 'campaign_completed':
      return {
        title: 'Campaign Completed',
        message: `Campaign "${data?.campaign_name || 'Unknown'}" has been completed`,
        type: 'campaign',
        priority: 'medium',
        action_url: event.related_id ? `/campaigns/${event.related_id}` : '/campaigns'
      }

    case 'creator_joined':
      return {
        title: 'New Creator Joined',
        message: `${data?.creator_name || 'A new creator'} has joined the platform`,
        type: 'creator',
        priority: 'low',
        action_url: event.related_id ? `/creators/${event.related_id}` : '/creators'
      }

    case 'reminder_due':
      return {
        title: data?.title || 'Reminder',
        message: data?.message || 'You have a pending task that requires attention',
        type: 'reminder',
        priority: 'medium',
        action_url: data?.action_url || null,
        expires_at: data?.expires_at ? new Date(data.expires_at) : undefined
      }

    default:
      return null
  }
}

// Cleanup function to remove expired notifications
export async function cleanupExpiredNotifications(): Promise<void> {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error cleaning up expired notifications:', error)
    throw new Error('Failed to cleanup expired notifications')
  }

  revalidatePath('/notifications')
}
