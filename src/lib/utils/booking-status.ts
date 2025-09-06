import { createClient } from '@/utils/supabase/client'

export interface BookingWithDeadline {
  id: string
  status: string
  scheduled_date: string | null
  content_type: string | null
  campaign_name?: string
  creator_username?: string
}

/**
 * Check if a booking is overdue based on its scheduled_date
 */
export function isBookingOverdue(booking: BookingWithDeadline): boolean {
  if (!booking.scheduled_date) return false
  
  // Don't mark as overdue if already completed or canceled
  if (['completed', 'canceled', 'approved'].includes(booking.status)) {
    return false
  }
  
  const deadline = new Date(booking.scheduled_date)
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Set to start of day for fair comparison
  deadline.setHours(0, 0, 0, 0)
  
  return deadline < now
}

/**
 * Get the status badge color based on booking status and deadline
 */
export function getBookingStatusColor(booking: BookingWithDeadline): string {
  if (isBookingOverdue(booking)) {
    return 'destructive' // Red for overdue
  }
  
  switch (booking.status) {
    case 'pending':
      return 'secondary'
    case 'in_process':
      return 'default'
    case 'content_submitted':
      return 'outline'
    case 'approved':
      return 'success'
    case 'completed':
      return 'success'
    case 'canceled':
      return 'destructive'
    default:
      return 'default'
  }
}

/**
 * Get a display status that considers the deadline
 */
export function getDisplayStatus(booking: BookingWithDeadline): string {
  if (isBookingOverdue(booking)) {
    return 'overdue'
  }
  return booking.status
}

/**
 * Calculate days until deadline or days overdue
 */
export function getDaysUntilDeadline(booking: BookingWithDeadline): {
  days: number
  isOverdue: boolean
  message: string
} {
  if (!booking.scheduled_date) {
    return {
      days: 0,
      isOverdue: false,
      message: 'No deadline set'
    }
  }
  
  const deadline = new Date(booking.scheduled_date)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  deadline.setHours(0, 0, 0, 0)
  
  const diffTime = deadline.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return {
      days: Math.abs(diffDays),
      isOverdue: true,
      message: `${Math.abs(diffDays)} days overdue`
    }
  } else if (diffDays === 0) {
    return {
      days: 0,
      isOverdue: false,
      message: 'Due today'
    }
  } else if (diffDays === 1) {
    return {
      days: 1,
      isOverdue: false,
      message: 'Due tomorrow'
    }
  } else {
    return {
      days: diffDays,
      isOverdue: false,
      message: `Due in ${diffDays} days`
    }
  }
}

/**
 * Batch update overdue bookings in the database
 */
export async function updateOverdueBookings() {
  try {
    const supabase = createClient()
    
    // Fetch all bookings with scheduled_date
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status, scheduled_date')
      .not('scheduled_date', 'is', null)
      .not('status', 'in', '(completed,canceled,approved)')
    
    if (fetchError) {
      console.error('Error fetching bookings for overdue check:', fetchError)
      return { success: false, error: fetchError }
    }
    
    if (!bookings || bookings.length === 0) {
      return { success: true, updated: 0 }
    }
    
    // Find overdue bookings
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    const overdueBookingIds = bookings
      .filter(booking => {
        const deadline = new Date(booking.scheduled_date)
        deadline.setHours(0, 0, 0, 0)
        return deadline < now && !['completed', 'canceled', 'approved'].includes(booking.status)
      })
      .map(booking => booking.id)
    
    if (overdueBookingIds.length === 0) {
      return { success: true, updated: 0 }
    }
    
    // Update status to indicate overdue (you might want to add an 'overdue' status to your enum)
    // For now, we'll add a note to the booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        notes: supabase.rpc('concat_text', { 
          original: 'notes', 
          addition: '[OVERDUE] Deadline has passed. ' 
        })
      })
      .in('id', overdueBookingIds)
    
    if (updateError) {
      console.error('Error updating overdue bookings:', updateError)
      return { success: false, error: updateError }
    }
    
    return { success: true, updated: overdueBookingIds.length }
  } catch (error) {
    console.error('Unexpected error in updateOverdueBookings:', error)
    return { success: false, error }
  }
}
