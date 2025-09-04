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
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  platform: z.enum(['instagram', 'youtube', 'tiktok', 'facebook', 'other']),
  handle: z.string().min(1, 'Handle is required'),
  phone: z.string().optional(),
  followers: z.number().min(0).optional(),
  avg_views: z.number().min(0).optional(),
  avg_likes: z.number().min(0).optional(),
  tags: z.array(z.string()).min(1, 'Select at least one tag'),
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
    youtube: z.string().optional(),
    website: z.string().optional(),
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
  { value: 'youtube', label: 'YouTube' },
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
      email: '',
      platform: 'instagram',
      handle: '',
      phone: '',
      followers: undefined,
      avg_views: undefined,
      avg_likes: undefined,
      tags: [],
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
        youtube: '',
        website: '',
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
        email: data.email || null,
        platform: data.platform,
        handle: data.handle,
        phone: data.phone || null,
        followers: data.followers || null,
        avg_views: data.avg_views || null,
        avg_likes: data.avg_likes || null,
        tags: data.tags,
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

  const addTag = (tag: string) => {
    const currentTags = form.getValues('tags')
    if (!currentTags.includes(tag)) {
      form.setValue('tags', [...currentTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags')
    form.setValue('tags', currentTags.filter(t => t !== tag))
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

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLATFORMS.map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            {platform.label}
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
            <CardTitle>Tags & Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags *</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {field.value.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-auto p-0 text-gray-500 hover:text-red-600"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={addTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {TAGS.filter(tag => !field.value.includes(tag)).map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <FormField
                control={form.control}
                name="links.youtube"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/@username" {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="links.website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} value={field.value || ''} />
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
                    <FormLabel>Post Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500"
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
                    <FormLabel>Story Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="250"
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
                    <FormLabel>Reel Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="750"
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
                    <FormLabel>Video Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000"
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
