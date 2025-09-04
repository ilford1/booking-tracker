'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCreators } from '@/lib/actions/creators'
import { formatCurrency } from '@/lib/utils'
import type { Creator } from '@/types'
import { 
  Plus, 
  Search, 
  Filter,
  ExternalLink,
  Instagram,
  MessageCircle
} from 'lucide-react'

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const creatorsData = await getCreators()
        setCreators(creatorsData)
      } catch (error) {
        console.error('Error fetching creators:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

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

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading creators...</p>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Creators</h1>
              <p className="text-gray-500 mt-1">
                Manage your KOL/KOC directory and their information
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Creator
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Creators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creators.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Instagram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {creators.filter(c => c.platform === 'instagram').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                TikTok
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {creators.filter(c => c.platform === 'tiktok').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg. Followers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {creators.length > 0 
                  ? Math.round(creators.reduce((sum, c) => sum + (c.followers || 0), 0) / creators.length).toLocaleString()
                  : '0'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Creators Grid */}
        {creators.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No creators yet</h3>
                <p className="text-gray-500 mb-4">
                  Get started by adding your first KOL or content creator to the platform.
                </p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Creator
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <Card key={creator.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{creator.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {creator.platform && getPlatformIcon(creator.platform)}
                        <span className="text-sm text-gray-500">
                          {creator.handle}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {creator.platform || 'other'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {creator.followers?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-500">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {creator.avg_views?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-500">Avg Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {creator.avg_likes?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-500">Avg Likes</div>
                    </div>
                  </div>

                  {/* Rate Card */}
                  {creator.rate_card && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-900 mb-2">Rates</div>
                      <div className="space-y-1">
                        {Object.entries(creator.rate_card).map(([type, rate]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span className="capitalize text-gray-600">{type}</span>
                            <span className="font-medium">
                              {formatCurrency(rate as number)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {creator.tags && creator.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {creator.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {creator.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{creator.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {creator.email && (
                      <div className="text-sm text-gray-600">
                        📧 {creator.email}
                      </div>
                    )}
                    {creator.phone && (
                      <div className="text-sm text-gray-600">
                        📱 {creator.phone}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Profile
                    </Button>
                    <Button size="sm" className="flex-1">
                      Create Booking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
