'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { addDays, startOfDay, endOfDay, format } from 'date-fns'
import type { 
  CalendarEvent, 
  CalendarEventType, 
  EventPriority, 
  EventStatus,
  CalendarStats,
  CreateEventData,
  UpdateEventData
} from '@/types/calendar'
import type { Booking, Deliverable } from '@/types/database'
import type { BookingStatus } from '@/types/booking-workflow'

// Get all calendar events with booking and deliverable relationships
export async function getCalendarEvents(
  startDate?: Date, 
  endDate?: Date
): Promise<CalendarEvent[]> {
  const supabase = await createAdminClient()
  
  // Get events from multiple sources and combine them
  const [bookings, deliverables] = await Promise.all([
    getBookingEvents(startDate, endDate),
    getDeliverableEvents(startDate, endDate)
  ])
  
  // Combine and sort all events
  const allEvents = [...bookings, ...deliverables]
    .sort((a, b) => a.start_date.getTime() - b.start_date.getTime())
  
  return allEvents
}

// Generate calendar events from bookings
async function getBookingEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
  const supabase = await createAdminClient()
  
  let query = supabase
    .from('bookings')
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .order('created_at', { ascending: true })

  if (startDate && endDate) {
    query = query
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
  }

  const { data: bookings, error } = await query

  if (error) {
    console.error('Error fetching bookings for calendar:', error)
    return []
  }

  const events: CalendarEvent[] = []

  bookings?.forEach((booking: Booking) => {
    // Booking deadline event (estimated completion date)
    const estimatedCompletionDays = getEstimatedCompletionDays(booking.status)
    const deadlineDate = addDays(new Date(booking.created_at), estimatedCompletionDays)
    
    events.push({
      id: `booking-deadline-${booking.id}`,
      title: `${booking.creator?.name || 'Unknown'} - ${booking.campaign?.name || 'No Campaign'}`,
      description: `Booking deadline for ${booking.status.replace('_', ' ')} status`,
      type: 'booking_deadline',
      priority: getBookingPriority(booking.status),
      status: getEventStatus(booking.status, deadlineDate),
      start_date: deadlineDate,
      all_day: true,
      booking_id: booking.id,
      campaign_id: booking.campaign_id || undefined,
      creator_id: booking.creator_id || undefined,
      color: getBookingStatusColor(booking.status),
      url: `/bookings/${booking.id}`,
      booking
    })

    // Status milestone events
    if (booking.status === 'content_submitted') {
      events.push({
        id: `approval-needed-${booking.id}`,
        title: `Review Required: ${booking.creator?.name}`,
        description: 'Content submitted and awaiting approval',
        type: 'approval_needed',
        priority: 'high',
        status: 'scheduled',
        start_date: new Date(),
        all_day: false,
        booking_id: booking.id,
        color: '#f59e0b',
        url: `/bookings/${booking.id}`,
        booking
      })
    }
  })

  return events
}

// Generate calendar events from deliverables
async function getDeliverableEvents(startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
  const supabase = await createAdminClient()
  
  let query = supabase
    .from('deliverables')
    .select(`
      *,
      booking:bookings(
        *,
        campaign:campaigns(*),
        creator:creators(*)
      )
    `)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (startDate && endDate) {
    query = query
      .gte('due_date', startDate.toISOString())
      .lte('due_date', endDate.toISOString())
  }

  const { data: deliverables, error } = await query

  if (error) {
    console.error('Error fetching deliverables for calendar:', error)
    return []
  }

  const events: CalendarEvent[] = []

  deliverables?.forEach((deliverable: Deliverable) => {
    if (!deliverable.due_date) return

    const dueDate = new Date(deliverable.due_date)
    
    events.push({
      id: `deliverable-${deliverable.id}`,
      title: `${deliverable.title || deliverable.type} - ${deliverable.booking?.creator?.name || 'Unknown'}`,
      description: `${deliverable.type} deliverable for ${deliverable.booking?.campaign?.name}`,
      type: 'deliverable_due',
      priority: getDeliverablePriority(deliverable.status, dueDate),
      status: getDeliverableEventStatus(deliverable.status, dueDate),
      start_date: dueDate,
      end_date: deliverable.publish_date ? new Date(deliverable.publish_date) : undefined,
      all_day: true,
      booking_id: deliverable.booking_id || undefined,
      deliverable_id: deliverable.id,
      campaign_id: deliverable.booking?.campaign_id || undefined,
      creator_id: deliverable.booking?.creator_id || undefined,
      color: getDeliverableStatusColor(deliverable.status),
      url: `/bookings/${deliverable.booking_id}`,
      deliverable,
      booking: deliverable.booking
    })
  })

  return events
}

// Get calendar statistics
export async function getCalendarStats(
  startDate: Date = startOfDay(new Date()),
  endDate: Date = endOfDay(addDays(new Date(), 30))
): Promise<CalendarStats> {
  const events = await getCalendarEvents(startDate, endDate)
  
  const now = new Date()
  const todayEnd = endOfDay(now)
  const weekEnd = endOfDay(addDays(now, 7))
  
  const stats: CalendarStats = {
    total_events: events.length,
    overdue_count: events.filter(e => 
      e.status === 'overdue' || 
      (e.start_date < now && e.status === 'scheduled')
    ).length,
    due_today: events.filter(e => 
      e.start_date >= startOfDay(now) && e.start_date <= todayEnd
    ).length,
    due_this_week: events.filter(e => 
      e.start_date >= now && e.start_date <= weekEnd
    ).length,
    by_type: {} as Record<CalendarEventType, number>,
    by_status: {} as Record<EventStatus, number>,
    by_priority: {} as Record<EventPriority, number>
  }
  
  // Count by categories
  events.forEach(event => {
    stats.by_type[event.type] = (stats.by_type[event.type] || 0) + 1
    stats.by_status[event.status] = (stats.by_status[event.status] || 0) + 1
    stats.by_priority[event.priority] = (stats.by_priority[event.priority] || 0) + 1
  })
  
  return stats
}

// Create a custom calendar event
export async function createCalendarEvent(eventData: CreateEventData): Promise<CalendarEvent> {
  // For now, we'll store custom events in a separate table
  // This is a placeholder - you'd implement a calendar_events table
  const event: CalendarEvent = {
    ...eventData,
    id: `custom-${Date.now()}`,
  }
  
  revalidatePath('/calendar')
  return event
}

// Update deliverable due date (affects calendar)
export async function updateDeliverableDueDate(
  deliverableId: string, 
  newDueDate: Date
): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('deliverables')
    .update({
      due_date: newDueDate.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', deliverableId)
  
  if (error) {
    console.error('Error updating deliverable due date:', error)
    throw new Error('Failed to update deliverable due date')
  }
  
  revalidatePath('/calendar')
  revalidatePath('/bookings')
}

// Helper functions
function getEstimatedCompletionDays(status: BookingStatus): number {
  const estimations = {
    pending: 7,
    in_process: 14,
    content_submitted: 3,
    approved: 1,
    completed: 0,
    canceled: 0
  }
  return estimations[status] || 7
}

function getBookingPriority(status: BookingStatus): EventPriority {
  switch (status) {
    case 'content_submitted': return 'high'
    case 'approved': return 'urgent'
    case 'in_process': return 'medium'
    default: return 'low'
  }
}

function getDeliverablePriority(status: string, dueDate: Date): EventPriority {
  const now = new Date()
  const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff < 0) return 'urgent' // Overdue
  if (daysDiff <= 1) return 'high'  // Due today/tomorrow
  if (daysDiff <= 3) return 'medium' // Due this week
  return 'low'
}

function getEventStatus(bookingStatus: BookingStatus, eventDate: Date): EventStatus {
  const now = new Date()
  
  if (bookingStatus === 'completed') return 'completed'
  if (bookingStatus === 'canceled') return 'cancelled'
  if (eventDate < now) return 'overdue'
  if (bookingStatus === 'in_process') return 'in_progress'
  return 'scheduled'
}

function getDeliverableEventStatus(deliverableStatus: string, dueDate: Date): EventStatus {
  const now = new Date()
  
  switch (deliverableStatus) {
    case 'posted':
    case 'approved': return 'completed'
    case 'submitted': return 'in_progress'
    default:
      return dueDate < now ? 'overdue' : 'scheduled'
  }
}

function getBookingStatusColor(status: BookingStatus): string {
  const colors = {
    pending: '#f59e0b',      // yellow
    in_process: '#3b82f6',   // blue
    content_submitted: '#8b5cf6', // purple
    approved: '#10b981',     // green
    completed: '#059669',    // emerald
    canceled: '#ef4444'      // red
  }
  return colors[status] || '#6b7280'
}

function getDeliverableStatusColor(status: string): string {
  const colors = {
    planned: '#6b7280',      // gray
    due: '#f59e0b',          // yellow
    submitted: '#8b5cf6',    // purple
    revision: '#f97316',     // orange
    approved: '#10b981',     // green
    scheduled: '#3b82f6',    // blue
    posted: '#059669'        // emerald
  }
  return colors[status] || '#6b7280'
}

// Quick action to mark deliverable as submitted
export async function markDeliverableSubmitted(deliverableId: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('deliverables')
    .update({
      status: 'submitted',
      updated_at: new Date().toISOString()
    })
    .eq('id', deliverableId)
  
  if (error) {
    console.error('Error marking deliverable as submitted:', error)
    throw new Error('Failed to mark deliverable as submitted')
  }
  
  revalidatePath('/calendar')
}

// Reschedule event (placeholder for drag & drop functionality)
export async function rescheduleEvent(eventId: string, startDate: Date, endDate?: Date): Promise<void> {
  // This would typically update the booking or deliverable date
  // For now, we'll just log the action as it would require complex logic
  // to determine if this is a booking deadline or deliverable due date
  
  console.log('Reschedule event:', { eventId, startDate, endDate })
  
  // TODO: Implement actual rescheduling logic based on event type
  // This would need to update either:
  // - booking.publication_date or booking.deadline
  // - deliverable.due_date
  
  // For now, throw an error to indicate this feature needs implementation
  throw new Error('Event rescheduling not yet implemented')
}
