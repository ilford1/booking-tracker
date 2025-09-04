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
    .insert({
      ...bookingData,
      actor: 'system'
    })
    .select(`
      *,
      campaign:campaigns(*),
      creator:creators(*)
    `)
    .single()

  if (error) {
    console.error('Error creating booking:', error)
    throw new Error('Failed to create booking')
  }

  revalidatePath('/bookings')
  return data
}

export async function updateBooking(id: string, bookingData: UpdateBookingData) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('bookings')
    .update({
      ...bookingData,
      actor: 'system'
    })
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
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status,
      actor: 'system'
    })
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

  revalidatePath('/bookings')
  revalidatePath(`/bookings/${id}`)
  return data
}

export async function deleteBooking(id: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting booking:', error)
    throw new Error('Failed to delete booking')
  }

  revalidatePath('/bookings')
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
