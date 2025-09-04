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
import { CampaignForm } from '@/components/forms/campaign-form'
import { Plus } from 'lucide-react'
import type { Campaign } from '@/types'

interface CampaignDialogProps {
  trigger?: React.ReactNode
  campaign?: Campaign
  onSuccess?: () => void
}

export function CampaignDialog({ trigger, campaign, onSuccess }: CampaignDialogProps) {
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
      New Campaign
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
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </DialogTitle>
          <DialogDescription>
            {campaign 
              ? 'Update the campaign information below.' 
              : 'Create a new campaign to organize your influencer collaborations.'
            }
          </DialogDescription>
        </DialogHeader>
        <CampaignForm
          initialData={campaign ? {
            id: campaign.id,
            name: campaign.name,
            slug: campaign.slug || '',
            objective: campaign.objective || '',
            budget: campaign.budget || undefined,
            start_date: campaign.start_date || '',
            end_date: campaign.end_date || '',
            default_brief: campaign.default_brief || '',
            tags: campaign.tags || [],
          } : undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
