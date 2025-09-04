'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCampaigns, getActiveCampaigns } from '@/lib/actions/campaigns'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Campaign } from '@/types'
import { CampaignDialog } from '@/components/dialogs/campaign-dialog'
import { BookingDialog } from '@/components/dialogs/booking-dialog'
import { DetailsDialog } from '@/components/dialogs/details-dialog'
import { SearchInput } from '@/components/search-input'
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Target,
  Clock
} from 'lucide-react'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [campaignsData, activeCampaignsData] = await Promise.all([
          getCampaigns(),
          getActiveCampaigns()
        ])
        setCampaigns(campaignsData)
        setFilteredCampaigns(campaignsData)
        setActiveCampaigns(activeCampaignsData)
      } catch (error) {
        console.error('Error fetching campaigns:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [refreshKey])

  // Filter campaigns based on search
  useEffect(() => {
    if (searchQuery) {
      const filtered = campaigns.filter(campaign => 
        campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (campaign.objective && campaign.objective.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (campaign.tags && campaign.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      )
      setFilteredCampaigns(filtered)
    } else {
      setFilteredCampaigns(campaigns)
    }
  }, [campaigns, searchQuery])

  const handleCampaignSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  const getCampaignStatus = (campaign: any) => {
    const today = new Date()
    const startDate = campaign.start_date ? new Date(campaign.start_date) : null
    const endDate = campaign.end_date ? new Date(campaign.end_date) : null

    if (startDate && startDate > today) {
      return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' }
    }
    if (endDate && endDate < today) {
      return { status: 'completed', color: 'bg-gray-100 text-gray-800' }
    }
    return { status: 'active', color: 'bg-green-100 text-green-800' }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading campaigns...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
              <p className="text-gray-500 mt-1">
                Manage your marketing campaigns and track their performance
              </p>
            </div>
            <div className="flex gap-2">
              <SearchInput 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search campaigns..."
                className="w-64"
              />
              <CampaignDialog onSuccess={handleCampaignSuccess} />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Campaigns
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaigns.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Campaigns
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCampaigns.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Budget
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  campaigns.reduce((sum, c) => sum + (c.budget || 0), 0)
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Budget
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaigns.length > 0 
                  ? formatCurrency(
                      campaigns.reduce((sum, c) => sum + (c.budget || 0), 0) / campaigns.length
                    )
                  : formatCurrency(0)
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first marketing campaign to start managing KOL collaborations.
                </p>
                <CampaignDialog onSuccess={handleCampaignSuccess} />
              </div>
            </CardContent>
          </Card>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No campaigns found matching your search.</p>
            <Button 
              variant="ghost" 
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredCampaigns.map((campaign) => {
              const { status, color } = getCampaignStatus(campaign)
              
              return (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{campaign.name}</CardTitle>
                        {campaign.objective && (
                          <p className="text-gray-600 mt-1">{campaign.objective}</p>
                        )}
                      </div>
                      <Badge className={`ml-2 capitalize ${color}`}>
                        {status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Budget */}
                    {campaign.budget && (
                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {formatCurrency(campaign.budget)} budget
                        </span>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {campaign.start_date && campaign.end_date ? (
                          <>
                            {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                          </>
                        ) : campaign.start_date ? (
                          <>Starts {formatDate(campaign.start_date)}</>
                        ) : campaign.end_date ? (
                          <>Ends {formatDate(campaign.end_date)}</>
                        ) : (
                          'No timeline set'
                        )}
                      </span>
                    </div>

                    {/* Tags */}
                    {campaign.tags && campaign.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {campaign.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {campaign.tags.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{campaign.tags.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Brief Preview */}
                    {campaign.default_brief && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">Brief Preview</div>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {campaign.default_brief.length > 150
                            ? `${campaign.default_brief.substring(0, 150)}...`
                            : campaign.default_brief
                          }
                        </p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="text-xs text-gray-500 mb-4">
                      Created {formatDate(campaign.created_at)}
                      {campaign.slug && (
                        <> • Slug: {campaign.slug}</>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <DetailsDialog 
                        data={campaign}
                        type="campaign"
                        trigger={
                          <Button variant="outline" size="sm" className="flex-1">
                            View Details
                          </Button>
                        }
                      />
                      <BookingDialog 
                        prefilledCampaignId={campaign.id}
                        onSuccess={handleCampaignSuccess}
                        trigger={
                          <Button size="sm" className="flex-1">
                            Create Booking
                          </Button>
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
