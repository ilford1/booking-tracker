import type { Booking } from '@/types/database'
import type { BookingStatus } from '@/types/booking-workflow'

// Calendar event types
export type CalendarEventType = 
  | 'booking_deadline'      // Booking completion deadline
  | 'deliverable_due'       // Deliverable due date
  | 'delivery_tracking'     // Delivery tracking event
  | 'content_review'        // Content review scheduled
  | 'approval_needed'       // Approval milestone
  | 'payment_due'          // Payment schedule
  | 'campaign_start'       // Campaign start date
  | 'campaign_end'         // Campaign end date
  | 'milestone'            // Custom milestone
  | 'meeting'              // Scheduled meeting/call
  | 'reminder'             // Custom reminder

export type EventPriority = 'low' | 'medium' | 'high' | 'urgent'
export type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'

// Enhanced calendar event
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  type: CalendarEventType
  priority: EventPriority
  status: EventStatus
  
  // Dates
  start_date: Date
  end_date?: Date
  all_day: boolean
  
  // Related entities
  booking_id?: string
  deliverable_id?: string
  campaign_id?: string
  creator_id?: string
  
  // Additional metadata
  color?: string
  url?: string // Link to related entity
  attendees?: string[]
  location?: string
  notes?: string
  
  // Relations (populated by joins)
  booking?: Booking
}

// Calendar view modes
export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda' | 'timeline'

// Filter options for calendar
export interface CalendarFilters {
  event_types: CalendarEventType[]
  statuses: EventStatus[]
  priorities: EventPriority[]
  booking_statuses: BookingStatus[]
  creator_ids: string[]
  campaign_ids: string[]
  date_range: {
    start: Date
    end: Date
  }
}

// Calendar statistics
export interface CalendarStats {
  total_events: number
  overdue_count: number
  due_today: number
  due_this_week: number
  by_type: Record<CalendarEventType, number>
  by_status: Record<EventStatus, number>
  by_priority: Record<EventPriority, number>
}

// Event creation templates
export interface EventTemplate {
  title: string
  description: string
  type: CalendarEventType
  priority: EventPriority
  duration_hours?: number
  all_day?: boolean
  color?: string
}

// Drag and drop result
export interface EventDragResult {
  event_id: string
  old_date: Date
  new_date: Date
  old_end_date?: Date
  new_end_date?: Date
}

// Calendar preferences
export interface CalendarPreferences {
  default_view: CalendarViewMode
  start_hour: number
  end_hour: number
  show_weekends: boolean
  time_format: '12h' | '24h'
  first_day_of_week: 0 | 1 // 0 = Sunday, 1 = Monday
  auto_refresh_minutes: number
  notification_settings: {
    booking_deadlines: boolean
    deliverable_due: boolean
    overdue_items: boolean
    daily_digest: boolean
  }
}

// Form types
export type CreateEventData = Omit<CalendarEvent, 'id' | 'booking'>
export type UpdateEventData = Partial<CreateEventData>
