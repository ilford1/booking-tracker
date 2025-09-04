'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import type { Creator, CreateCreatorData, UpdateCreatorData } from '@/types'

export async function getCreators(): Promise<Creator[]> {
  const { data, error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
    .from('creators')
    .insert({
      ...creatorData,
      actor: 'system' // Could be replaced with actual user when auth is added
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating creator:', error)
    throw new Error('Failed to create creator')
  }

  revalidatePath('/creators')
  return data
}

export async function updateCreator(id: string, creatorData: UpdateCreatorData) {
  const { data, error } = await supabaseAdmin
    .from('creators')
    .update({
      ...creatorData,
      actor: 'system'
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
  const { error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
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
