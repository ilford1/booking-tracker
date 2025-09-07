'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import type { Booking, CreateBookingData, UpdateBookingData, BookingStatus } from '@/types'

export async function getBookings(): Promise<Booking[]> {
  const supabase = await createAdminClient()
  
  try {
    // Try with all columns including user profiles
    let { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        campaign:campaigns(*),
        creator:creators(*)
      `)
      .order('created_at', { ascending: false })
      
    // If successful, try to enrich with user data
    if (!error && data) {
      const userIds = data.map(b => b.actor).filter(Boolean)
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, avatar_url, user_role')
          .in('id', userIds)
          
        // Map user data to bookings
        data = data.map(booking => ({
          ...booking,
          created_by: users?.find(user => user.id === booking.actor) || null
        }))
      }
    }

    if (error) {
      console.error('Error fetching bookings:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`Failed to fetch bookings: ${error.message || error.details || 'Unknown error'}`)
    }

    // Transform the data to ensure consistent structure
    const bookings = (data || []).map(booking => ({
      ...booking,
      // Ensure deadline field exists (fallback to scheduled_date if available)
      deadline: booking.deadline || (booking as any).scheduled_date || null,
      // Ensure actor field exists (fallback to created_by if available)
      actor: booking.actor || (booking as any).created_by || null,
      // created_by is already set from the user enrichment above
    }))

    return bookings
  } catch (error) {
    console.error('Error in getBookings:', error)
    throw error
  }
}

export async function getBooking(id: string): Promise<Booking | null> {
  const supabase = await createAdminClient()
  
  try {
    let { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        campaign:campaigns(*),
        creator:creators(*)
      `)
      .eq('id', id)
      .single()
      
    // If successful, try to enrich with user data
    if (!error && data && data.actor) {
      const { data: user } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url, user_role')
        .eq('id', data.actor)
        .single()
        
      if (user) {
        data.created_by = user
      }
    }

    if (error) {
      console.error('Error fetching booking:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    if (!data) return null

    // Transform the data to ensure consistent structure
    return {
      ...data,
      // Ensure deadline field exists (fallback to scheduled_date if available)
      deadline: data.deadline || (data as any).scheduled_date || null,
      // Ensure actor field exists (fallback to created_by if available)
      actor: data.actor || (data as any).created_by || null,
      // created_by is already set from the user enrichment above
    }
  } catch (error) {
    console.error('Error in getBooking:', error)
    return null
  }
}

export async function createBooking(bookingData: CreateBookingData) {
  const supabase = await createAdminClient()
  
  // Get current user to set as actor if not already set
  let actorId = (bookingData as any).actor
  if (!actorId) {
    const { data: { user } } = await supabase.auth.getUser()
    actorId = user?.id || null
  }
  
  const enrichedBookingData = {
    ...bookingData,
    actor: actorId
  }
  
  const { data, error } = await supabase
    .from('bookings')
    .insert(enrichedBookingData)
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .single()

  if (error) {
    console.error('Error creating booking:', error)
    throw new Error(`Failed to create booking: ${error.message || error.code || 'Unknown error'}`)
  }

  revalidatePath('/bookings')
  return data
}

export async function updateBooking(id: string, bookingData: UpdateBookingData) {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('bookings')
    .update(bookingData)
    .eq('id', id)
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .single()

  if (error) {
    console.error('Error updating booking:', { id, bookingData, error })
    throw new Error(`Failed to update booking: ${error.message || error.details || 'Unknown error'}`)
  }

  revalidatePath('/bookings')
  revalidatePath(`/bookings/${id}`)
  return data
}

export async function updateBookingOwnership(id: string, newOwnerId: string) {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('bookings')
    .update({ actor: newOwnerId })
    .eq('id', id)
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .single()

  if (error) {
    console.error('Error updating booking ownership:', { id, newOwnerId, error })
    throw new Error(`Failed to update booking ownership: ${error.message || error.details || 'Unknown error'}`)
  }

  revalidatePath('/bookings')
  revalidatePath(`/bookings/${id}`)
  return data
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const supabase = await createAdminClient()
  
  console.log('🔄 Updating booking status:', { id, status, validStatuses: ['pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed'] })
  
  // First get the current booking to check for changes
  const { data: currentBooking } = await supabase
    .from('bookings')
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .eq('id', id)
    .single()

  if (!currentBooking) {
    throw new Error('Booking not found')
  }

  console.log('📝 About to update:', { currentStatus: currentBooking.status, newStatus: status })
  
  const updateData = { 
    status, 
    updated_at: new Date().toISOString() 
  }
  
  console.log('📦 Update data:', updateData)
  
  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .single()

  if (error) {
    console.error('Error updating booking status:', { id, status, currentStatus: currentBooking.status, error })
    throw new Error(`Failed to update booking status from ${currentBooking.status} to ${status}: ${error.message || error.details || 'Unknown error'}`)
  }

  // Generate notification if status actually changed
  if (currentBooking && currentBooking.status !== status) {
    try {
      const { generateNotificationFromEvent } = await import('./notifications')
      
      // Generate notification for the creator (if they exist)
      if (data.creator_id) {
        await generateNotificationFromEvent({
          event_type: 'booking_status_changed',
          user_id: data.creator_id,
          related_id: data.id,
          related_type: 'booking',
          data: {
            old_status: currentBooking.status,
            new_status: status,
            campaign_name: data.campaign?.name
          }
        })
      }
      
      // You could also generate notifications for other stakeholders here
      // e.g., campaign managers, brand contacts, etc.
      
    } catch (notificationError) {
      // Don't fail the main operation if notifications fail
      console.error('Failed to generate notification for booking status change:', notificationError)
    }
  }

  revalidatePath('/bookings')
  revalidatePath(`/bookings/${id}`)
  return data
}

export async function deleteBooking(id: string) {
  const supabase = await createAdminClient()
  
  console.log('Server action: Deleting booking with ID:', id)
  
  // First verify the booking exists
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', id)
    .single()
  
  if (!existingBooking) {
    throw new Error('Booking not found')
  }
  
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting booking:', error)
    throw new Error(`Failed to delete booking: ${error.message}`)
  }

  console.log('Server action: Booking deleted successfully')
  
  // More aggressive cache invalidation
  revalidatePath('/bookings')
  revalidatePath('/bookings', 'page')
  revalidatePath('/bookings', 'layout')
  revalidatePath('/')
  revalidatePath('/', 'layout')
  
  return { success: true, deletedId: id }
}

export async function getBookingsByStatus(status: BookingStatus): Promise<Booking[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings by status:', error)
    throw new Error('Failed to fetch bookings by status')
  }

  return data || []
}

export async function getBookingsByCreator(creatorId: string): Promise<Booking[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings by creator:', error)
    throw new Error('Failed to fetch bookings by creator')
  }

  return data || []
}

export async function getBookingsByCampaign(campaignId: string): Promise<Booking[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings by campaign:', error)
    throw new Error('Failed to fetch bookings by campaign')
  }

  return data || []
}

export async function getBookingStatusCounts() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('status')

  if (error) {
    console.error('Error fetching booking status counts:', error)
    throw new Error('Failed to fetch booking status counts')
  }

  const statusCounts = data.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return statusCounts
}
