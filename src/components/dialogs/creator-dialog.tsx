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
import { CreatorForm } from '@/components/forms/creator-form'
import { Plus } from 'lucide-react'
import type { Creator } from '@/types'

interface CreatorDialogProps {
  trigger?: React.ReactNode
  creator?: Creator
  onSuccess?: () => void
}

export function CreatorDialog({ trigger, creator, onSuccess }: CreatorDialogProps) {
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
      Add Creator
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
            {creator ? 'Edit Creator' : 'Add New Creator'}
          </DialogTitle>
          <DialogDescription>
            {creator 
              ? 'Update the creator information below.' 
              : 'Add a new creator to your directory. Fill in the information below.'
            }
          </DialogDescription>
        </DialogHeader>
        <CreatorForm
          initialData={creator ? {
            name: creator.name,
            address: creator.address || '',
            platforms: (creator.platforms as ("instagram" | "tiktok" | "facebook" | "other")[]) || 
                      (creator.platform ? [creator.platform] as ("instagram" | "tiktok" | "facebook" | "other")[] : ['instagram']),
            handle: creator.handle || '',
            phone: creator.phone || '',
            bank_account: typeof creator.bank_account === 'object' && creator.bank_account !== null
              ? {
                  account_holder: (creator.bank_account as any).account_holder || '',
                  bank_name: (creator.bank_account as any).bank_name || '',
                  account_number: (creator.bank_account as any).account_number || '',
                  routing_number: (creator.bank_account as any).routing_number || '',
                }
              : {
                  account_holder: '',
                  bank_name: '',
                  account_number: '',
                  routing_number: '',
                },
            followers: creator.followers || undefined,
            avg_views: creator.avg_views || undefined,
            avg_likes: creator.avg_likes || undefined,
            // tags: creator.tags || [], // Removed tags field
            rate_card: typeof creator.rate_card === 'object' && creator.rate_card !== null
              ? creator.rate_card as Record<string, number>
              : {},
            notes: creator.notes || '',
            links: typeof creator.links === 'object' && creator.links !== null
              ? creator.links as Record<string, string>
              : {},
          } : undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
