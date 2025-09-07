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
import { createBooking, updateBooking, updateBookingOwnership } from '@/lib/actions/bookings'
import { getCreators } from '@/lib/actions/creators'
import { getCampaigns } from '@/lib/actions/campaigns'
import { getUserProfiles, getCurrentUser, isUserAdmin } from '@/lib/actions/users'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { BOOKING_STATUSES, CONTACT_CHANNELS } from '@/types'
import type { Creator, Campaign } from '@/types'
import type { UserProfile } from '@/types/database'

const bookingFormSchema = z.object({
  campaign_id: z.string().optional().or(z.literal('none')),
  creator_id: z.string().optional().or(z.literal('none')),
  status: z.enum(BOOKING_STATUSES),
  currency: z.string().min(1, 'Currency is required'),
  contract_url: z.string().optional().or(z.literal('')),
  contact_channel: z.enum(CONTACT_CHANNELS).optional(),
  utm_code: z.string().optional().or(z.literal('')),
  affiliate_code: z.string().optional().or(z.literal('')),
  deadline: z.string().optional().or(z.literal('')), // Estimated completion deadline
  created_by: z.string().optional().or(z.literal('none')), // For admin ownership changes
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
  const [users, setUsers] = React.useState<UserProfile[]>([])
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null)
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      campaign_id: prefilledCampaignId || 'none',
      creator_id: prefilledCreatorId || 'none',
      status: 'pending',
      currency: 'VND',
      contract_url: '',
      contact_channel: undefined,
      utm_code: '',
      affiliate_code: '',
      deadline: '',
      created_by: 'none',
      ...initialData,
    },
  })

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [creatorsData, campaignsData, usersData, currentUserData, adminStatus] = await Promise.all([
          getCreators(),
          getCampaigns(),
          getUserProfiles(),
          getCurrentUser(),
          isUserAdmin()
        ])
        setCreators(creatorsData)
        setCampaigns(campaignsData)
        setUsers(usersData)
        setCurrentUser(currentUserData)
        setIsAdmin(adminStatus)
      } catch (error) {
        console.error('Error fetching data:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        toast.error(`Failed to load data: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const onSubmit = async (data: BookingFormValues) => {
    try {
      setIsSubmitting(true)
      
      // Ensure status is valid
      const validStatuses = ['pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed'] as const
      const status = validStatuses.includes(data.status as any) ? data.status : 'pending'
      
      // Determine new owner ID for admin ownership changes
      const newOwnerId = data.created_by && data.created_by !== '' && data.created_by !== 'none' ? data.created_by : null
      
      // Get selected creator for rate calculation
      const selectedCreator = creators.find(c => c.id === data.creator_id)
      const creatorRate = selectedCreator?.rate_card ? Object.values(selectedCreator.rate_card)[0] as number : null
      
      const bookingData = {
        campaign_id: data.campaign_id && data.campaign_id !== '' && data.campaign_id !== 'none' ? data.campaign_id : null,
        creator_id: data.creator_id && data.creator_id !== '' && data.creator_id !== 'none' ? data.creator_id : null,
        status: status,
        offer_amount: creatorRate || null,
        agreed_amount: creatorRate || null,
        currency: data.currency,
        contract_url: data.contract_url && data.contract_url !== '' ? data.contract_url : null,
        contact_channel: data.contact_channel || null,
        utm_code: data.utm_code && data.utm_code !== '' ? data.utm_code : null,
        affiliate_code: data.affiliate_code && data.affiliate_code !== '' ? data.affiliate_code : null,
        deadline: data.deadline && data.deadline !== '' ? data.deadline : null,
        // Set actor if admin is assigning to someone else
        ...(isAdmin && newOwnerId ? { actor: newOwnerId } : {})
      }

      if (initialData?.id) {
        await updateBooking(initialData.id, bookingData)
        
        // Handle ownership change if admin and new owner selected
        if (isAdmin && newOwnerId && newOwnerId !== (initialData as any)?.actor) {
          await updateBookingOwnership(initialData.id, newOwnerId)
          toast.success('Booking updated and ownership changed!')
        } else {
          toast.success('Booking updated successfully!')
        }
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
                        <SelectItem value="none">No Campaign</SelectItem>
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
                        <SelectItem value="none">No Creator</SelectItem>
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
                        <SelectItem value="VND">VND - Vietnamese Dong</SelectItem>
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
            <CardTitle>Project Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormDescription>
                    When this booking should be completed. This will appear on your calendar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

        {/* Admin Only Section */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Administration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="created_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Created By / Owner</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Keep Current Owner</SelectItem>
                        {users.map((user) => {
                          const displayName = user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : user.first_name || user.last_name || 'Unknown'
                          
                          return (
                            <SelectItem key={user.id} value={user.id}>
                              {displayName} ({user.user_role})
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Change who is responsible for this booking. Only admins can modify ownership.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

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
