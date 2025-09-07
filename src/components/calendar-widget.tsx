'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
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
      
      // Get today and the last day of the current real month (not calendar view month)
      const today = new Date()
      const currentRealMonth = today.getMonth()
      const currentRealYear = today.getFullYear()
      const lastDayOfRealMonth = new Date(currentRealYear, currentRealMonth + 1, 0)
      
      // Also get the calendar view month range for display
      const calendarFirstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const calendarLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      const todayString = today.toISOString().split('T')[0]
      const endOfRealMonthString = lastDayOfRealMonth.toISOString().split('T')[0]
      const calendarStartString = calendarFirstDay.toISOString().split('T')[0]
      const calendarEndString = calendarLastDay.toISOString().split('T')[0]
      
      // Fetch ALL bookings with creator and campaign data
      let bookingsQuery = supabase.from('bookings').select(`
        *,
        creator:creators(name, handle),
        campaign:campaigns(name)
      `)
      
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
      const calendarEvents = [] as CalendarEvent[]
      
      // Process bookings and their deadlines
      (bookings || []).forEach((booking: any) => {
        const bookingDate = new Date(booking.created_at)
        
        // Check if booking creation date is in calendar view month
        const isBookingInCalendarView = bookingDate.getMonth() === currentDate.getMonth() && 
                                       bookingDate.getFullYear() === currentDate.getFullYear()
        
        // Check if booking is relevant (created today or later, within current real month)
        const isBookingRelevant = bookingDate >= today && bookingDate <= lastDayOfRealMonth
        
        // Debug this specific booking
        if (booking.notes?.includes('Test booking') || bookingDate.toDateString() === today.toDateString()) {
          console.log('🔍 Processing booking:', {
            id: booking.id.substring(0, 8),
            created_at: bookingDate.toDateString(),
            deadline: booking.deadline ? new Date(booking.deadline).toDateString() : 'None',
            isBookingInCalendarView,
            isBookingRelevant,
            currentCalendarMonth: `${currentDate.getMonth()}/${currentDate.getFullYear()}`,
            bookingMonth: `${bookingDate.getMonth()}/${bookingDate.getFullYear()}`
          })
        }
        
        // Add booking event if it's in calendar view and relevant
        if (isBookingInCalendarView && isBookingRelevant) {
          const title = booking.campaign?.name || 
                       (booking.creator?.name ? `New: ${booking.creator.name}` : 'New Booking')
          
          const description = booking.creator?.name 
            ? `${booking.creator.name}${booking.creator.handle ? ` (@${booking.creator.handle})` : ''}`
            : 'Booking created'
            
          const eventData = {
            date: bookingDate.getDate(),
            title,
            type: 'booking' as const,
            description,
            id: booking.id
          }
          
          calendarEvents.push(eventData)
          console.log('🔵 Added BOOKING event:', eventData)
        }
        
        // Handle deadline separately
        if (booking.deadline) {
          const deadlineDate = new Date(booking.deadline)
          
          // Check if deadline is in calendar view month
          const isDeadlineInCalendarView = deadlineDate.getMonth() === currentDate.getMonth() && 
                                          deadlineDate.getFullYear() === currentDate.getFullYear()
          
          // Check if deadline is relevant (today or later, within current real month)
          const isDeadlineRelevant = deadlineDate >= today && deadlineDate <= lastDayOfRealMonth
          
          // Add deadline event if it's in calendar view and relevant
          if (isDeadlineInCalendarView && isDeadlineRelevant) {
            const title = booking.campaign?.name 
              ? `${booking.campaign.name} Due`
              : 'Content Due'
            
            const description = [
              booking.creator?.name ? `${booking.creator.name}${booking.creator.handle ? ` (@${booking.creator.handle})` : ''}` : null,
              'Deadline'
            ].filter(Boolean).join(' - ')
            
            const deadlineEventData = {
              date: deadlineDate.getDate(),
              title,
              type: 'deadline' as const,
              description,
              id: `${booking.id}-deadline`
            }
            
            calendarEvents.push(deadlineEventData)
            console.log('🔴 Added DEADLINE event:', deadlineEventData)
          }
        }
      })
      
      // Fetch campaigns that start in the range (today to end of real month)
      let campaignsQuery = supabase.from('campaigns').select('*')
        .gte('start_date', todayString)
        .lte('start_date', endOfRealMonthString)
      
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
        campaigns.forEach((campaign: any) => {
          const campaignDate = new Date(campaign.start_date)
          
          // Only show campaigns that are in the current calendar view month
          const isCampaignInCalendarView = campaignDate.getMonth() === currentDate.getMonth() && 
                                          campaignDate.getFullYear() === currentDate.getFullYear()
          
          if (isCampaignInCalendarView) {
            calendarEvents.push({
              date: campaignDate.getDate(),
              title: campaign.name,
              type: 'campaign' as const,
              description: 'Campaign starts',
              id: campaign.id
            })
          }
        })
      }
      
      setEvents(calendarEvents)
      
      // Debug logging
      console.log('📅 Calendar Debug:', {
        calendarViewMonth: `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
        realDateRange: {
          today: todayString,
          endOfRealMonth: endOfRealMonthString,
          daysInRange: Math.ceil((lastDayOfRealMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        },
        calendarViewRange: {
          start: calendarStartString,
          end: calendarEndString
        },
        campaignFilter,
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
        eventsGenerated: {
          total: calendarEvents.length,
          byType: {
            bookings: calendarEvents.filter(e => e.type === 'booking').length,
            deadlines: calendarEvents.filter(e => e.type === 'deadline').length,
            campaigns: calendarEvents.filter(e => e.type === 'campaign').length
          }
        },
        eventsByDay: calendarEvents.reduce((acc: Record<string, string[]>, e) => {
          const key = `Day ${e.date}`
          if (!acc[key]) acc[key] = []
          acc[key].push(`${e.type}: ${e.title}`)
          return acc
        }, {}),
        rawBookings: bookings?.slice(0, 3).map(b => ({ 
          id: b.id.substring(0, 8), 
          created_at: new Date(b.created_at).toDateString(), 
          deadline: b.deadline ? new Date(b.deadline).toDateString() : null, 
          creator: b.creator?.name, 
          campaign: b.campaign?.name,
          status: b.status
        })), // Show first 3 bookings for debugging
        rawCampaigns: campaigns?.slice(0, 3).map(c => ({
          id: c.id.substring(0, 8),
          name: c.name,
          start_date: new Date(c.start_date).toDateString()
        })) // Show campaigns for debugging
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
      console.log(`🔵🔴 Events for day ${day}:`, dayEvents.map(e => `${e.type}: ${e.title}`))
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchEvents()}
              title="Refresh calendar"
              className="mr-1"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
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
          <div className="text-sm font-medium mb-2">Upcoming Events (Today - End of Month)</div>
          <div className="space-y-2">
            {events
              .filter(event => {
                // Show events from today onwards in the current calendar view month
                const eventDate = new Date(currentYear, currentMonth, event.date)
                const now = new Date()
                now.setHours(0, 0, 0, 0)
                
                // Event must be today or later, and within our target range
                const isToday = eventDate.getTime() >= now.getTime()
                const realToday = new Date()
                const endOfRealMonth = new Date(realToday.getFullYear(), realToday.getMonth() + 1, 0)
                const isInRange = eventDate >= realToday && eventDate <= endOfRealMonth
                
                return isToday && isInRange
              })
              .sort((a, b) => {
                // Sort by date
                const dateA = new Date(currentYear, currentMonth, a.date)
                const dateB = new Date(currentYear, currentMonth, b.date)
                return dateA.getTime() - dateB.getTime()
              })
              .slice(0, 5) // Show up to 5 upcoming events
              .map((event) => {
                const day = event.date
                const eventDate = new Date(currentYear, currentMonth, day)
                const now = new Date()
                const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                
                let dateLabel = ''
                if (daysDiff === 0) {
                  dateLabel = 'Today'
                } else if (daysDiff === 1) {
                  dateLabel = 'Tomorrow'
                } else {
                  const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'
                  dateLabel = `${day}${suffix}`
                }
                
                return (
                  <div key={event.id || `${event.date}-${event.title}`} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 truncate">{event.title}</p>
                      {event.description && (
                        <p className="text-gray-500 text-xs truncate">{event.description}</p>
                      )}
                      {daysDiff > 1 && (
                        <p className="text-gray-400 text-xs">{eventDate.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      )}
                    </div>
                    <Badge className={`text-xs ml-2 ${getEventColor(event.type)}`}>
                      {dateLabel}
                    </Badge>
                  </div>
                )
              })}
            {events.filter(event => {
              const eventDate = new Date(currentYear, currentMonth, event.date)
              const now = new Date()
              const realToday = new Date()
              const endOfRealMonth = new Date(realToday.getFullYear(), realToday.getMonth() + 1, 0)
              return eventDate >= now && eventDate >= realToday && eventDate <= endOfRealMonth
            }).length === 0 && (
              <div className="text-sm text-gray-500">No upcoming events through end of month</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
