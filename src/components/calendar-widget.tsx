'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CalendarWidgetProps {
  className?: string
}

export function CalendarWidget({ className }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  
  // Sample events data - in a real app this would come from your database
  const events = [
    { date: new Date().getDate() + 2, title: 'Content Due', type: 'warning' },
    { date: new Date().getDate() + 5, title: 'Campaign Launch', type: 'success' },
    { date: new Date().getDate() + 7, title: 'Payment Due', type: 'error' },
    { date: new Date().getDate() - 1, title: 'Content Posted', type: 'info' },
  ]

  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const getEventsForDay = (day: number) => {
    return events.filter(event => event.date === day)
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'info':
        return 'bg-blue-100 text-blue-800'
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
              return <div key={index} className="p-2" />
            }
            
            const dayEvents = getEventsForDay(day)
            const isToday = today.getDate() === day && 
                           today.getMonth() === currentMonth && 
                           today.getFullYear() === currentYear
            
            return (
              <div key={day} className="relative">
                <div className={`
                  p-2 text-center text-sm rounded hover:bg-gray-50 cursor-pointer
                  ${isToday ? 'bg-blue-100 font-semibold text-blue-900' : ''}
                  ${dayEvents.length > 0 ? 'font-medium' : ''}
                `}>
                  {day}
                  {dayEvents.length > 0 && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Upcoming Events */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm font-medium mb-2">Upcoming Events</div>
          <div className="space-y-2">
            {events.filter(event => event.date >= today.getDate()).slice(0, 3).map((event, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{event.title}</span>
                <Badge className={`text-xs ${getEventColor(event.type)}`}>
                  {event.date}th
                </Badge>
              </div>
            ))}
            {events.filter(event => event.date >= today.getDate()).length === 0 && (
              <div className="text-sm text-gray-500">No upcoming events</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
