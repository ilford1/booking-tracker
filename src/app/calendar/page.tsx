'use client'

import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { getDeliverables } from '@/lib/actions/deliverables'
import { formatDate } from '@/lib/utils'
import { format, isSameDay, parseISO } from 'date-fns'
import type { Deliverable } from '@/types'
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { 
  DeliverableDialog, 
  DeleteDeliverableDialog,
  QuickAddDeliverableDialog 
} from '@/components/dialogs/deliverable-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function CalendarPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const deliverablesData = await getDeliverables()
        setDeliverables(deliverablesData)
      } catch (error) {
        console.error('Error fetching deliverables:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [refreshKey])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const getDeliverablesForDate = (date: Date) => {
    return deliverables.filter(deliverable => 
      deliverable.due_date && isSameDay(parseISO(deliverable.due_date), date)
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'due': return 'bg-red-100 text-red-800'
      case 'submitted': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'posted': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'due': return AlertCircle
      case 'submitted': return Clock
      case 'approved': 
      case 'posted': return CheckCircle2
      default: return Clock
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading calendar...</p>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  const selectedDateDeliverables = getDeliverablesForDate(selectedDate)

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-500 mt-1">
                Track deliverable due dates and schedule management
              </p>
            </div>
            <div className="flex gap-2">
              <DeliverableDialog 
                onSuccess={handleRefresh}
                trigger={
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Deliverable
                  </Button>
                }
              />
              <Button 
                variant={viewMode === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button 
                variant={viewMode === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button 
                variant={viewMode === 'day' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Component */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {format(selectedDate, 'MMMM yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                  modifiers={{
                    hasDeliverables: (date) => getDeliverablesForDate(date).length > 0,
                    overdue: (date) => {
                      const dayDeliverables = getDeliverablesForDate(date)
                      return dayDeliverables.some(d => 
                        d.status === 'due' && 
                        parseISO(d.due_date!) < new Date()
                      )
                    }
                  }}
                  modifiersStyles={{
                    hasDeliverables: { 
                      backgroundColor: '#dbeafe', 
                      fontWeight: 'bold' 
                    },
                    overdue: { 
                      backgroundColor: '#fee2e2', 
                      color: '#dc2626' 
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardTitle>
              </CardHeader>
          <CardContent>
            {selectedDateDeliverables.length === 0 ? (
              <div className="text-center py-6">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No deliverables scheduled</p>
                <div className="mt-4">
                  <QuickAddDeliverableDialog 
                    date={selectedDate}
                    onSuccess={handleRefresh}
                  />
                </div>
              </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateDeliverables.map((deliverable) => {
                      const StatusIcon = getStatusIcon(deliverable.status)
                      return (
                        <div 
                          key={deliverable.id}
                          className="p-3 border rounded-lg hover:bg-gray-50 group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <StatusIcon className="h-4 w-4" />
                                <h4 className="font-medium text-sm">
                                  {deliverable.title || 'Untitled Deliverable'}
                                </h4>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">
                                {deliverable.booking?.creator?.name} • {deliverable.booking?.campaign?.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={`text-xs ${getStatusColor(deliverable.status)}`}
                                >
                                  {deliverable.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {deliverable.type}
                                </Badge>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <div className="w-full">
                                    <DeliverableDialog
                                      deliverable={deliverable}
                                      mode="edit"
                                      onSuccess={handleRefresh}
                                      trigger={
                                        <div className="flex items-center cursor-pointer w-full">
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </div>
                                      }
                                    />
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <div className="w-full">
                                    <DeleteDeliverableDialog
                                      deliverable={deliverable}
                                      onSuccess={handleRefresh}
                                      trigger={
                                        <div className="flex items-center cursor-pointer w-full text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </div>
                                      }
                                    />
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {deliverable.notes && (
                            <p className="text-xs text-gray-500 mt-2">
                              {deliverable.notes}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Deliverables */}
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Upcoming This Week</CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deliverables
                    .filter(d => {
                      if (!d.due_date) return false
                      const dueDate = parseISO(d.due_date)
                      const weekFromNow = new Date()
                      weekFromNow.setDate(weekFromNow.getDate() + 7)
                      return dueDate >= new Date() && dueDate <= weekFromNow
                    })
                    .slice(0, 5)
                    .map((deliverable) => (
                      <div key={deliverable.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">
                            {deliverable.booking?.creator?.name}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {deliverable.type}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {deliverable.due_date && format(parseISO(deliverable.due_date), 'MMM d')}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
