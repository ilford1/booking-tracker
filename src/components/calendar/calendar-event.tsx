'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar as CalendarIcon,
  ExternalLink,
  Eye,
  Edit,
  MoreVertical,
  User,
  FileText,
  Zap,
  ArrowRight
} from 'lucide-react'
import type { CalendarEvent } from '@/types/calendar'

interface CalendarEventProps {
  event: CalendarEvent
  onUpdate?: () => void
  compact?: boolean
  showActions?: boolean
}

export function CalendarEventComponent({ 
  event, 
  onUpdate, 
  compact = false,
  showActions = true 
}: CalendarEventProps) {
  const router = useRouter()

  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'mark_submitted':
          toast.info('This feature would be implemented with booking status updates')
          break
        case 'view_booking':
          if (event.booking_id) {
            router.push(`/bookings/${event.booking_id}`)
          }
          break
        case 'view_campaign':
          if (event.campaign_id) {
            router.push(`/campaigns/${event.campaign_id}`)
          }
          break
        case 'view_creator':
          if (event.creator_id) {
            router.push(`/creators/${event.creator_id}`)
          }
          break
        default:
          toast.info(`${action} action would be implemented here`)
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error)
      toast.error(`Failed to execute ${action}`)
    }
  }

  const getEventIcon = () => {
    switch (event.type) {
      case 'booking_deadline': return <CalendarIcon className="h-4 w-4" />
      case 'deliverable_due': return <FileText className="h-4 w-4" />
      case 'approval_needed': return <CheckCircle2 className="h-4 w-4" />
      case 'content_review': return <Eye className="h-4 w-4" />
      case 'payment_due': return <Zap className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusIcon = () => {
    switch (event.status) {
      case 'completed': return <CheckCircle2 className="h-3 w-3 text-green-500" />
      case 'overdue': return <AlertTriangle className="h-3 w-3 text-red-500" />
      case 'in_progress': return <Clock className="h-3 w-3 text-blue-500" />
      default: return null
    }
  }

  const getPriorityColor = () => {
    switch (event.priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'medium': return 'border-l-blue-500 bg-blue-50'
      case 'low': return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getQuickActions = () => {
    const actions = []
    
    if (event.type === 'booking_deadline' && event.booking?.status === 'delivered') {
      actions.push({ key: 'mark_submitted', label: 'Update Status', icon: CheckCircle2 })
    }
    
    if (event.booking_id) {
      actions.push({ key: 'view_booking', label: 'View Booking', icon: ExternalLink })
    }
    
    if (event.campaign_id) {
      actions.push({ key: 'view_campaign', label: 'View Campaign', icon: ExternalLink })
    }
    
    if (event.creator_id) {
      actions.push({ key: 'view_creator', label: 'View Creator', icon: User })
    }
    
    return actions
  }

  const quickActions = getQuickActions()

  if (compact) {
    return (
      <div 
        className={`p-2 border-l-4 rounded cursor-pointer hover:bg-gray-100 transition-colors ${getPriorityColor()}`}
        onClick={() => event.url && router.push(event.url)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getEventIcon()}
            <span className="text-sm font-medium truncate">{event.title}</span>
            {getStatusIcon()}
          </div>
          {showActions && quickActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {quickActions.map(action => (
                  <DropdownMenuItem 
                    key={action.key}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleQuickAction(action.key)
                    }}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {event.description && (
          <p className="text-xs text-gray-500 mt-1 truncate">{event.description}</p>
        )}
      </div>
    )
  }

  return (
    <div className={`p-4 border-l-4 rounded-lg hover:shadow-md transition-all ${getPriorityColor()}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getEventIcon()}
            <h4 className="font-semibold text-gray-900">{event.title}</h4>
          </div>
          {getStatusIcon()}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline"
            className={`text-xs ${getPriorityBadgeColor()}`}
          >
            {event.priority}
          </Badge>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {quickActions.map(action => (
                  <DropdownMenuItem 
                    key={action.key}
                    onClick={() => handleQuickAction(action.key)}
                    className="flex items-center gap-2"
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
                
                {quickActions.length > 0 && <DropdownMenuSeparator />}
                
                <DropdownMenuItem 
                  onClick={() => event.url && router.push(event.url)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {event.description && (
        <p className="text-sm text-gray-600 mb-3">{event.description}</p>
      )}

      {/* Event metadata */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(event.start_date)}
          {event.end_date && ` - ${formatDate(event.end_date)}`}
        </div>
        
        {event.booking?.creator?.name && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {event.booking.creator.name}
          </div>
        )}
        
        {event.booking?.campaign?.name && (
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {event.booking.campaign.name}
          </div>
        )}
      </div>

      {/* Quick action buttons for urgent items */}
      {event.priority === 'urgent' && quickActions.length > 0 && (
        <div className="mt-3 flex gap-2">
          {quickActions.slice(0, 2).map(action => (
            <Button
              key={action.key}
              size="sm"
              variant="outline"
              onClick={() => handleQuickAction(action.key)}
              className="text-xs"
            >
              <action.icon className="h-3 w-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

function getPriorityBadgeColor() {
  return 'capitalize'
}
