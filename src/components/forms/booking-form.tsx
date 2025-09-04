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
import { createBooking, updateBooking } from '@/lib/actions/bookings'
import { getCreators } from '@/lib/actions/creators'
import { getCampaigns } from '@/lib/actions/campaigns'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { BOOKING_STATUSES, CONTACT_CHANNELS } from '@/types'
import type { Creator, Campaign } from '@/types'

const bookingFormSchema = z.object({
  campaign_id: z.string().optional().or(z.literal('')),
  creator_id: z.string().optional().or(z.literal('')),
  status: z.enum(BOOKING_STATUSES),
  offer_amount: z.number().min(0).optional(),
  agreed_amount: z.number().min(0).optional(),
  currency: z.string().min(1, 'Currency is required'),
  contract_url: z.string().optional().or(z.literal('')),
  brief: z.string().optional().or(z.literal('')),
  contact_channel: z.enum(CONTACT_CHANNELS).optional(),
  utm_code: z.string().optional().or(z.literal('')),
  affiliate_code: z.string().optional().or(z.literal('')),
})

type BookingFormValues = z.infer<typeof bookingFormSchema>

interface BookingFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<BookingFormValues & { id: string }>
  prefilledCampaignId?: string
  prefilledCreatorId?: string
}

export function BookingForm({ 
  onSuccess, 
  onCancel, 
  initialData, 
  prefilledCampaignId, 
  prefilledCreatorId 
}: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [creators, setCreators] = React.useState<Creator[]>([])
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [loading, setLoading] = React.useState(true)

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      campaign_id: prefilledCampaignId || '',
      creator_id: prefilledCreatorId || '',
      status: 'prospect',
      offer_amount: undefined,
      agreed_amount: undefined,
      currency: 'USD',
      contract_url: '',
      brief: '',
      contact_channel: undefined,
      utm_code: '',
      affiliate_code: '',
      ...initialData,
    },
  })

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [creatorsData, campaignsData] = await Promise.all([
          getCreators(),
          getCampaigns()
        ])
        setCreators(creatorsData)
        setCampaigns(campaignsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        toast.error(`Failed to load creators and campaigns: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const onSubmit = async (data: BookingFormValues) => {
    try {
      setIsSubmitting(true)
      
      const bookingData = {
        campaign_id: data.campaign_id && data.campaign_id !== '' ? data.campaign_id : null,
        creator_id: data.creator_id && data.creator_id !== '' ? data.creator_id : null,
        status: data.status,
        offer_amount: data.offer_amount || null,
        agreed_amount: data.agreed_amount || null,
        currency: data.currency,
        contract_url: data.contract_url && data.contract_url !== '' ? data.contract_url : null,
        brief: data.brief && data.brief !== '' ? data.brief : null,
        contact_channel: data.contact_channel || null,
        utm_code: data.utm_code && data.utm_code !== '' ? data.utm_code : null,
        affiliate_code: data.affiliate_code && data.affiliate_code !== '' ? data.affiliate_code : null,
      }

      if (initialData?.id) {
        await updateBooking(initialData.id, bookingData)
        toast.success('Booking updated successfully!')
      } else {
        await createBooking(bookingData)
        toast.success('Booking created successfully!')
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Booking form error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(initialData?.id 
        ? `Failed to update booking: ${errorMessage}` 
        : `Failed to create booking: ${errorMessage}`
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
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="campaign_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select campaign (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No Campaign</SelectItem>
                        {campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
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
                name="creator_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creator</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select creator (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No Creator</SelectItem>
                        {creators.map((creator) => (
                          <SelectItem key={creator.id} value={creator.id}>
                            {creator.name} ({creator.handle})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        {BOOKING_STATUSES.map((status) => (
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

              <FormField
                control={form.control}
                name="contact_channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Channel</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTACT_CHANNELS.map((channel) => (
                          <SelectItem key={channel} value={channel}>
                            {channel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="offer_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Initial offer amount in the selected currency.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreed_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agreed Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="600"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Final agreed amount after negotiations.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contract_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://docs.google.com/document/..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to the signed contract or agreement.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brief & Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="brief"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brief</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Campaign brief, requirements, deliverables, key messages..."
                      className="resize-none h-32"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed brief for this specific booking.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="utm_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UTM Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="utm_campaign=summer2024"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      UTM parameter for tracking.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="affiliate_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Affiliate Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CREATOR20"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Affiliate or discount code for this creator.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? 'Update Booking' : 'Create Booking'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
