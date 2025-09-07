'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Copy,
  ExternalLink,
  CreditCard,
  MessageSquare,
  Archive,
  Trash2,
  Download,
  MoreHorizontal
} from 'lucide-react'
import type { Booking } from '@/types/database'
import { BookingStatus } from '@/types/booking-workflow'
import { deleteBooking } from '@/lib/actions/bookings'

interface BookingContextMenuProps {
  booking: Booking
  children: React.ReactNode
  onStatusUpdate?: () => void
  onDelete?: () => void
}

export function BookingActionsMenu({ booking, onStatusUpdate, onDelete }: Omit<BookingContextMenuProps, 'children'>) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
        // Removed Review Content and Request Revision - handled separately
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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      console.log('Deleting booking:', booking.id)
      await deleteBooking(booking.id)
      console.log('Booking deleted successfully')
      
      toast.success('Booking deleted successfully')
      setShowDeleteDialog(false)
      
      // Force refresh after a small delay to ensure the deletion completes
      setTimeout(() => {
        if (onDelete) {
          onDelete()
        } else {
          onStatusUpdate?.()
        }
      }, 100)
      
    } catch (error) {
      console.error('Error deleting booking:', error)
      toast.error(`Failed to delete booking: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
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
          onClick={() => setShowDeleteDialog(true)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Booking
        </DropdownMenuItem>
      </DropdownMenuContent>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
              <br /><br />
              <strong>Creator:</strong> {booking.creator?.name || 'Unknown'}
              <br />
              <strong>Campaign:</strong> {booking.campaign?.name || 'Unknown'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  )
}
