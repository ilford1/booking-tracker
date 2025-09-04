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
            email: creator.email || '',
            platform: creator.platform || 'instagram',
            handle: creator.handle || '',
            phone: creator.phone || '',
            followers: creator.followers || undefined,
            avg_views: creator.avg_views || undefined,
            avg_likes: creator.avg_likes || undefined,
            tags: creator.tags || [],
            rate_card: creator.rate_card || {},
            notes: creator.notes || '',
            links: creator.links || {},
          } : undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
