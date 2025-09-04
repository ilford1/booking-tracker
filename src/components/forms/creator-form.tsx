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
import { FileUpload } from '@/components/file-upload'
import { createCreator } from '@/lib/actions/creators'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'

const creatorFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
  platform: z.enum(['instagram', 'youtube', 'tiktok', 'twitter', 'linkedin', 'other']),
  handle: z.string().min(1, 'Handle is required'),
  followers_count: z.number().min(0).optional(),
  engagement_rate: z.number().min(0).max(100).optional(),
  avg_views: z.number().min(0).optional(),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  location: z.string().optional(),
  languages: z.array(z.string()).optional(),
  rates: z.object({
    post: z.number().min(0).optional(),
    story: z.number().min(0).optional(),
    reel: z.number().min(0).optional(),
    video: z.number().min(0).optional(),
  }),
  notes: z.string().optional(),
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
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'other', label: 'Other' },
]

const CATEGORIES = [
  'Fashion', 'Beauty', 'Lifestyle', 'Travel', 'Food', 'Fitness', 'Tech',
  'Gaming', 'Education', 'Business', 'Entertainment', 'Health', 'Sports',
  'Parenting', 'Home', 'Art', 'Music', 'Books', 'Cars', 'Pets'
]

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian'
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
      followers_count: undefined,
      engagement_rate: undefined,
      avg_views: undefined,
      categories: [],
      location: '',
      languages: [],
      rates: {
        post: undefined,
        story: undefined,
        reel: undefined,
        video: undefined,
      },
      notes: '',
      ...initialData,
    },
  })

  const onSubmit = async (data: CreatorFormValues) => {
    try {
      setIsSubmitting(true)
      await createCreator(data)
      toast.success('Creator added successfully!')
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to add creator')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addCategory = (category: string) => {
    const currentCategories = form.getValues('categories')
    if (!currentCategories.includes(category)) {
      form.setValue('categories', [...currentCategories, category])
    }
  }

  const removeCategory = (category: string) => {
    const currentCategories = form.getValues('categories')
    form.setValue('categories', currentCategories.filter(c => c !== category))
  }

  const addLanguage = (language: string) => {
    const currentLanguages = form.getValues('languages') || []
    if (!currentLanguages.includes(language)) {
      form.setValue('languages', [...currentLanguages, language])
    }
  }

  const removeLanguage = (language: string) => {
    const currentLanguages = form.getValues('languages') || []
    form.setValue('languages', currentLanguages.filter(l => l !== language))
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
                      <Input type="email" placeholder="jane@example.com" {...field} />
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="New York, NY" {...field} />
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
                name="followers_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Followers</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="engagement_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Engagement Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3.5"
                        step="0.1"
                        {...field}
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
            <CardTitle>Categories & Languages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Categories *</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {field.value.map((category) => (
                      <Badge key={category} variant="secondary" className="gap-1">
                        {category}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-0 text-gray-500 hover:text-red-600"
                          onClick={() => removeCategory(category)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={addCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(cat => !field.value.includes(cat)).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
              name="languages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Languages</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(field.value || []).map((language) => (
                      <Badge key={language} variant="outline" className="gap-1">
                        {language}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-0 text-gray-500 hover:text-red-600"
                          onClick={() => removeLanguage(language)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={addLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.filter(lang => !(field.value || []).includes(lang)).map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
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
                name="rates.post"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rates.story"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="250"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rates.reel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reel Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="750"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rates.video"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000"
                        {...field}
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
