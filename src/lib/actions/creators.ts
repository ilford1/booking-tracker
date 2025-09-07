'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import type { Creator, CreateCreatorData, UpdateCreatorData } from '@/types'

export async function getCreators(): Promise<Creator[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching creators:', error)
    throw new Error('Failed to fetch creators')
  }

  return data || []
}

export async function getCreator(id: string): Promise<Creator | null> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching creator:', error)
    return null
  }

  return data
}

export async function createCreator(creatorData: CreateCreatorData) {
  const supabase = await createAdminClient()
  
  // Get current user to set as actor if not already set
  let actorId = (creatorData as any).actor
  if (!actorId) {
    const { data: { user } } = await supabase.auth.getUser()
    actorId = user?.id || null
  }
  
  const enrichedCreatorData = {
    ...creatorData,
    actor: actorId
  }
  
  const { data, error } = await supabase
    .from('creators')
    .insert(enrichedCreatorData)
    .select()
    .single()

  if (error) {
    console.error('Error creating creator:', error)
    console.error('Creator data being inserted:', { ...creatorData })
    throw new Error(`Failed to create creator: ${error.message || error.code || 'Unknown error'}`)
  }

  revalidatePath('/creators')
  return data
}

export async function updateCreator(id: string, creatorData: UpdateCreatorData) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('creators')
    .update({
      ...creatorData
      // Removed actor field
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating creator:', error)
    throw new Error('Failed to update creator')
  }

  revalidatePath('/creators')
  revalidatePath(`/creators/${id}`)
  return data
}

export async function deleteCreator(id: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('creators')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting creator:', error)
    throw new Error('Failed to delete creator')
  }

  revalidatePath('/creators')
}

export async function searchCreators(query: string): Promise<Creator[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .or(`name.ilike.%${query}%,handle.ilike.%${query}%,tags.cs.{${query}}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching creators:', error)
    throw new Error('Failed to search creators')
  }

  return data || []
}

export async function getCreatorsByTags(tags: string[]): Promise<Creator[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .overlaps('tags', tags)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching creators by tags:', error)
    throw new Error('Failed to fetch creators by tags')
  }

  return data || []
}
