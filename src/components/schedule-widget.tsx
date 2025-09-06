'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Plus,
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
        
        // Get today and next 7 days
        const now = new Date()
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        // Fetch bookings for the next 7 days
        let bookingsQuery = supabase.from('bookings').select('*')
          .gte('created_at', now.toISOString())
          .lte('created_at', next7Days.toISOString())
        
        // Apply campaign filter if provided
        if (campaignFilter) {
          bookingsQuery = bookingsQuery.eq('campaign_id', campaignFilter)
        }
        
        const { data: bookings, error: bookingsError } = await bookingsQuery
          .order('created_at', { ascending: true })
          .limit(10)
        
        if (bookingsError) {
          // Don't log errors for missing tables or connection issues
          if (bookingsError.code !== 'PGRST204' && !bookingsError.message?.includes('relation') && !bookingsError.message?.includes('does not exist')) {
            console.warn('Schedule: Unable to fetch bookings', bookingsError.code)
          }
        }
        
        // Fetch campaigns starting in the next 7 days
        let campaignsQuery = supabase.from('campaigns').select('*')
          .gte('start_date', now.toISOString())
          .lte('start_date', next7Days.toISOString())
        
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
        
        // Add bookings and their deliverables
        if (bookings) {
          bookings.forEach(booking => {
            // Add the booking itself
            const bookingDate = new Date(booking.created_at)
            const isOverdue = bookingDate < now && booking.status !== 'delivered'
            const isCompleted = booking.status === 'delivered'
            
            items.push({
              id: booking.id,
              type: 'booking',
              title: booking.campaign_name || 'Booking',
              campaign: booking.campaign_name,
              creator: booking.creator_username,
              time: booking.created_at,
              status: isCompleted ? 'completed' : isOverdue ? 'overdue' : 'upcoming',
              priority: booking.amount > 5000000 ? 'high' : booking.amount > 2000000 ? 'medium' : 'low'
            })
            
            // Add deliverable deadline if scheduled_date exists
            if (booking.scheduled_date) {
              const deliverableDate = new Date(booking.scheduled_date)
              // Only add if within the next 7 days
              if (deliverableDate >= now && deliverableDate <= next7Days) {
                const isDeliverableOverdue = deliverableDate < now && booking.status !== 'delivered'
                
                items.push({
                  id: `${booking.id}-deliverable`,
                  type: 'deadline',
                  title: `Deliverable: ${booking.content_type || 'Content'}`,
                  campaign: booking.campaign_name,
                  creator: booking.creator_username,
                  time: booking.scheduled_date,
                  status: booking.status === 'delivered' ? 'completed' : isDeliverableOverdue ? 'overdue' : 'upcoming',
                  priority: booking.amount > 5000000 ? 'high' : booking.amount > 2000000 ? 'medium' : 'low'
                })
              }
            }
          })
        }
        
        // Add campaigns
        if (campaigns) {
          campaigns.forEach(campaign => {
            const campaignDate = new Date(campaign.start_date)
            const isOverdue = campaignDate < now && campaign.status !== 'completed'
            const isCompleted = campaign.status === 'completed'
            
            items.push({
              id: campaign.id,
              type: 'campaign',
              title: campaign.name,
              campaign: campaign.name,
              time: campaign.start_date,
              status: isCompleted ? 'completed' : isOverdue ? 'overdue' : 'upcoming',
              priority: campaign.budget > 10000000 ? 'high' : campaign.budget > 5000000 ? 'medium' : 'low'
            })
          })
        }
        
        // Sort by time and take first 5 items
        const sortedItems = items
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
          .slice(0, 5)
        
        setScheduleItems(sortedItems)
      } catch (error) {
        console.error('Error loading schedule:', error)
        setScheduleItems([])
      } finally {
        setLoading(false)
      }
    }

    loadSchedule()
  }, [campaignFilter])
    // Refresh every 30 seconds
    const interval = setInterval(loadSchedule, 30000)
    return () => clearInterval(interval)
  }, [])

  const todayItems = scheduleItems.filter(item => {
    const today = new Date()
    const itemDate = new Date(item.time)
    return itemDate.toDateString() === today.toDateString()
  })

  const tomorrowItems = scheduleItems.filter(item => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const itemDate = new Date(item.time)
    return itemDate.toDateString() === tomorrow.toDateString()
  })

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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/calendar">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today */}
        {todayItems.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Today</h4>
            <div className="space-y-2">
              {todayItems.map((item) => {
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
              })}
            </div>
          </div>
        )}

        {/* Tomorrow */}
        {tomorrowItems.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Tomorrow</h4>
            <div className="space-y-2">
              {tomorrowItems.map((item) => {
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
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {scheduleItems.length === 0 && (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-2">No upcoming schedule</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/calendar">
                View Calendar
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}

        {/* View all link */}
        {scheduleItems.length > 0 && (
          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="/calendar">
                View Full Calendar
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
