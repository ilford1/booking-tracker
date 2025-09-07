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
import { getBrands, addBrand, type Brand } from '@/lib/brands'
import { getCreators } from '@/lib/actions/creators'
import { createBooking } from '@/lib/actions/bookings'
import { toast } from 'sonner'
import type { Creator } from '@/types'
import { Loader2, Plus, X } from 'lucide-react'

const campaignFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  brand: z.string().min(2, 'Brand must be at least 2 characters'),
  objective: z.string().optional(),
  budget: z.number().min(0).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  default_brief: z.string().optional(),
  selected_creators: z.array(z.string()).optional(),
  // tags: z.array(z.string()).optional(), // Removed tags field
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
  'Other'
]

export function CampaignForm({ onSuccess, onCancel, initialData }: CampaignFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [newBrandName, setNewBrandName] = React.useState('')
  const [showAddBrand, setShowAddBrand] = React.useState(false)
  const [creators, setCreators] = React.useState<Creator[]>([])
  const [loadingCreators, setLoadingCreators] = React.useState(false)

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      brand: '',
      objective: '',
      budget: undefined,
      start_date: '',
      end_date: '',
      default_brief: '',
      selected_creators: [],
      // tags: [], // Removed tags field
      ...initialData,
    },
  })

  // Load brands and creators on component mount
  React.useEffect(() => {
    setBrands(getBrands())
    
    const loadCreators = async () => {
      try {
        setLoadingCreators(true)
        const creatorsData = await getCreators()
        setCreators(creatorsData)
      } catch (error) {
        console.error('Error loading creators:', error)
        toast.error('Failed to load creators')
      } finally {
        setLoadingCreators(false)
      }
    }
    
    loadCreators()
  }, [])

  // Handle adding new brand
  const handleAddBrand = () => {
    if (newBrandName.trim()) {
      const updatedBrands = addBrand(newBrandName)
      setBrands(updatedBrands)
      form.setValue('brand', newBrandName.trim())
      setNewBrandName('')
      setShowAddBrand(false)
      toast.success('Brand added successfully!')
    }
  }

  const onSubmit = async (data: CampaignFormValues) => {
    try {
      setIsSubmitting(true)
      // Transform form data to match database schema
      const campaignData = {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        brand: data.brand || 'Default Brand', // Include brand field
        objective: data.objective || null,
        budget: data.budget || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        default_brief: data.default_brief || null,
        tags: null, // Tags field removed
      }

      let createdCampaign
      if (initialData?.id) {
        createdCampaign = await updateCampaign(initialData.id, campaignData)
        toast.success('Campaign updated successfully!')
      } else {
        createdCampaign = await createCampaign(campaignData)
        toast.success('Campaign created successfully!')
        
        // Create bookings for selected creators
        if (data.selected_creators && data.selected_creators.length > 0) {
          for (const creatorId of data.selected_creators) {
            try {
              await createBooking({
                campaign_id: createdCampaign.id,
                creator_id: creatorId,
                status: 'pending',
                currency: 'VND'
              })
            } catch (error) {
              console.error(`Error creating booking for creator ${creatorId}:`, error)
            }
          }
          toast.success(`Created bookings for ${data.selected_creators.length} creators!`)
        }
      }
      
      onSuccess?.()
    } catch (error) {
      toast.error(initialData?.id ? 'Failed to update campaign' : 'Failed to create campaign')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Tag functions removed since tags field was removed
  // const addTag = (tag: string) => { ... }
  // const removeTag = (tag: string) => { ... }

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

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand *</FormLabel>
                  <div className="flex gap-2">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brands.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500 text-center">
                            No brands available. Add one using the + button.
                          </div>
                        ) : (
                          brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.name}>
                              {brand.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddBrand(!showAddBrand)}
                      className="px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {showAddBrand && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="New brand name"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddBrand}
                        disabled={!newBrandName.trim()}
                        size="sm"
                      >
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowAddBrand(false)
                          setNewBrandName('')
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  
                  <FormDescription>Select a brand or add a new one</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <FormLabel>Budget (₫)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100000000"
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

            {/* Tags field removed per request */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Creator Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="selected_creators"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Creators (Optional)</FormLabel>
                  <FormDescription>
                    Select creators to automatically create bookings when the campaign is created.
                  </FormDescription>
                  
                  {loadingCreators ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">Loading creators...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                      {creators.map((creator) => (
                        <div key={creator.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={creator.id}
                            checked={field.value?.includes(creator.id) || false}
                            onChange={(e) => {
                              const current = field.value || []
                              if (e.target.checked) {
                                field.onChange([...current, creator.id])
                              } else {
                                field.onChange(current.filter(id => id !== creator.id))
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label 
                            htmlFor={creator.id} 
                            className="text-sm font-medium cursor-pointer flex-1 truncate"
                            title={`${creator.name} (${creator.handle})`}
                          >
                            {creator.name}
                            <span className="text-gray-500 text-xs block">{creator.handle}</span>
                          </label>
                        </div>
                      ))}
                      
                      {creators.length === 0 && (
                        <div className="col-span-full text-center py-4 text-gray-500">
                          No creators available. Add some creators first.
                        </div>
                      )}
                    </div>
                  )}
                  
                  {field.value && field.value.length > 0 && (
                    <p className="text-sm text-blue-600">
                      {field.value.length} creator{field.value.length === 1 ? '' : 's'} selected
                    </p>
                  )}
                  
                  <FormMessage />
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
