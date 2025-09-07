// Notification system types
export type NotificationType = 
  | 'booking' 
  | 'payment' 
  | 'campaign' 
  | 'creator' 
  | 'reminder'
  | 'system'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export type Notification = {
  id: string
  user_id: string  // Which user this notification belongs to
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  read: boolean
  read_at?: string | null
  // Optional metadata for context
  related_id?: string | null  // ID of related booking, payment, etc.
  related_type?: 'booking' | 'payment' | 'campaign' | 'creator' | null
  action_url?: string | null  // URL to navigate to when clicked
  expires_at?: string | null  // When this notification expires
  actor: string  // Who/what generated this notification
  created_at: string
  updated_at: string
}

// Form types
export type CreateNotificationData = Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'actor' | 'read' | 'read_at'>
export type UpdateNotificationData = Partial<Pick<Notification, 'read' | 'read_at'>>

// Helper types for generating notifications
export interface NotificationTemplate {
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  action_url?: string
  expires_at?: Date
}

// Event-driven notification triggers
export interface NotificationEvent {
  event_type: 'booking_created' | 'booking_status_changed' | 'payment_received' | 'payment_failed' | 'campaign_completed' | 'creator_joined' | 'reminder_due'
  user_id: string
  related_id?: string
  related_type?: 'booking' | 'payment' | 'campaign' | 'creator'
  data?: Record<string, any>
}
