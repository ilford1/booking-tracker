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
import { createCampaign, updateCampaign } from '@/lib/actions/campaigns'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'

const campaignFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  objective: z.string().optional(),
  budget: z.number().min(0).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  default_brief: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type CampaignFormValues = z.infer<typeof campaignFormSchema>

interface CampaignFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<CampaignFormValues & { id: string }>
}

const CAMPAIGN_TAGS = [
  'Product Launch', 'Brand Awareness', 'Sales', 'Engagement', 'User Generated Content',
  'Seasonal', 'Holiday', 'Fashion', 'Beauty', 'Lifestyle', 'Tech', 'Food', 'Travel',
  'Fitness', 'Gaming', 'Education', 'B2B', 'B2C', 'Influencer', 'Micro-Influencer'
]

const OBJECTIVES = [
  'Brand Awareness',
  'Lead Generation',
  'Sales Conversion',
  'User Engagement',
  'Product Launch',
  'Community Building',
  'Content Creation',
  'Traffic Drive',
  'App Downloads',
  'Other'
]

export function CampaignForm({ onSuccess, onCancel, initialData }: CampaignFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      objective: '',
      budget: undefined,
      start_date: '',
      end_date: '',
      default_brief: '',
      tags: [],
      ...initialData,
    },
  })

  const onSubmit = async (data: CampaignFormValues) => {
    try {
      setIsSubmitting(true)
      // Transform form data to match database schema
      const campaignData = {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        objective: data.objective || null,
        budget: data.budget || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        default_brief: data.default_brief || null,
        tags: data.tags && data.tags.length > 0 ? data.tags : null,
      }

      if (initialData?.id) {
        await updateCampaign(initialData.id, campaignData)
        toast.success('Campaign updated successfully!')
      } else {
        await createCampaign(campaignData)
        toast.success('Campaign created successfully!')
      }
      
      onSuccess?.()
    } catch (error) {
      toast.error(initialData?.id ? 'Failed to update campaign' : 'Failed to create campaign')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = (tag: string) => {
    const currentTags = form.getValues('tags') || []
    if (!currentTags.includes(tag)) {
      form.setValue('tags', [...currentTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags') || []
    form.setValue('tags', currentTags.filter(t => t !== tag))
  }

  // Generate slug from name
  const generateSlug = () => {
    const name = form.getValues('name')
    if (name) {
      let slug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
      
      // Remove leading/trailing hyphens
      slug = slug.replace(/^-+|-+$/g, '')
      
      form.setValue('slug', slug)
    }
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
                    <FormLabel>Campaign Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Summer Collection 2024" 
                        {...field} 
                        onBlur={(e) => {
                          field.onBlur()
                          if (!form.getValues('slug')) {
                            generateSlug()
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="summer-collection-2024" {...field} />
                        <Button type="button" variant="outline" onClick={generateSlug}>
                          Generate
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>URL-friendly identifier for this campaign</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Objective</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select objective" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OBJECTIVES.map((objective) => (
                          <SelectItem key={objective} value={objective}>
                            {objective}
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
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget ($)</FormLabel>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
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
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="default_brief"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Brief</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the campaign objectives, target audience, key messages, and any specific requirements..."
                      className="resize-none h-32"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    This brief will be used as the default for all bookings in this campaign.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(field.value || []).map((tag) => (
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
                      {CAMPAIGN_TAGS.filter(tag => !(field.value || []).includes(tag)).map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Tags help organize and categorize your campaigns.
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
            {initialData?.id ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
