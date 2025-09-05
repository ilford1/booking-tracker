'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createDeliverable, updateDeliverable } from '@/lib/actions/deliverables'
import { getBookings } from '@/lib/actions/bookings'
import { toast } from 'sonner'
import { Loader2, Calendar, FileText } from 'lucide-react'
import { DELIVERABLE_TYPES, DELIVERABLE_STATUSES } from '@/types'
import type { Booking, Deliverable } from '@/types'
import { format } from 'date-fns'

const deliverableFormSchema = z.object({
  booking_id: z.string().optional().or(z.literal('none')),
  type: z.enum(DELIVERABLE_TYPES),
  title: z.string().optional().or(z.literal('')),
  caption: z.string().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  publish_date: z.string().optional().or(z.literal('')),
  status: z.enum(DELIVERABLE_STATUSES),
  link: z.string().optional().or(z.literal('')),
  draft_url: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type DeliverableFormValues = z.infer<typeof deliverableFormSchema>

interface DeliverableFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<Deliverable>
  prefilledBookingId?: string
  prefilledDate?: Date
}

export function DeliverableForm({ 
  onSuccess, 
  onCancel, 
  initialData,
  prefilledBookingId,
  prefilledDate
}: DeliverableFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [loading, setLoading] = React.useState(true)

  const form = useForm<DeliverableFormValues>({
    resolver: zodResolver(deliverableFormSchema),
    defaultValues: {
      booking_id: prefilledBookingId || initialData?.booking_id || 'none',
      type: initialData?.type || 'post',
      title: initialData?.title || '',
      caption: initialData?.caption || '',
      due_date: initialData?.due_date ? initialData.due_date.split('T')[0] : 
                prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '',
      publish_date: initialData?.publish_date ? initialData.publish_date.split('T')[0] : '',
      status: initialData?.status || 'planned',
      link: initialData?.link || '',
      draft_url: initialData?.draft_url || '',
      notes: initialData?.notes || '',
    },
  })

  React.useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookingsData = await getBookings()
        // Filter to only show booked or active bookings
        const activeBookings = bookingsData.filter(b => 
          ['booked', 'content_due', 'submitted', 'approved', 'posted'].includes(b.status)
        )
        setBookings(activeBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        toast.error('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const onSubmit = async (data: DeliverableFormValues) => {
    try {
      setIsSubmitting(true)
      
      const deliverableData = {
        booking_id: data.booking_id && data.booking_id !== '' && data.booking_id !== 'none' 
          ? data.booking_id : null,
        type: data.type,
        title: data.title && data.title !== '' ? data.title : null,
        caption: data.caption && data.caption !== '' ? data.caption : null,
        due_date: data.due_date && data.due_date !== '' ? data.due_date : null,
        publish_date: data.publish_date && data.publish_date !== '' ? data.publish_date : null,
        status: data.status,
        link: data.link && data.link !== '' ? data.link : null,
        draft_url: data.draft_url && data.draft_url !== '' ? data.draft_url : null,
        notes: data.notes && data.notes !== '' ? data.notes : null,
      }

      if (initialData?.id) {
        await updateDeliverable(initialData.id, deliverableData)
        toast.success('Deliverable updated successfully!')
      } else {
        await createDeliverable(deliverableData)
        toast.success('Deliverable created successfully!')
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Deliverable form error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(initialData?.id 
        ? `Failed to update deliverable: ${errorMessage}` 
        : `Failed to create deliverable: ${errorMessage}`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="booking_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select booking (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Booking</SelectItem>
                      {bookings.map((booking) => (
                        <SelectItem key={booking.id} value={booking.id}>
                          {booking.creator?.name || 'Unknown Creator'} - 
                          {booking.campaign?.name || 'Unknown Campaign'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Link this deliverable to a specific booking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DELIVERABLE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DELIVERABLE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Product Review Post"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief title for this deliverable
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caption/Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the caption or content for this deliverable..."
                      {...field}
                      value={field.value || ''}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    The caption or content to be posted
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates & Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      When the content should be submitted
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="publish_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publish Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      When the content will go live
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="draft_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Draft URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://drive.google.com/..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to the draft content for review
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Published Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://instagram.com/p/..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to the published content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes or requirements..."
                      {...field}
                      value={field.value || ''}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData?.id ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              initialData?.id ? 'Update Deliverable' : 'Create Deliverable'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
