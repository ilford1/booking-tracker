'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookingForm } from '@/components/forms/booking-form'
import { ErrorBoundary } from '@/components/error-boundary'
import { Plus } from 'lucide-react'
import type { Booking } from '@/types'

interface BookingDialogProps {
  trigger?: React.ReactNode
  booking?: Booking
  prefilledCampaignId?: string
  prefilledCreatorId?: string
  onSuccess?: () => void
}

export function BookingDialog({ 
  trigger, 
  booking, 
  prefilledCampaignId, 
  prefilledCreatorId, 
  onSuccess 
}: BookingDialogProps) {
  const [open, setOpen] = React.useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  const handleCancel = () => {
    setOpen(false)
  }

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      Create Booking
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {booking ? 'Edit Booking' : 'Create New Booking'}
          </DialogTitle>
          <DialogDescription>
            {booking 
              ? 'Update the booking information below.' 
              : 'Create a new booking to manage influencer collaborations.'
            }
          </DialogDescription>
        </DialogHeader>
        <ErrorBoundary>
          <BookingForm
            initialData={booking ? {
              id: booking.id,
              campaign_id: booking.campaign_id || '',
              creator_id: booking.creator_id || '',
              status: booking.status,
              offer_amount: booking.offer_amount || undefined,
              agreed_amount: booking.agreed_amount || undefined,
              currency: booking.currency,
              contract_url: booking.contract_url || '',
              brief: booking.brief || '',
              contact_channel: booking.contact_channel || undefined,
              utm_code: booking.utm_code || '',
              affiliate_code: booking.affiliate_code || '',
            } : undefined}
            prefilledCampaignId={prefilledCampaignId}
            prefilledCreatorId={prefilledCreatorId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  )
}
