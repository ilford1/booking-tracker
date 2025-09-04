'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateBooking } from '@/lib/actions/bookings'
import { toast } from 'sonner'
import { BOOKING_STATUSES } from '@/types'
import type { BookingStatus } from '@/types'

interface StatusSelectProps {
  bookingId: string
  currentStatus: BookingStatus
  onStatusUpdate?: () => void
}

export function StatusSelect({ bookingId, currentStatus, onStatusUpdate }: StatusSelectProps) {
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (newStatus === currentStatus) return
    
    try {
      setIsUpdating(true)
      await updateBooking(bookingId, { status: newStatus })
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`)
      onStatusUpdate?.()
    } catch (error) {
      toast.error('Failed to update status')
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Select 
      value={currentStatus} 
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BOOKING_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
