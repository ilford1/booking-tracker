'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Megaphone,
  DollarSign
} from 'lucide-react'

interface ScheduleItem {
  id: string
  type: 'booking' | 'campaign' | 'payment' | 'deadline'
  title: string
  campaign?: string
  creator?: string
  time: string
  status: 'upcoming' | 'overdue' | 'completed'
  priority: 'high' | 'medium' | 'low'
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'booking':
      return Calendar
    case 'campaign':
      return Megaphone
    case 'payment':
      return DollarSign
    case 'deadline':
      return Clock
    default:
      return Calendar
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'overdue':
      return 'bg-red-100 text-red-800'
    case 'upcoming':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

interface ScheduleWidgetProps {
  className?: string
  campaignFilter?: string | null
}

export function ScheduleWidget({ className, campaignFilter }: ScheduleWidgetProps) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Get recent bookings (last 30 days) and upcoming items
        const now = new Date()
        const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        // Fetch recent bookings with campaign and creator relations
        let bookingsQuery = supabase.from('bookings')
          .select(`
            *,
            campaign:campaigns(id, name),
            creator:creators(id, name, handle)
          `)
          .gte('created_at', past30Days.toISOString())
          .neq('status', 'canceled')
        
        // Apply campaign filter if provided
        if (campaignFilter) {
          bookingsQuery = bookingsQuery.eq('campaign_id', campaignFilter)
        }
        
        const { data: bookings, error: bookingsError } = await bookingsQuery
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (bookingsError) {
          // Don't log errors for missing tables or connection issues
          if (bookingsError.code !== 'PGRST204' && !bookingsError.message?.includes('relation') && !bookingsError.message?.includes('does not exist')) {
            console.warn('Schedule: Unable to fetch bookings', bookingsError.code)
          }
        }
        
        // Fetch campaigns with start dates in the next 7 days (or recent ones)
        let campaignsQuery = supabase.from('campaigns').select('*')
          .or(`start_date.gte.${now.toISOString().split('T')[0]},start_date.is.null`)
        
        // Apply campaign filter if provided
        if (campaignFilter) {
          campaignsQuery = campaignsQuery.eq('id', campaignFilter)
        }
        
        const { data: campaigns, error: campaignsError } = await campaignsQuery
          .order('start_date', { ascending: true })
          .limit(10)
        
        if (campaignsError) {
          // Don't log errors for missing tables or connection issues
          if (campaignsError.code !== 'PGRST204' && !campaignsError.message?.includes('relation') && !campaignsError.message?.includes('does not exist')) {
            console.warn('Schedule: Unable to fetch campaigns', campaignsError.code)
          }
        }
        
        // Transform data into schedule items
        const items: ScheduleItem[] = []
        
        // Add bookings (focus on deadlines, not creation dates)
        if (bookings) {
          bookings.forEach((booking: any) => {
            // Determine priority based on agreed_amount or offer_amount
            const amount = booking.agreed_amount || booking.offer_amount || 0
            let priority: 'high' | 'medium' | 'low' = 'low'
            if (amount > 5000000) priority = 'high'
            else if (amount > 1000000) priority = 'medium'
            
            // Add booking creation event (for recently created bookings)
            const bookingDate = new Date(booking.created_at)
            const daysSinceCreated = Math.ceil((now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
            
            if (daysSinceCreated <= 3) { // Show recently created bookings (last 3 days)
              const isCompleted = booking.status === 'completed'
              
              items.push({
                id: booking.id,
                type: 'booking',
                title: `New: ${booking.campaign?.name || 'Booking Created'}`,
                campaign: booking.campaign?.name || undefined,
                creator: booking.creator?.name || booking.creator?.handle || undefined,
                time: booking.created_at,
                status: isCompleted ? 'completed' : 'upcoming',
                priority
              })
            }
            
            // Add deadline event (most important for scheduling)
            if (booking.deadline) {
              const deadlineDate = new Date(booking.deadline)
              const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              
              // Show deadlines within next 14 days or overdue deadlines
              if (daysUntilDeadline >= -3 && daysUntilDeadline <= 14) {
                const isCompleted = booking.status === 'completed'
                const isOverdue = deadlineDate < now && !isCompleted
                
                items.push({
                  id: `${booking.id}-deadline`,
                  type: 'deadline',
                  title: `Deadline: ${booking.campaign?.name || 'Content Due'}`,
                  campaign: booking.campaign?.name || undefined,
                  creator: booking.creator?.name || booking.creator?.handle || undefined,
                  time: booking.deadline,
                  status: isCompleted ? 'completed' : isOverdue ? 'overdue' : 'upcoming',
                  priority
                })
              }
            }
            
            // Add payment deadline for approved/completed bookings
            if (['approved', 'completed'].includes(booking.status) && booking.agreed_amount) {
              const paymentDate = new Date(booking.updated_at)
              paymentDate.setDate(paymentDate.getDate() + 7) // 7 days after approval
              
              const daysUntilPayment = Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              if (daysUntilPayment >= -1 && daysUntilPayment <= 7) {
                const isPaymentOverdue = paymentDate < now && booking.status !== 'completed'
                
                items.push({
                  id: `${booking.id}-payment`,
                  type: 'payment',
                  title: `Payment Due: ${booking.campaign?.name || 'Booking'}`,
                  campaign: booking.campaign?.name || undefined,
                  creator: booking.creator?.name || booking.creator?.handle || undefined,
                  time: paymentDate.toISOString(),
                  status: booking.status === 'completed' ? 'completed' : isPaymentOverdue ? 'overdue' : 'upcoming',
                  priority
                })
              }
            }
          })
        }
        
        // Add campaigns
        if (campaigns) {
          campaigns.forEach((campaign: any) => {
            // Use start_date if available, otherwise created_at
            const campaignDate = campaign.start_date ? new Date(campaign.start_date) : new Date(campaign.created_at)
            const isOverdue = campaign.start_date && campaignDate < now
            const isUpcoming = !campaign.start_date || campaignDate >= now
            
            // Determine priority based on budget
            const budget = campaign.budget || 0
            let priority: 'high' | 'medium' | 'low' = 'low'
            if (budget > 10000000) priority = 'high'
            else if (budget > 5000000) priority = 'medium'
            
            items.push({
              id: campaign.id,
              type: 'campaign',
              title: campaign.name,
              campaign: campaign.name,
              time: campaign.start_date || campaign.created_at,
              status: isOverdue ? 'overdue' : 'upcoming',
              priority
            })
          })
        }
        
        // Filter items to show relevant ones (today, tomorrow, or recent)
        const relevantItems = items.filter(item => {
          const itemDate = new Date(item.time)
          const daysDiff = Math.ceil((itemDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          // Show items from 7 days ago to 7 days in the future
          return daysDiff >= -7 && daysDiff <= 7
        })
        
        // Sort by time (upcoming first, then recent)
        const sortedItems = relevantItems
          .sort((a, b) => {
            const aTime = new Date(a.time).getTime()
            const bTime = new Date(b.time).getTime()
            const nowTime = now.getTime()
            
            // Upcoming items first (sorted by time)
            if (aTime >= nowTime && bTime >= nowTime) {
              return aTime - bTime
            }
            // Past items second (most recent first)
            if (aTime < nowTime && bTime < nowTime) {
              return bTime - aTime
            }
            // Upcoming items come before past items
            return aTime >= nowTime ? -1 : 1
          })
          .slice(0, 8) // Show up to 8 items
        
        setScheduleItems(sortedItems)
        
        // Debug logging
        console.log('Schedule Widget Debug:', {
          bookingsCount: bookings?.length || 0,
          campaignsCount: campaigns?.length || 0,
          totalItemsGenerated: items.length,
          relevantItemsCount: relevantItems.length,
          finalItemsCount: sortedItems.length,
          todayCount: sortedItems.filter(item => {
            const itemDate = new Date(item.time)
            return itemDate.toDateString() === now.toDateString()
          }).length,
          tomorrowCount: sortedItems.filter(item => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const itemDate = new Date(item.time)
            return itemDate.toDateString() === tomorrow.toDateString()
          }).length,
          items: sortedItems.map(item => ({
            type: item.type,
            title: item.title,
            time: item.time,
            status: item.status
          }))
        })
      } catch (error) {
        console.error('Error loading schedule:', error)
        setScheduleItems([])
      } finally {
        setLoading(false)
      }
    }

    loadSchedule()
    
    // Refresh every 4 hours
    const interval = setInterval(loadSchedule, 4 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [campaignFilter])

  // Group items by day for the next 7 days
  const today = new Date()
  const next7Days = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(today.getDate() + i)
    
    const dayItems = scheduleItems.filter(item => {
      const itemDate = new Date(item.time)
      return itemDate.toDateString() === date.toDateString()
    })
    
    if (dayItems.length > 0 || i === 0) { // Always show today even if empty
      next7Days.push({
        date,
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        items: dayItems
      })
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show schedule for next 7 days */}
        {next7Days.map((day, dayIndex) => (
          <div key={day.date.toDateString()}>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              {day.label}
              {day.items.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {day.items.length}
                </Badge>
              )}
            </h4>
            <div className="space-y-2">
              {day.items.length > 0 ? (
                day.items.map((item) => {
                  const Icon = getTypeIcon(item.type)
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="mt-0.5">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <Badge variant="secondary" className={`text-xs ${getStatusColor(item.status)}`}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {item.campaign && (
                            <p className="text-xs text-gray-600">{item.campaign}</p>
                          )}
                          {item.creator && (
                            <p className="text-xs text-gray-600">{item.creator}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {new Date(item.time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                dayIndex === 0 && ( // Only show "No events" for today
                  <p className="text-xs text-gray-500 pl-2">No events scheduled</p>
                )
              )}
            </div>
          </div>
        ))}

        {/* Empty state for when there are no items at all */}
        {scheduleItems.length === 0 && (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No upcoming events in the next 7 days</p>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
