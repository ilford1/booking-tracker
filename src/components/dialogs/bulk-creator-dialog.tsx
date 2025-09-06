'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/search-input'
import { toast } from 'sonner'
import { getCreators } from '@/lib/actions/creators'
import { createBooking } from '@/lib/actions/bookings'
import { Users, Instagram, MessageCircle, ExternalLink } from 'lucide-react'
import type { Creator } from '@/types'

interface BulkCreatorDialogProps {
  trigger?: React.ReactNode
  campaignId: string
  campaignName: string
  onSuccess?: () => void
}

export function BulkCreatorDialog({ 
  trigger, 
  campaignId, 
  campaignName, 
  onSuccess 
}: BulkCreatorDialogProps) {
  const [open, setOpen] = useState(false)
  const [creators, setCreators] = useState<Creator[]>([])
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([])
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch creators when dialog opens
  useEffect(() => {
    if (open) {
      fetchCreators()
    }
  }, [open])

  // Filter creators based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = creators.filter(creator => 
        creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (creator.handle && creator.handle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (creator.email && creator.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredCreators(filtered)
    } else {
      setFilteredCreators(creators)
    }
  }, [creators, searchQuery])

  const fetchCreators = async () => {
    try {
      setLoading(true)
      const creatorsData = await getCreators()
      setCreators(creatorsData)
      setFilteredCreators(creatorsData)
    } catch (error) {
      toast.error('Failed to load creators')
      console.error('Error fetching creators:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatorToggle = (creatorId: string) => {
    const newSelected = new Set(selectedCreators)
    if (newSelected.has(creatorId)) {
      newSelected.delete(creatorId)
    } else {
      newSelected.add(creatorId)
    }
    setSelectedCreators(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedCreators.size === filteredCreators.length) {
      setSelectedCreators(new Set())
    } else {
      setSelectedCreators(new Set(filteredCreators.map(c => c.id)))
    }
  }

  const handleSubmit = async () => {
    if (selectedCreators.size === 0) {
      toast.error('Please select at least one creator')
      return
    }

    try {
      setSubmitting(true)
      
      // Create bookings for all selected creators
      const bookingPromises = Array.from(selectedCreators).map(creatorId => 
        createBooking({
          creator_id: creatorId,
          campaign_id: campaignId,
          status: 'pending',
          brief: '', // Empty brief - can be updated later
          currency: 'USD', // Default currency
        })
      )

      await Promise.all(bookingPromises)
      
      toast.success(`Successfully added ${selectedCreators.size} creator(s) to ${campaignName}`)
      
      // Reset state and close dialog
      setSelectedCreators(new Set())
      setSearchQuery('')
      setOpen(false)
      onSuccess?.()
      
    } catch (error) {
      toast.error('Failed to add creators to campaign')
      console.error('Error creating bulk bookings:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />
      case 'tiktok':
        return <MessageCircle className="h-4 w-4" />
      default:
        return <ExternalLink className="h-4 w-4" />
    }
  }

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Users className="h-4 w-4" />
      Add Multiple Creators
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Creators to Campaign</DialogTitle>
          <DialogDescription>
            Select creators to add to "{campaignName}". This will create pending bookings for each selected creator.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Select All */}
          <div className="flex items-center gap-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search creators..."
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleSelectAll}
              disabled={loading || filteredCreators.length === 0}
            >
              {selectedCreators.size === filteredCreators.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Selected Count */}
          {selectedCreators.size > 0 && (
            <div className="text-sm text-gray-600">
              {selectedCreators.size} creator(s) selected
            </div>
          )}

          {/* Creators List */}
          <div className="h-96 border rounded-md p-4 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="ml-2 text-sm text-gray-600">Loading creators...</span>
              </div>
            ) : filteredCreators.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No creators found matching your search.' : 'No creators available.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCreators.map((creator) => (
                  <div
                    key={creator.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCreators.has(creator.id)}
                      onChange={() => handleCreatorToggle(creator.id)}
                      className="rounded border-gray-300 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{creator.name}</div>
                          {creator.handle && (
                            <div className="text-sm text-gray-500">{creator.handle}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {creator.platform && (
                            <div className="flex items-center gap-1">
                              {getPlatformIcon(creator.platform)}
                              <Badge variant="secondary" className="capitalize">
                                {creator.platform}
                              </Badge>
                            </div>
                          )}
                          {creator.followers && (
                            <div className="text-xs text-gray-500">
                              {creator.followers.toLocaleString()} followers
                            </div>
                          )}
                        </div>
                      </div>
                      {creator.email && (
                        <div className="text-sm text-gray-500 mt-1">{creator.email}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedCreators.size === 0 || submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                `Add ${selectedCreators.size} Creator${selectedCreators.size !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
