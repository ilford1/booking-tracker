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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createCreator } from '@/lib/actions/creators'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'

const creatorFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  platforms: z.array(z.enum(['instagram', 'tiktok', 'facebook', 'other'])).min(1, 'Select at least one platform'),
  address: z.string().optional(),
  handle: z.string().min(1, 'Handle is required'),
  phone: z.string().optional(),
  bank_account: z.object({
    account_holder: z.string().optional(),
    bank_name: z.string().optional(),
    account_number: z.string().optional(),
    routing_number: z.string().optional(),
  }).optional(),
  followers: z.number().min(0).optional(),
  avg_views: z.number().min(0).optional(),
  avg_likes: z.number().min(0).optional(),
  // tags: z.array(z.string()).optional().default([]), // Removed tags field
  rate_card: z.object({
    post: z.number().min(0).optional(),
    story: z.number().min(0).optional(),
    reel: z.number().min(0).optional(),
    video: z.number().min(0).optional(),
  }).optional(),
  notes: z.string().optional(),
  links: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional(),
})

type CreatorFormValues = z.infer<typeof creatorFormSchema>

interface CreatorFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<CreatorFormValues>
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'other', label: 'Other' },
]

const TAGS = [
  'Fashion', 'Beauty', 'Lifestyle', 'Travel', 'Food', 'Fitness', 'Tech',
  'Gaming', 'Education', 'Business', 'Entertainment', 'Health', 'Sports',
  'Parenting', 'Home', 'Art', 'Music', 'Books', 'Cars', 'Pets', 'Micro',
  'Nano', 'Macro', 'Mega', 'Celebrity', 'Local', 'Niche', 'Trending'
]

export function CreatorForm({ onSuccess, onCancel, initialData }: CreatorFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CreatorFormValues>({
    resolver: zodResolver(creatorFormSchema),
    defaultValues: {
      name: '',
      platforms: ['instagram'],
      address: '',
      handle: '',
      phone: '',
      bank_account: {
        account_holder: '',
        bank_name: '',
        account_number: '',
        routing_number: '',
      },
      followers: undefined,
      avg_views: undefined,
      avg_likes: undefined,
      // tags: [], // Removed tags field
      rate_card: {
        post: undefined,
        story: undefined,
        reel: undefined,
        video: undefined,
      },
      notes: '',
      links: {
        instagram: '',
        tiktok: '',
      },
      ...initialData,
    },
  })

  const onSubmit = async (data: CreatorFormValues) => {
    try {
      setIsSubmitting(true)
      // Transform form data to match database schema
      const creatorData = {
        name: data.name,
        address: data.address || null,
        platform: data.platforms?.[0] || 'instagram', // Store first platform for compatibility
        platforms: data.platforms || ['instagram'], // Store all platforms
        handle: data.handle,
        phone: data.phone || null,
        bank_account: data.bank_account && Object.values(data.bank_account).some(v => v && v !== '') 
          ? Object.fromEntries(Object.entries(data.bank_account).filter(([_, v]) => v && v !== ''))
          : null,
        followers: data.followers || null,
        avg_views: data.avg_views || null,
        avg_likes: data.avg_likes || null,
        tags: null, // Tags field removed
        rate_card: data.rate_card && Object.values(data.rate_card).some(v => v !== undefined) 
          ? Object.fromEntries(Object.entries(data.rate_card).filter(([_, v]) => v !== undefined))
          : null,
        notes: data.notes || null,
        links: data.links && Object.values(data.links).some(v => v && v !== '') 
          ? Object.fromEntries(Object.entries(data.links).filter(([_, v]) => v && v !== ''))
          : null,
      }
      await createCreator(creatorData)
      toast.success('Creator added successfully!')
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to add creator')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Tag functions removed since tags field was removed
  // const addTag = (tag: string) => { ... }
  // const removeTag = (tag: string) => { ... }

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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creator Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="platforms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platforms *</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {PLATFORMS.map((platform) => (
                        <div key={platform.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={platform.value}
                            checked={field.value?.includes(platform.value as "instagram" | "tiktok" | "facebook" | "other") || false}
                            onChange={(e) => {
                              const current = field.value || []
                              const platformValue = platform.value as "instagram" | "tiktok" | "facebook" | "other"
                              if (e.target.checked) {
                                field.onChange([...current, platformValue])
                              } else {
                                field.onChange(current.filter(p => p !== platformValue))
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={platform.value} className="text-sm font-medium">
                            {platform.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handle/Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="@janesmith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audience & Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="followers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Followers</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avg_views"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Views</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avg_likes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Likes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* First row: Phone and Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="123 Main St, City, State" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Second row: Instagram URL and TikTok URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="links.instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/username" {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="links.tiktok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TikTok URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://tiktok.com/@username" {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rates & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="rate_card.post"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Rate (₫)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5000000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate_card.story"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Rate (₫)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2500000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate_card.reel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reel Rate (₫)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="7500000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate_card.video"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Rate (₫)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10000000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bank_account.account_holder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Holder Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bank_account.bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Chase Bank" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bank_account.account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bank_account.routing_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Routing Number</FormLabel>
                    <FormControl>
                      <Input placeholder="021000021" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this creator..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any relevant notes or special requirements for this creator.
                  </FormDescription>
                </FormItem>
              )}
            />
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
            {initialData ? 'Update Creator' : 'Add Creator'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
