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
import { DeliverableForm } from '@/components/forms/deliverable-form'
import { deleteDeliverable } from '@/lib/actions/deliverables'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import type { Deliverable } from '@/types'

interface DeliverableDialogProps {
  trigger?: React.ReactNode
  deliverable?: Deliverable
  prefilledBookingId?: string
  prefilledDate?: Date
  onSuccess?: () => void
  mode?: 'create' | 'edit'
}

export function DeliverableDialog({ 
  trigger, 
  deliverable, 
  prefilledBookingId,
  prefilledDate,
  onSuccess,
  mode = 'create'
}: DeliverableDialogProps) {
  const [open, setOpen] = React.useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  const defaultTrigger = mode === 'edit' ? (
    <Button variant="ghost" size="icon">
      <Edit className="h-4 w-4" />
    </Button>
  ) : (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      Add Deliverable
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Deliverable' : 'Create Deliverable'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update the deliverable details and track progress'
              : 'Schedule a new deliverable for content creation'}
          </DialogDescription>
        </DialogHeader>
        
        <DeliverableForm
          initialData={deliverable}
          prefilledBookingId={prefilledBookingId}
          prefilledDate={prefilledDate}
          onSuccess={handleSuccess}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

interface DeleteDeliverableDialogProps {
  deliverable: Deliverable
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function DeleteDeliverableDialog({ 
  deliverable, 
  trigger,
  onSuccess 
}: DeleteDeliverableDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      await deleteDeliverable(deliverable.id)
      toast.success('Deliverable deleted successfully')
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error deleting deliverable:', error)
      toast.error('Failed to delete deliverable')
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
      <Trash2 className="h-4 w-4" />
    </Button>
  )

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger || defaultTrigger}
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deliverable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deliverable? This action cannot be undone.
              {deliverable.title && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-700">
                  <strong>Title:</strong> {deliverable.title}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface QuickAddDeliverableDialogProps {
  date: Date
  onSuccess?: () => void
}

export function QuickAddDeliverableDialog({ 
  date, 
  onSuccess 
}: QuickAddDeliverableDialogProps) {
  return (
    <DeliverableDialog
      trigger={
        <Button size="sm" variant="outline" className="gap-1">
          <Calendar className="h-3 w-3" />
          Schedule
        </Button>
      }
      prefilledDate={date}
      onSuccess={onSuccess}
      mode="create"
    />
  )
}
