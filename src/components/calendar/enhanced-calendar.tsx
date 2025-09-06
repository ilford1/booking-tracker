'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarEventComponent } from './calendar-event'
import { toast } from 'sonner'
import {
  CalendarDays,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react'
import type { CalendarEvent, CalendarFilters, CalendarViewPreferences } from '@/types/calendar'
import { rescheduleEvent } from '@/lib/actions/calendar'

// Setup the localizer for react-big-calendar
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface EnhancedCalendarProps {
  events: CalendarEvent[]
  onEventUpdate?: () => void
  initialFilters?: CalendarFilters
  initialView?: View
  showEventList?: boolean
}

export function EnhancedCalendar({
  events,
  onEventUpdate,
  initialFilters = {},
  initialView = Views.WEEK,
  showEventList = true
}: EnhancedCalendarProps) {
  const [currentView, setCurrentView] = useState<View>(initialView)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<CalendarFilters>(initialFilters)
  const [viewPreferences, setViewPreferences] = useState<CalendarViewPreferences>({
    showOverdueOnly: false,
    showPriorityColors: true,
    groupByCreator: false,
    showEventDescriptions: true,
  })

  // Filter events based on current filters and search
  const filteredEvents = useMemo(() => {
    let filtered = events

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.booking?.creator?.name?.toLowerCase().includes(query) ||
        event.booking?.campaign?.name?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(event => filters.status!.includes(event.status))
    }

    // Apply priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(event => filters.priority!.includes(event.priority))
    }

    // Apply type filter
    if (filters.eventType && filters.eventType.length > 0) {
      filtered = filtered.filter(event => filters.eventType!.includes(event.type))
    }

    // Apply creator filter
    if (filters.creatorId) {
      filtered = filtered.filter(event => event.creator_id === filters.creatorId)
    }

    // Apply campaign filter
    if (filters.campaignId) {
      filtered = filtered.filter(event => event.campaign_id === filters.campaignId)
    }

    // Apply overdue only filter
    if (viewPreferences.showOverdueOnly) {
      filtered = filtered.filter(event => event.status === 'overdue')
    }

    return filtered
  }, [events, filters, searchQuery, viewPreferences.showOverdueOnly])

  // Convert calendar events to react-big-calendar format
  const calendarEvents = useMemo(() => {
    return filteredEvents.map(event => ({
      ...event,
      start: new Date(event.start_date),
      end: new Date(event.end_date || event.start_date),
      title: event.title,
      resource: event,
    }))
  }, [filteredEvents])

  // Get upcoming events for the side panel
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    const upcoming = filteredEvents
      .filter(event => new Date(event.start_date) >= now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 10)
    
    return upcoming
  }, [filteredEvents])

  // Get overdue events
  const overdueEvents = useMemo(() => {
    return filteredEvents.filter(event => event.status === 'overdue')
  }, [filteredEvents])

  // Handle event selection
  const handleSelectEvent = useCallback((event: any) => {
    const calendarEvent = event.resource as CalendarEvent
    if (calendarEvent.url) {
      window.open(calendarEvent.url, '_blank')
    } else {
      toast.info(`Selected: ${calendarEvent.title}`)
    }
  }, [])

  // Handle event drag and drop (rescheduling)
  const handleEventDrop = useCallback(async ({ event, start, end }: any) => {
    const calendarEvent = event.resource as CalendarEvent
    
    try {
      await rescheduleEvent(calendarEvent.id, start, end)
      toast.success('Event rescheduled successfully')
      onEventUpdate?.()
    } catch (error) {
      console.error('Failed to reschedule event:', error)
      toast.error('Failed to reschedule event')
    }
  }, [onEventUpdate])

  // Custom event component for the calendar
  const EventComponent = ({ event }: { event: any }) => {
    const calendarEvent = event.resource as CalendarEvent
    const priorityColors = {
      urgent: 'bg-red-100 border-red-500 text-red-800',
      high: 'bg-orange-100 border-orange-500 text-orange-800',
      medium: 'bg-blue-100 border-blue-500 text-blue-800',
      low: 'bg-gray-100 border-gray-500 text-gray-800',
    }
    
    return (
      <div className={`p-1 text-xs rounded border-l-4 ${priorityColors[calendarEvent.priority]} truncate`}>
        <div className="flex items-center gap-1">
          {getEventTypeIcon(calendarEvent.type)}
          <span className="font-medium">{calendarEvent.title}</span>
        </div>
        {viewPreferences.showEventDescriptions && calendarEvent.description && (
          <div className="text-xs opacity-75 truncate">{calendarEvent.description}</div>
        )}
      </div>
    )
  }

  const getEventTypeIcon = (type: string) => {
    const iconProps = { className: "h-3 w-3" }
    switch (type) {
      case 'booking_deadline': return <CalendarDays {...iconProps} />
      case 'deliverable_due': return <Clock {...iconProps} />
      case 'approval_needed': return <CheckCircle2 {...iconProps} />
      case 'payment_due': return <Zap {...iconProps} />
      default: return <Clock {...iconProps} />
    }
  }


  const getStatusCounts = () => {
    return {
      total: filteredEvents.length,
      overdue: overdueEvents.length,
      upcoming: upcomingEvents.length,
      completed: filteredEvents.filter(e => e.status === 'completed').length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="space-y-6">
      {/* Header with filters and controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-gray-600">Manage your bookings and deliverables timeline</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={filters.status?.[0] || 'all'} onValueChange={(value) => 
            setFilters(prev => ({ ...prev, status: value && value !== 'all' ? [value] : undefined }))
          }>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.priority?.[0] || 'all'} onValueChange={(value) => 
            setFilters(prev => ({ ...prev, priority: value && value !== 'all' ? [value] : undefined }))
          }>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewPreferences(prev => ({ 
              ...prev, 
              showOverdueOnly: !prev.showOverdueOnly 
            }))}
          >
            {viewPreferences.showOverdueOnly ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {viewPreferences.showOverdueOnly ? 'Show All' : 'Overdue Only'}
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-orange-600">{statusCounts.upcoming}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar View */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Calendar View</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={currentView === Views.MONTH ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView(Views.MONTH)}
                >
                  Month
                </Button>
                <Button
                  variant={currentView === Views.WEEK ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView(Views.WEEK)}
                >
                  Week
                </Button>
                <Button
                  variant={currentView === Views.DAY ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView(Views.DAY)}
                >
                  Day
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ height: '600px' }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                view={currentView}
                onView={setCurrentView}
                date={currentDate}
                onNavigate={setCurrentDate}
                onSelectEvent={handleSelectEvent}
                onEventDrop={handleEventDrop}
                draggableAccessor={() => true}
                components={{
                  event: EventComponent,
                }}
                eventPropGetter={(event) => {
                  const calendarEvent = event.resource as CalendarEvent
                  const baseStyle = {
                    borderRadius: '4px',
                    border: 'none',
                    display: 'block',
                  }
                  
                  // Priority-based styling
                  switch (calendarEvent.priority) {
                    case 'urgent':
                      return { style: { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b' } }
                    case 'high':
                      return { style: { ...baseStyle, backgroundColor: '#fed7aa', color: '#9a3412' } }
                    case 'medium':
                      return { style: { ...baseStyle, backgroundColor: '#dbeafe', color: '#1e40af' } }
                    default:
                      return { style: { ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151' } }
                  }
                }}
                popup
                showMultiDayTimes
                step={30}
                timeslots={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Side Panel */}
        {showEventList && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Event Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="overdue" className="text-red-600">
                    Overdue ({overdueEvents.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming" className="space-y-2 p-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map(event => (
                      <CalendarEventComponent
                        key={event.id}
                        event={event}
                        compact
                        onUpdate={onEventUpdate}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No upcoming events
                    </p>
                  )}
                </TabsContent>
                
                <TabsContent value="overdue" className="space-y-2 p-4">
                  {overdueEvents.length > 0 ? (
                    overdueEvents.map(event => (
                      <CalendarEventComponent
                        key={event.id}
                        event={event}
                        compact
                        onUpdate={onEventUpdate}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No overdue events
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
