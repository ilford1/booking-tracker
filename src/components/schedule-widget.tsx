'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Plus
} from 'lucide-react'

// Mock schedule data - in real app, this would come from API
interface ScheduleItem {
  id: string
  type: 'post' | 'deadline' | 'payment' | 'meeting'
  title: string
  campaign?: string
  creator?: string
  time: string
  status: 'upcoming' | 'overdue' | 'completed'
  priority: 'high' | 'medium' | 'low'
}

const mockScheduleItems: ScheduleItem[] = [
  {
    id: '1',
    type: 'post',
    title: 'Instagram Story - Fashion Collection',
    campaign: 'Summer 2024 Launch',
    creator: '@fashionista_vn',
    time: '2024-01-15T10:00:00',
    status: 'upcoming',
    priority: 'high'
  },
  {
    id: '2',
    type: 'deadline',
    title: 'Content Review Due',
    campaign: 'Beauty Brand Collab',
    creator: '@makeup_artist',
    time: '2024-01-15T14:30:00',
    status: 'upcoming',
    priority: 'medium'
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Processing',
    creator: '@lifestyle_blogger',
    time: '2024-01-15T16:00:00',
    status: 'overdue',
    priority: 'high'
  },
  {
    id: '4',
    type: 'meeting',
    title: 'Campaign Strategy Meeting',
    campaign: 'Q1 KOL Planning',
    time: '2024-01-16T09:00:00',
    status: 'upcoming',
    priority: 'medium'
  },
  {
    id: '5',
    type: 'post',
    title: 'TikTok Video - Product Demo',
    campaign: 'Tech Product Launch',
    creator: '@tech_reviewer',
    time: '2024-01-16T15:00:00',
    status: 'completed',
    priority: 'medium'
  }
]

function getTypeIcon(type: string) {
  switch (type) {
    case 'post':
      return Calendar
    case 'deadline':
      return Clock
    case 'payment':
      return CheckCircle2
    case 'meeting':
      return AlertTriangle
    default:
      return Clock
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
}

export function ScheduleWidget({ className }: ScheduleWidgetProps) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const loadSchedule = async () => {
      // In real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Sort by time and filter for next 48 hours
      const now = new Date()
      const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000)
      
      const filteredItems = mockScheduleItems
        .filter(item => new Date(item.time) <= next48Hours)
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        .slice(0, 5) // Show only next 5 items
      
      setScheduleItems(filteredItems)
      setLoading(false)
    }

    loadSchedule()
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
