'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { formatDate } from '@/lib/utils'

interface CalendarWidgetProps {
  className?: string
  campaignFilter?: string | null
}

interface CalendarEvent {
  date: number
  title: string
  type: 'booking' | 'payment' | 'deadline' | 'campaign'
  description?: string
  id?: string
}

export function CalendarWidget({ className, campaignFilter }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  useEffect(() => {
    fetchEvents()
  }, [currentDate, campaignFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      const supabase = createClient()
      
      // Get the first and last day of the current month
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      // Fetch ALL bookings (not just current month) to check for scheduled dates
      let bookingsQuery = supabase.from('bookings').select('*')
      
      // Apply campaign filter if provided
      if (campaignFilter) {
        bookingsQuery = bookingsQuery.eq('campaign_id', campaignFilter)
      }
      
      const { data: bookings, error } = await bookingsQuery.order('created_at', { ascending: false })
      
      if (error) {
        // Don't log errors for missing tables or connection issues
        if (error.code !== 'PGRST204' && !error.message?.includes('relation') && !error.message?.includes('does not exist')) {
          console.warn('Calendar: Unable to fetch bookings', error.code)
        }
        setEvents([])
        return
      }
      
      // Transform bookings into calendar events
      const calendarEvents: CalendarEvent[] = []
      
      // Process bookings and their scheduled dates
      (bookings || []).forEach(booking => {
        const bookingDate = new Date(booking.created_at)
        
        // Add booking event if it's in the current month
        if (bookingDate.getMonth() === currentDate.getMonth() && 
            bookingDate.getFullYear() === currentDate.getFullYear()) {
          calendarEvents.push({
            date: bookingDate.getDate(),
            title: booking.campaign_name || 'Booking',
            type: 'booking' as const,
            description: `@${booking.creator_username || 'unknown'}`,
            id: booking.id
          })
        }
        
        // Add deliverable deadline if scheduled_date exists and is in current month
        if (booking.scheduled_date) {
          const deliverableDate = new Date(booking.scheduled_date)
          if (deliverableDate.getMonth() === currentDate.getMonth() && 
              deliverableDate.getFullYear() === currentDate.getFullYear()) {
            calendarEvents.push({
              date: deliverableDate.getDate(),
              title: `${booking.content_type || 'Content'} Due`,
              type: 'deadline' as const,
              description: `@${booking.creator_username} - ${booking.campaign_name || 'Campaign'}`,
              id: `${booking.id}-deadline`
            })
          }
        }
      })
      
      // Also fetch campaigns for the current month
      let campaignsQuery = supabase.from('campaigns').select('*')
        .gte('start_date', firstDay.toISOString())
        .lte('start_date', lastDay.toISOString())
      
      // Apply campaign filter if provided
      if (campaignFilter) {
        campaignsQuery = campaignsQuery.eq('id', campaignFilter)
      }
      
      const { data: campaigns, error: campaignsError } = await campaignsQuery
      
      if (campaignsError) {
        // Don't log errors for missing tables
        if (campaignsError.code !== 'PGRST204' && !campaignsError.message?.includes('relation') && !campaignsError.message?.includes('does not exist')) {
          console.warn('Calendar: Unable to fetch campaigns', campaignsError.code)
        }
      } else if (campaigns) {
        campaigns.forEach(campaign => {
          const campaignDate = new Date(campaign.start_date)
          calendarEvents.push({
            date: campaignDate.getDate(),
            title: campaign.name,
            type: 'campaign' as const,
            description: 'Campaign starts',
            id: campaign.id
          })
        })
      }
      
      setEvents(calendarEvents)
      
      // Debug logging
      console.log('Calendar Debug:', {
        month: `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
        dateRange: {
          firstDay: firstDay.toISOString(),
          lastDay: lastDay.toISOString()
        },
        fetchedData: {
          bookingsCount: bookings?.length || 0,
          campaignsCount: campaigns?.length || 0
        },
        totalEvents: calendarEvents.length,
        byType: {
          bookings: calendarEvents.filter(e => e.type === 'booking').length,
          deadlines: calendarEvents.filter(e => e.type === 'deadline').length,
          campaigns: calendarEvents.filter(e => e.type === 'campaign').length
        },
        eventDates: calendarEvents.map(e => ({ day: e.date, type: e.type, title: e.title })),
        rawBookings: bookings?.slice(0, 3) // Show first 3 bookings for debugging
      })
    } catch (error) {
      console.error('Error in fetchEvents:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const getEventsForDay = (day: number) => {
    const dayEvents = events.filter(event => event.date === day)
    if (dayEvents.length > 0) {
      console.log(`Events for day ${day}:`, dayEvents)
    }
    return dayEvents
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-100 text-blue-800'
      case 'campaign':
        return 'bg-green-100 text-green-800'
      case 'payment':
        return 'bg-yellow-100 text-yellow-800'
      case 'deadline':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Generate calendar days
  const calendarDays = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500 text-sm">Loading calendar...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[120px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="p-2" />
            }
            
            const dayEvents = getEventsForDay(day)
            const isToday = today.getDate() === day && 
                           today.getMonth() === currentMonth && 
                           today.getFullYear() === currentYear
            
            return (
              <div key={`day-${index}`} className="relative">
                <div className={`
                  p-2 text-center text-sm rounded hover:bg-gray-50 cursor-pointer min-h-[40px]
                  ${isToday ? 'bg-blue-100 font-semibold text-blue-900' : ''}
                  ${dayEvents.length > 0 ? 'font-medium' : ''}
                `}>
                  <div>{day}</div>
                  {dayEvents.length > 0 && (
                    <div className="flex flex-col items-center mt-1 gap-0.5">
                      <div className="flex gap-0.5 justify-center">
                        {dayEvents.slice(0, 3).map((event, i) => {
                          // Get color based on event type
                          let dotColor = 'bg-gray-400'
                          let ringColor = 'ring-gray-400'
                          if (event.type === 'booking') {
                            dotColor = 'bg-blue-500'
                            ringColor = 'ring-blue-300'
                          } else if (event.type === 'deadline') {
                            dotColor = 'bg-red-500'
                            ringColor = 'ring-red-300'
                          } else if (event.type === 'campaign') {
                            dotColor = 'bg-green-500'
                            ringColor = 'ring-green-300'
                          } else if (event.type === 'payment') {
                            dotColor = 'bg-yellow-500'
                            ringColor = 'ring-yellow-300'
                          }
                          
                          return (
                            <div 
                              key={`dot-${i}`} 
                              className={`w-2 h-2 ${dotColor} rounded-full ring-1 ${ringColor} ring-opacity-30`}
                              title={`${event.title}${event.description ? ` - ${event.description}` : ''}`}
                            />
                          )
                        })}
                      </div>
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-gray-500 font-medium">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-3 pt-3 border-t flex flex-wrap items-center justify-between text-xs">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full ring-1 ring-blue-300 ring-opacity-30"></div>
              <span className="text-gray-600">Booking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full ring-1 ring-red-300 ring-opacity-30"></div>
              <span className="text-gray-600">Deadline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full ring-1 ring-green-300 ring-opacity-30"></div>
              <span className="text-gray-600">Campaign</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </div>
        </div>
        
        {/* Upcoming Events */}
        <div className="mt-3 pt-3 border-t">
          <div className="text-sm font-medium mb-2">Upcoming Events</div>
          <div className="space-y-2">
            {events
              .filter(event => {
                // Show events from today onwards in the current month
                const eventDate = new Date(currentYear, currentMonth, event.date)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return eventDate >= today
              })
              .slice(0, 3)
              .map((event) => {
                const day = event.date
                const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'
                return (
                  <div key={event.id || `${event.date}-${event.title}`} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 truncate">{event.title}</p>
                      {event.description && (
                        <p className="text-gray-500 text-xs truncate">{event.description}</p>
                      )}
                    </div>
                    <Badge className={`text-xs ml-2 ${getEventColor(event.type)}`}>
                      {day}{suffix}
                    </Badge>
                  </div>
                )
              })}
            {events.filter(event => {
              const eventDate = new Date(currentYear, currentMonth, event.date)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return eventDate >= today
            }).length === 0 && (
              <div className="text-sm text-gray-500">No upcoming events this month</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
