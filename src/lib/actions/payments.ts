'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import type { Payment, CreatePaymentData, UpdatePaymentData, PaymentStatus } from '@/types'

export async function getPayments(): Promise<Payment[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payments')
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
    console.error('Error fetching payments:', error)
    throw new Error('Failed to fetch payments')
  }

  return data || []
}

export async function getPayment(id: string): Promise<Payment | null> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payments')
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
    console.error('Error fetching payment:', error)
    return null
  }

  return data
}

export async function createPayment(paymentData: CreatePaymentData) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payments')
    .insert({
      ...paymentData,
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
    console.error('Error creating payment:', error)
    throw new Error('Failed to create payment')
  }

  revalidatePath('/payments')
  return data
}

export async function updatePayment(id: string, paymentData: UpdatePaymentData) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payments')
    .update({
      ...paymentData,
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
    console.error('Error updating payment:', error)
    throw new Error('Failed to update payment')
  }

  revalidatePath('/payments')
  revalidatePath(`/payments/${id}`)
  return data
}

export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  const updateData: any = {
    status,
    actor: 'system'
  }

  // Set paid_at timestamp when marking as paid
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString()
  }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payments')
    .update(updateData)
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
    console.error('Error updating payment status:', error)
    throw new Error('Failed to update payment status')
  }

  revalidatePath('/payments')
  return data
}

export async function deletePayment(id: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting payment:', error)
    throw new Error('Failed to delete payment')
  }

  revalidatePath('/payments')
}

export async function getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      booking:bookings(
        *,
        campaign:campaigns(*),
        creator:creators(*)
      )
    `)
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching payments by booking:', error)
    throw new Error('Failed to fetch payments by booking')
  }

  return data || []
}

export async function getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payments')
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
    console.error('Error fetching payments by status:', error)
    throw new Error('Failed to fetch payments by status')
  }

  return data || []
}

export async function getOverduePayments(): Promise<Payment[]> {
  const today = new Date().toISOString().split('T')[0]
  
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      booking:bookings(
        *,
        campaign:campaigns(*),
        creator:creators(*)
      )
    `)
    .lt('due_date', today)
    .neq('status', 'paid')
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching overdue payments:', error)
    throw new Error('Failed to fetch overdue payments')
  }

  return data || []
}

export async function getTotalPaymentsByStatus(): Promise<Record<PaymentStatus, { count: number; amount: number }>> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payments')
    .select('status, amount')

  if (error) {
    console.error('Error fetching payment totals:', error)
    throw new Error('Failed to fetch payment totals')
  }

  const totals = data.reduce((acc, payment) => {
    const status = payment.status as PaymentStatus
    if (!acc[status]) {
      acc[status] = { count: 0, amount: 0 }
    }
    acc[status].count += 1
    acc[status].amount += payment.amount || 0
    return acc
  }, {} as Record<PaymentStatus, { count: number; amount: number }>)

  return totals
}
