'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import type { Deliverable, CreateDeliverableData, UpdateDeliverableData, DeliverableStatus } from '@/types'

export async function getDeliverables(): Promise<Deliverable[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
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

  if (error) {
    console.error('Error fetching deliverables:', error)
    throw new Error('Failed to fetch deliverables')
  }

  return data || []
}

export async function getDeliverable(id: string): Promise<Deliverable | null> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('deliverables')
    .select(`
      *,
      booking:bookings(
        *,
        campaign:campaigns(*),
        creator:creators(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching deliverable:', error)
    return null
  }

  return data
}

export async function createDeliverable(deliverableData: CreateDeliverableData) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('deliverables')
    .insert({
      ...deliverableData,
      actor: 'system'
    })
    .select(`
      *,
      booking:bookings(
        *,
        campaign:campaigns(*),
        creator:creators(*)
      )
    `)
    .single()

  if (error) {
    console.error('Error creating deliverable:', error)
    throw new Error('Failed to create deliverable')
  }

  revalidatePath('/deliverables')
  revalidatePath('/calendar')
  return data
}

export async function updateDeliverable(id: string, deliverableData: UpdateDeliverableData) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('deliverables')
    .update({
      ...deliverableData,
      actor: 'system'
    })
    .eq('id', id)
    .select(`
      *,
      booking:bookings(
        *,
        campaign:campaigns(*),
        creator:creators(*)
      )
    `)
    .single()

  if (error) {
    console.error('Error updating deliverable:', error)
    throw new Error('Failed to update deliverable')
  }

  revalidatePath('/deliverables')
  revalidatePath('/calendar')
  revalidatePath(`/deliverables/${id}`)
  return data
}

export async function updateDeliverableStatus(id: string, status: DeliverableStatus) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('deliverables')
    .update({
      status,
      actor: 'system'
    })
    .eq('id', id)
    .select(`
      *,
      booking:bookings(
        *,
        campaign:campaigns(*),
        creator:creators(*)
      )
    `)
    .single()

  if (error) {
    console.error('Error updating deliverable status:', error)
    throw new Error('Failed to update deliverable status')
  }

  revalidatePath('/deliverables')
  revalidatePath('/calendar')
  return data
}

export async function deleteDeliverable(id: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('deliverables')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting deliverable:', error)
    throw new Error('Failed to delete deliverable')
  }

  revalidatePath('/deliverables')
  revalidatePath('/calendar')
}

export async function getDeliverablesByBooking(bookingId: string): Promise<Deliverable[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('deliverables')
    .select(`
      *,
      booking:bookings(
        *,
        campaign:campaigns(*),
        creator:creators(*)
      )
    `)
    .eq('booking_id', bookingId)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching deliverables by booking:', error)
    throw new Error('Failed to fetch deliverables by booking')
  }

  return data || []
}

export async function getDeliverablesByStatus(status: DeliverableStatus): Promise<Deliverable[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('deliverables')
    .select(`
      *,
      booking:bookings(
        *,
        campaign:campaigns(*),
        creator:creators(*)
      )
    `)
    .eq('status', status)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching deliverables by status:', error)
    throw new Error('Failed to fetch deliverables by status')
  }

  return data || []
}

export async function getOverdueDeliverables(): Promise<Deliverable[]> {
  const today = new Date().toISOString().split('T')[0]
  
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('deliverables')
    .select(`
      *,
      booking:bookings(
        *,
        campaign:campaigns(*),
        creator:creators(*)
      )
    `)
    .lt('due_date', today)
    .not('status', 'in', '(posted,approved)')
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching overdue deliverables:', error)
    throw new Error('Failed to fetch overdue deliverables')
  }

  return data || []
}

export async function getUpcomingDeliverables(days: number = 7): Promise<Deliverable[]> {
  const today = new Date()
  const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000))
  
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('deliverables')
    .select(`
      *,
      booking:bookings(
        *,
        campaign:campaigns(*),
        creator:creators(*)
      )
    `)
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', futureDate.toISOString().split('T')[0])
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming deliverables:', error)
    throw new Error('Failed to fetch upcoming deliverables')
  }

  return data || []
}
