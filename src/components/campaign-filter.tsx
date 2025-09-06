'use client'

import React, { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCampaigns } from '@/lib/actions/campaigns'
import { X, Filter } from 'lucide-react'
import type { Campaign } from '@/types'

interface CampaignFilterProps {
  value: string | null
  onChange: (campaignId: string | null) => void
  placeholder?: string
  showClearButton?: boolean
  className?: string
}

export function CampaignFilter({
  value,
  onChange,
  placeholder = "All Campaigns",
  showClearButton = true,
  className = ""
}: CampaignFilterProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await getCampaigns()
        setCampaigns(data)
      } catch (error) {
        console.error('Error fetching campaigns:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCampaigns()
  }, [])

  const selectedCampaign = campaigns.find(c => c.id === value)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={value || 'all'} onValueChange={(v) => onChange(v === 'all' ? null : v)}>
        <SelectTrigger className="w-[200px]">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <SelectValue placeholder={placeholder}>
              {value ? selectedCampaign?.name || placeholder : placeholder}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center justify-between w-full">
              <span>{placeholder}</span>
              {!value && <Badge variant="secondary" className="ml-2">Default</Badge>}
            </div>
          </SelectItem>
          {loading ? (
            <SelectItem value="loading" disabled>
              Loading campaigns...
            </SelectItem>
          ) : campaigns.length === 0 ? (
            <SelectItem value="no-campaigns" disabled>
              No campaigns available
            </SelectItem>
          ) : (
            <>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{campaign.name}</span>
                    {campaign.status && (
                      <Badge 
                        variant={campaign.status === 'active' ? 'default' : 'secondary'}
                        className="ml-2 text-xs"
                      >
                        {campaign.status}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      
      {showClearButton && value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          className="h-8 px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
