'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForceRefresh } from '@/hooks/use-force-refresh'
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
import { DetailsDialog } from '@/components/dialogs/details-dialog'
import { BookingPaymentDialog } from '@/components/dialogs/booking-payment-dialog'
import { toast } from 'sonner'
import {
  ExternalLink,
  CreditCard,
  Archive,
  Trash2,
  Download,
  MoreHorizontal,
  User,
  Megaphone
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
  const { forceRefresh, softRefresh } = useForceRefresh()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)



  const downloadContract = () => {
    if (booking.contract_url) {
      window.open(booking.contract_url, '_blank')
    } else {
      toast.error('No contract available for this booking')
    }
  }


  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      console.log('🗑️ Starting deletion of booking:', booking.id)
      const result = await deleteBooking(booking.id)
      console.log('✅ Booking deleted successfully:', result)
      
      toast.success('Booking deleted successfully')
      setShowDeleteDialog(false)
      
      // Immediate callback to update parent state
      if (onDelete) {
        console.log('🔄 Calling onDelete callback')
        onDelete()
      } else if (onStatusUpdate) {
        console.log('🔄 Calling onStatusUpdate callback')
        onStatusUpdate()
      }
      
      // Force a complete page refresh to ensure the booking is removed from UI
      setTimeout(() => {
        console.log('🔄 Force refreshing after deletion to clear cache')
        forceRefresh()
      }, 500)
      
    } catch (error) {
      console.error('❌ Error deleting booking:', error)
      toast.error(`Failed to delete booking: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        {/* View Actions */}
        {booking.creator && (
          <DetailsDialog
            data={booking.creator}
            type="creator"
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <User className="mr-2 h-4 w-4" />
                View Creator Profile
              </DropdownMenuItem>
            }
          />
        )}

        {booking.campaign && (
          <DetailsDialog
            data={booking.campaign}
            type="campaign"
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Megaphone className="mr-2 h-4 w-4" />
                View Campaign
              </DropdownMenuItem>
            }
          />
        )}

        <DropdownMenuSeparator />

        {/* Financial Actions */}
        <BookingPaymentDialog
          booking={booking}
          onSuccess={onStatusUpdate}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <CreditCard className="mr-2 h-4 w-4" />
              Create Payment
            </DropdownMenuItem>
          }
        />

        {/* File Actions */}
        {booking.contract_url && (
          <>
            <DropdownMenuItem onClick={downloadContract}>
              <Download className="mr-2 h-4 w-4" />
              Download Contract
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Danger Actions */}
        {booking.status !== 'completed' && (
          <DropdownMenuItem 
            onClick={() => toast.info('Archive feature would be implemented here')}
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
