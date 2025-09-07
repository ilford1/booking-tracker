'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Eye,
  Edit,
  Copy,
  ExternalLink,
  CreditCard,
  MessageSquare,
  Archive,
  Trash2,
  Download,
  FileText,
  MoreHorizontal
} from 'lucide-react'
import type { Booking } from '@/types/database'
import { BookingStatus } from '@/types/booking-workflow'

interface BookingContextMenuProps {
  booking: Booking
  children: React.ReactNode
  onStatusUpdate?: () => void
}

export function BookingActionsMenu({ booking, onStatusUpdate }: Omit<BookingContextMenuProps, 'children'>) {
  const router = useRouter()

  const copyBookingId = () => {
    navigator.clipboard.writeText(booking.id)
    toast.success('Booking ID copied to clipboard')
  }

  const copyBookingUrl = () => {
    const url = `${window.location.origin}/bookings/${booking.id}`
    navigator.clipboard.writeText(url)
    toast.success('Booking URL copied to clipboard')
  }

  const navigateToCreator = () => {
    if (booking.creator_id) {
      router.push(`/creators/${booking.creator_id}`)
    } else {
      toast.error('No creator associated with this booking')
    }
  }

  const navigateToCampaign = () => {
    if (booking.campaign_id) {
      router.push(`/campaigns/${booking.campaign_id}`)
    } else {
      toast.error('No campaign associated with this booking')
    }
  }

  const createPayment = () => {
    // In a real implementation, this would open a payment creation dialog
    toast.info('Payment creation feature would be implemented here')
  }

  const downloadContract = () => {
    if (booking.contract_url) {
      window.open(booking.contract_url, '_blank')
    } else {
      toast.error('No contract available for this booking')
    }
  }

  const getQuickActions = () => {
    const actions = []

    // Status-based actions
    switch (booking.status as BookingStatus) {
      case 'pending':
        actions.push('Start Work', 'Cancel')
        break
      case 'in_process':
        actions.push('Mark Submitted', 'Request Update')
        break
      case 'content_submitted':
        actions.push('Review Content', 'Request Revision')
        break
      case 'approved':
        actions.push('Mark Completed', 'Create Payment')
        break
      default:
        break
    }

    return actions
  }

  const handleQuickAction = (action: string) => {
    toast.info(`${action} feature would be implemented here`)
    // In a real implementation, these would trigger actual status changes
    onStatusUpdate?.()
  }

  const quickActions = getQuickActions()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        {/* Primary Actions */}
        <DropdownMenuItem onClick={() => router.push(`/bookings/${booking.id}`)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => toast.info('Edit booking feature would be implemented here')}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Booking
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Navigation */}
        {booking.creator_id && (
          <DropdownMenuItem onClick={navigateToCreator}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Creator Profile
          </DropdownMenuItem>
        )}

        {booking.campaign_id && (
          <DropdownMenuItem onClick={navigateToCampaign}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Campaign
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Quick Status Actions */}
        {quickActions.length > 0 && (
          <>
            {quickActions.map((action) => (
              <DropdownMenuItem 
                key={action} 
                onClick={() => handleQuickAction(action)}
                className="text-blue-600"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {action}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Financial Actions */}
        <DropdownMenuItem onClick={createPayment}>
          <CreditCard className="mr-2 h-4 w-4" />
          Create Payment
        </DropdownMenuItem>

        {/* File Actions */}
        {booking.contract_url && (
          <DropdownMenuItem onClick={downloadContract}>
            <Download className="mr-2 h-4 w-4" />
            Download Contract
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Utility Actions */}
        <DropdownMenuItem onClick={copyBookingId}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Booking ID
        </DropdownMenuItem>

        <DropdownMenuItem onClick={copyBookingUrl}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Booking Link
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Danger Actions */}
        {booking.status !== 'completed' && booking.status !== 'canceled' && (
          <DropdownMenuItem 
            onClick={() => handleQuickAction('Archive')}
            className="text-orange-600"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive Booking
          </DropdownMenuItem>
        )}

        <DropdownMenuItem 
          onClick={() => toast.error('Delete booking feature would be implemented here')}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Booking
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
