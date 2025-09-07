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
import type { Booking } from '@/types/database'
import type { BookingStatus } from '@/types/booking-workflow'

// Get all calendar events from bookings only (simplified workflow)
export async function getCalendarEvents(
  startDate?: Date, 
  endDate?: Date
): Promise<CalendarEvent[]> {
  const supabase = await createAdminClient()
  
  // Get events from bookings only
  const bookings = await getBookingEvents(startDate, endDate)
  
  // Sort events by date
  const allEvents = bookings.sort((a, b) => a.start_date.getTime() - b.start_date.getTime())
  
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

  // Filter by deadline if dates provided, otherwise use created_at
  if (startDate && endDate) {
    query = query
      .or(`deadline.gte.${startDate.toISOString().split('T')[0]},created_at.gte.${startDate.toISOString()}`)
      .or(`deadline.lte.${endDate.toISOString().split('T')[0]},created_at.lte.${endDate.toISOString()}`)
  }

  const { data: bookings, error } = await query

  if (error) {
    console.error('Error fetching bookings for calendar:', error)
    return []
  }

  const events: CalendarEvent[] = []

  bookings?.forEach((booking: Booking) => {
    // Use deadline if available, otherwise estimate from created_at
    let deadlineDate: Date
    
    if (booking.deadline) {
      deadlineDate = new Date(booking.deadline)
    } else {
      const estimatedCompletionDays = getEstimatedCompletionDays(booking.status)
      deadlineDate = addDays(new Date(booking.created_at), estimatedCompletionDays)
    }
    
    events.push({
      id: `booking-deadline-${booking.id}`,
      title: `${booking.creator?.name || 'Unknown'} - ${booking.campaign?.name || 'No Campaign'}`,
      description: `Estimated deadline - ${booking.status.replace('_', ' ')} status`,
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

    // Add delivery tracking event for delivered status
    if (booking.status === 'delivered' && booking.tracking_number) {
      events.push({
        id: `delivery-tracking-${booking.id}`,
        title: `Delivery: ${booking.creator?.name} - ${booking.tracking_number}`,
        description: `Package delivered, awaiting confirmation`,
        type: 'delivery_tracking',
        priority: 'medium',
        status: 'scheduled',
        start_date: booking.delivered_at ? new Date(booking.delivered_at) : new Date(),
        all_day: false,
        booking_id: booking.id,
        color: '#fb923c',
        url: `/bookings/${booking.id}`,
        booking
      })
    }

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

// Deliverable events removed - simplified to booking-only workflow

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

// Update booking deadline (affects calendar)
export async function updateBookingDeadline(
  bookingId: string, 
  newDeadline: Date
): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('bookings')
    .update({
      deadline: newDeadline.toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
  
  if (error) {
    console.error('Error updating booking deadline:', error)
    throw new Error('Failed to update booking deadline')
  }
  
  revalidatePath('/calendar')
  revalidatePath('/bookings')
}

// Helper functions
function getEstimatedCompletionDays(status: BookingStatus): number {
  const estimations = {
    pending: 14,
    deal: 10,
    delivered: 7,
    content_submitted: 3,
    approved: 1,
    completed: 0
  }
  return estimations[status] || 7
}

function getBookingPriority(status: BookingStatus): EventPriority {
  switch (status) {
    case 'pending': return 'low'
    case 'deal': return 'medium'
    case 'delivered': return 'medium'
    case 'content_submitted': return 'high'
    case 'approved': return 'urgent'
    default: return 'low'
  }
}

// Deliverable priority function removed - no longer needed

function getEventStatus(bookingStatus: BookingStatus, eventDate: Date): EventStatus {
  const now = new Date()
  
  if (bookingStatus === 'completed') return 'completed'
  if (eventDate < now) return 'overdue'
  if (bookingStatus === 'content_submitted' || bookingStatus === 'approved') return 'in_progress'
  return 'scheduled'
}

// Deliverable event status function removed - no longer needed

function getBookingStatusColor(status: BookingStatus): string {
  const colors = {
    pending: '#f59e0b',      // yellow
    deal: '#3b82f6',         // blue
    delivered: '#fb923c',    // orange
    content_submitted: '#8b5cf6', // purple
    approved: '#10b981',     // green
    completed: '#059669'     // emerald
  }
  return colors[status] || '#6b7280'
}

// Deliverable status color function removed - no longer needed

// Quick action to update booking tracking number
export async function updateBookingTrackingNumber(bookingId: string, trackingNumber: string): Promise<void> {
  const supabase = await createAdminClient()
  
  // First update just the tracking fields
  const { error: trackingError } = await supabase
    .from('bookings')
    .update({
      tracking_number: trackingNumber,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
  
  if (trackingError) {
    console.error('Error updating tracking number:', trackingError)
    throw new Error('Failed to update tracking number')
  }
  
  // Then update the status separately using updateBookingStatus
  try {
    const { updateBookingStatus } = await import('./bookings')
    await updateBookingStatus(bookingId, 'delivered')
  } catch (statusError) {
    console.error('Error updating status to delivered:', statusError)
    // Don't throw here as the tracking number was already saved
    console.warn('Tracking number saved but status update failed')
  }
  
  revalidatePath('/calendar')
  revalidatePath('/bookings')
}

// Reschedule event (simplified for booking-only workflow)
export async function rescheduleEvent(eventId: string, startDate: Date, endDate?: Date): Promise<void> {
  // Extract booking ID from event ID
  const bookingId = eventId.replace('booking-deadline-', '').replace('delivery-tracking-', '').replace('approval-needed-', '')
  
  console.log('Reschedule event:', { eventId, bookingId, startDate, endDate })
  
  // Update booking deadline
  try {
    await updateBookingDeadline(bookingId, startDate)
  } catch (error) {
    console.error('Failed to reschedule booking:', error)
    throw new Error('Failed to reschedule booking event')
  }
}
