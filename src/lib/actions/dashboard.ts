'use server'

import { createAdminClient } from '@/utils/supabase/server'
import type { DashboardKPIs, FunnelData } from '@/types'

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  try {
    const supabase = await createAdminClient()
    
    // Get active campaigns count
    const today = new Date().toISOString().split('T')[0]
    const { data: activeCampaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .or(`end_date.is.null,end_date.gte.${today}`)

    if (campaignError) throw campaignError

    // Get booked posts this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: weeklyBookings, error: weeklyError } = await supabase
      .from('bookings')
      .select('id')
      .in('status', ['deal', 'delivered', 'content_submitted', 'approved', 'completed'])
      .gte('created_at', weekAgo)

    if (weeklyError) throw weeklyError

    // Get budget used (paid payments)
    const { data: paidPayments, error: paymentError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')

    if (paymentError) throw paymentError

    const budgetUsed = paidPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0

    // Get total budget from campaigns
    const { data: campaignBudgets, error: budgetError } = await supabase
      .from('campaigns')
      .select('budget')

    if (budgetError) throw budgetError

    const totalBudget = campaignBudgets?.reduce((sum, campaign) => sum + (campaign.budget || 0), 0) || 0

    // Get pending bookings (not completed)
    const { data: pendingBookings, error: pendingError } = await supabase
      .from('bookings')
      .select('id')
      .not('status', 'in', '(completed)')

    if (pendingError) throw pendingError

    // Get overdue bookings
    const { data: overdueBookings, error: overdueError } = await supabase
      .from('bookings')
      .select('id')
      .lt('deadline', today)
      .not('status', 'in', '(completed)')
      .not('deadline', 'is', null)

    if (overdueError) throw overdueError

    return {
      activeCampaigns: activeCampaigns?.length || 0,
      bookedPostsThisWeek: weeklyBookings?.length || 0,
      budgetUsed,
      totalBudget,
      pendingDeliverables: pendingBookings?.length || 0,
      overdueTasks: overdueBookings?.length || 0,
    }
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error)
    // Return fallback data
    return {
      activeCampaigns: 0,
      bookedPostsThisWeek: 0,
      budgetUsed: 0,
      totalBudget: 0,
      pendingDeliverables: 0,
      overdueTasks: 0,
    }
  }
}

export async function getBookingStatusFunnel(): Promise<FunnelData[]> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('bookings')
      .select('status')

    if (error) throw error

    const statusCounts = data.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)

    const funnelData: FunnelData[] = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))

    return funnelData.sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('Error fetching booking status funnel:', error)
    return []
  }
}

export async function getRecentActivity(): Promise<any[]> {
  try {
    const supabase = await createAdminClient()
    
    // Get recent bookings
    const { data: recentBookings, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        creator:creators(name, handle),
        campaign:campaigns(name)
      `)
      .order('updated_at', { ascending: false })
      .limit(10)

    if (bookingError) throw bookingError

    // Get recent payments
    const { data: recentPayments, error: paymentError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        status,
        paid_at,
        created_at,
        booking:bookings(
          creator:creators(name, handle)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (paymentError) throw paymentError

    // Get recent campaigns
    const { data: recentCampaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        start_date,
        end_date,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false })
      .limit(10)

    if (campaignError) throw campaignError

    // Combine and sort all activities by timestamp
    const activities = [
      ...(recentBookings?.map(booking => ({
        type: 'booking',
        timestamp: booking.updated_at,
        data: booking
      })) || []),
      ...(recentPayments?.map(payment => ({
        type: 'payment',
        timestamp: payment.paid_at || payment.created_at,
        data: payment
      })) || []),
      ...(recentCampaigns?.map(campaign => ({
        type: 'campaign',
        timestamp: campaign.updated_at,
        data: campaign
      })) || [])
    ]

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}
