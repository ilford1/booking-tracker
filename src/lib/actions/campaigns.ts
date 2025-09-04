'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import type { Campaign, CreateCampaignData, UpdateCampaignData } from '@/types'

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching campaigns:', error)
    throw new Error('Failed to fetch campaigns')
  }

  return data || []
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching campaign:', error)
    return null
  }

  return data
}

export async function getCampaignBySlug(slug: string): Promise<Campaign | null> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching campaign by slug:', error)
    return null
  }

  return data
}

export async function createCampaign(campaignData: CreateCampaignData) {
  const supabase = await createAdminClient()
  
  // Generate slug from name if not provided
  const slug = campaignData.slug || campaignData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      ...campaignData,
      slug,
      actor: 'system'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating campaign:', error)
    throw new Error('Failed to create campaign')
  }

  revalidatePath('/campaigns')
  return data
}

export async function updateCampaign(id: string, campaignData: UpdateCampaignData) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      ...campaignData,
      actor: 'system'
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating campaign:', error)
    throw new Error('Failed to update campaign')
  }

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${id}`)
  return data
}

export async function deleteCampaign(id: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting campaign:', error)
    throw new Error('Failed to delete campaign')
  }

  revalidatePath('/campaigns')
}

export async function getActiveCampaigns(): Promise<Campaign[]> {
  const supabase = await createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Error fetching active campaigns:', error)
    throw new Error('Failed to fetch active campaigns')
  }

  return data || []
}

export async function getCampaignBudgetStatus(id: string) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .rpc('get_campaign_budget_status', { campaign_id: id })

  if (error) {
    console.error('Error fetching campaign budget status:', error)
    throw new Error('Failed to fetch campaign budget status')
  }

  return data
}
