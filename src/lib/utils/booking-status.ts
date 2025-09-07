import { createClient } from '@/utils/supabase/client'

export interface BookingWithDeadline {
  id: string
  status: string
  deadline: string | null
  campaign?: { name: string }
  creator?: { name: string; handle?: string }
}

/**
 * Check if a booking is overdue based on its deadline
 * Works with both regular Booking and BookingWithDeadline types
 */
export function isBookingOverdue(booking: any): boolean {
  // Check deadline field
  if (!booking.deadline) return false
  
  // Don't mark as overdue if already completed or canceled
  if (['completed', 'canceled', 'approved'].includes(booking.status)) {
    return false
  }
  
  const deadline = new Date(booking.deadline)
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Set to start of day for fair comparison
  deadline.setHours(0, 0, 0, 0)
  
  return deadline < now
}

/**
 * Get the status badge color based on booking status and deadline
 */
export function getBookingStatusColor(booking: any): string {
  if (isBookingOverdue(booking)) {
    return 'destructive' // Red for overdue
  }
  
  switch (booking.status) {
    case 'pending':
      return 'secondary'
    case 'deal':
      return 'default'
    case 'delivered':
      return 'secondary'
    case 'content_submitted':
      return 'outline'
    case 'approved':
      return 'success'
    case 'completed':
      return 'success'
    default:
      return 'default'
  }
}

/**
 * Get a display status that considers the deadline
 */
export function getDisplayStatus(booking: any): string {
  if (isBookingOverdue(booking)) {
    return 'overdue'
  }
  return booking.status
}

/**
 * Calculate days until deadline or days overdue
 */
export function getDaysUntilDeadline(booking: any): {
  days: number
  isOverdue: boolean
  message: string
} {
  if (!booking.deadline) {
    return {
      days: 0,
      isOverdue: false,
      message: 'No deadline set'
    }
  }
  
  const deadline = new Date(booking.deadline)
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
    
    // Fetch all bookings with deadline
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status, deadline')
      .not('deadline', 'is', null)
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
        const deadline = new Date(booking.deadline)
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
