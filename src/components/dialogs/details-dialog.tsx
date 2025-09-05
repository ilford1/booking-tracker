'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Creator, Campaign } from '@/types'

interface DetailsDialogProps {
  trigger?: React.ReactNode
  data: Creator | Campaign
  type: 'creator' | 'campaign'
}

export function DetailsDialog({ trigger, data, type }: DetailsDialogProps) {
  const [open, setOpen] = React.useState(false)

  const isCreator = type === 'creator'
  const creator = isCreator ? data as Creator : undefined
  const campaign = !isCreator ? data as Campaign : undefined

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      View {type === 'creator' ? 'Profile' : 'Details'}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreator ? creator?.name : campaign?.name}
          </DialogTitle>
          <DialogDescription>
            {isCreator 
              ? `Creator profile for ${creator?.name}` 
              : `Campaign details for ${campaign?.name}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isCreator && creator && (
            <>
              {/* Creator Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Name</div>
                      <div className="text-sm">{creator.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Handle</div>
                      <div className="text-sm">{creator.handle || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Platform</div>
                      <div className="text-sm capitalize">{creator.platform || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Post Rate</div>
                      <div className="text-sm">{creator.rate_card && typeof creator.rate_card === 'object' && (creator.rate_card as any).post ? formatCurrency((creator.rate_card as any).post) : 'Not set'}</div>
                    </div>
                  </div>

                  {creator.phone && (
                    <div>
                      <div className="text-sm font-medium text-gray-600">Phone</div>
                      <div className="text-sm">{creator.phone}</div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Followers</div>
                      <div className="text-lg font-semibold">{creator.followers?.toLocaleString() || '0'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Avg Views</div>
                      <div className="text-lg font-semibold">{creator.avg_views?.toLocaleString() || '0'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Avg Likes</div>
                      <div className="text-lg font-semibold">{creator.avg_likes?.toLocaleString() || '0'}</div>
                    </div>
                  </div>

                  {/* Rate Card */}
                  {creator.rate_card && Object.keys(creator.rate_card).length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-2">Rate Card</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(creator.rate_card).map(([type, rate]) => (
                          <div key={type} className="flex justify-between p-2 bg-gray-50 rounded">
                            <span className="capitalize text-sm">{type}</span>
                            <span className="font-medium text-sm">{formatCurrency(rate as number)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags section removed */}

                  {/* Links */}
                  {creator.links && Object.keys(creator.links).length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-2">Links</div>
                      <div className="space-y-1">
                        {Object.entries(creator.links).map(([platform, url]) => (
                          <div key={platform}>
                            <a 
                              href={url as string} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm capitalize"
                            >
                              {platform}: {url}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {creator.notes && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-2">Notes</div>
                      <div className="text-sm bg-gray-50 p-3 rounded">{creator.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!isCreator && campaign && (
            <>
              {/* Campaign Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Name</div>
                      <div className="text-sm">{campaign.name}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Slug</div>
                      <div className="text-sm">{campaign.slug || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Brand Assigned</div>
                      <div className="text-sm">{campaign.brand || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Objective</div>
                      <div className="text-sm">{campaign.objective || 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Budget</div>
                      <div className="text-sm">{campaign.budget ? formatCurrency(campaign.budget) : 'Not set'}</div>
                    </div>
                  </div>

                  {(campaign.start_date || campaign.end_date) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-600">Start Date</div>
                        <div className="text-sm">{campaign.start_date ? formatDate(campaign.start_date) : 'Not set'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">End Date</div>
                        <div className="text-sm">{campaign.end_date ? formatDate(campaign.end_date) : 'Not set'}</div>
                      </div>
                    </div>
                  )}

                  {/* Brief */}
                  {campaign.default_brief && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-2">Default Brief</div>
                      <div className="text-sm bg-gray-50 p-3 rounded">{campaign.default_brief}</div>
                    </div>
                  )}

                  {/* Tags section removed */}

                  {/* Metadata */}
                  <div className="pt-4 border-t">
                    <div className="text-xs text-gray-500">
                      Created {formatDate(campaign.created_at)}
                      {campaign.updated_at !== campaign.created_at && (
                        <> • Updated {formatDate(campaign.updated_at)}</>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
