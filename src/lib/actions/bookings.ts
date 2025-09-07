'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import type { Booking, CreateBookingData, UpdateBookingData, BookingStatus } from '@/types'

export async function getBookings(): Promise<Booking[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookings:', error)
    throw new Error('Failed to fetch bookings')
  }

  return data || []
}

export async function getBooking(id: string): Promise<Booking | null> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching booking:', error)
    return null
  }

  return data
}

export async function createBooking(bookingData: CreateBookingData) {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
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
    console.error('Error updating booking:', error)
    throw new Error('Failed to update booking')
  }

  revalidatePath('/bookings')
  revalidatePath(`/bookings/${id}`)
  return data
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const supabase = await createAdminClient()
  
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

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .single()

  if (error) {
    console.error('Error updating booking status:', error)
    throw new Error('Failed to update booking status')
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
  
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting booking:', error)
    throw new Error(`Failed to delete booking: ${error.message}`)
  }

  console.log('Server action: Booking deleted successfully')
  
  // Invalidate multiple paths and force refresh
  revalidatePath('/bookings', 'page')
  revalidatePath('/', 'layout')
  
  return { success: true }
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
