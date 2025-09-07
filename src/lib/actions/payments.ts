'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/utils/supabase/server'
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

  return (data || []).map(processPaymentData)
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

  return data ? processPaymentData(data) : null
}

export async function createPayment(paymentData: CreatePaymentData) {
  const supabase = await createAdminClient()
  const clientSupabase = await createClient()
  
  // Get current user for actor field
  const { data: { user }, error: userError } = await clientSupabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Map status to database-compatible value
  const dbPaymentData = {
    ...paymentData,
    status: paymentData.status ? mapStatusForDatabase(paymentData.status) : 'pending',
    actor: user.id
  }
  
  const { data, error } = await supabase
    .from('payments')
    .insert(dbPaymentData)
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
  return processPaymentData(data)
}

export async function updatePayment(id: string, paymentData: UpdatePaymentData) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payments')
    .update({
      ...paymentData
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
    console.error('Error updating payment:', {
      error,
      paymentId: id,
      paymentData
    })
    throw new Error(`Failed to update payment: ${error.message || 'Unknown error'}`)
  }

  revalidatePath('/payments')
  revalidatePath(`/payments/${id}`)
  return processPaymentData(data)
}

// Helper function to map new status values to database values (temporary compatibility)
function mapStatusForDatabase(status: PaymentStatus): string {
  const statusMap: Record<PaymentStatus, string> = {
    'unconfirmed': 'pending',
    'pending_invoice': 'pending', 
    'waiting_payment': 'pending',
    'paid': 'paid',
    'failed': 'failed'
  }
  return statusMap[status] || status
}

// Helper function to map database values back to TypeScript enum values
function mapStatusFromDatabase(dbStatus: string): PaymentStatus {
  const reverseMap: Record<string, PaymentStatus> = {
    'pending': 'unconfirmed',
    'paid': 'paid',
    'failed': 'failed',
    'refunded': 'failed',
    'cancelled': 'failed'
  }
  return reverseMap[dbStatus] as PaymentStatus || 'unconfirmed'
}

// Helper function to process payment data from database
function processPaymentData(payment: any): Payment {
  if (!payment) return payment
  return {
    ...payment,
    status: mapStatusFromDatabase(payment.status)
  }
}

export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  // Map the status to database-compatible value for now
  const dbStatus = mapStatusForDatabase(status)
  
  const updateData: any = {
    status: dbStatus
  }

  // Set paid_at timestamp when marking as paid
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString()
  }

  const supabase = await createAdminClient()
  
  // First, verify the payment exists
  const { data: existingPayment, error: fetchError } = await supabase
    .from('payments')
    .select('id, status')
    .eq('id', id)
    .single()
  
  if (fetchError) {
    console.error('Error fetching payment for status update:', fetchError)
    throw new Error(`Payment not found: ${fetchError.message}`)
  }
  
  if (!existingPayment) {
    throw new Error('Payment not found')
  }
  
  // Update the payment status
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
    console.error('Error updating payment status:', {
      error,
      paymentId: id,
      newStatus: status,
      updateData
    })
    throw new Error(`Failed to update payment status: ${error.message || 'Unknown error'}`)
  }

  revalidatePath('/payments')
  return processPaymentData(data)
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

  return (data || []).map(processPaymentData)
}

export async function getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
  const supabase = await createAdminClient()
  // Map the TypeScript status to database status for query
  const dbStatus = mapStatusForDatabase(status)
  
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
    .eq('status', dbStatus)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching payments by status:', error)
    throw new Error('Failed to fetch payments by status')
  }

  return (data || []).map(processPaymentData)
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
    .neq('status', 'paid') // 'paid' is the same in both database and TypeScript
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching overdue payments:', error)
    throw new Error('Failed to fetch overdue payments')
  }

  return (data || []).map(processPaymentData)
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
    // Map database status to TypeScript status
    const status = mapStatusFromDatabase(payment.status)
    if (!acc[status]) {
      acc[status] = { count: 0, amount: 0 }
    }
    acc[status].count += 1
    acc[status].amount += payment.amount || 0
    return acc
  }, {} as Record<PaymentStatus, { count: number; amount: number }>)

  return totals
}
