'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getCreators, deleteCreator } from '@/lib/actions/creators'
import { getBookings } from '@/lib/actions/bookings'
import { formatCurrency } from '@/lib/utils'
import type { Creator, Booking } from '@/types'
import { CreatorDialog } from '@/components/dialogs/creator-dialog'
import { BookingDialog } from '@/components/dialogs/booking-dialog'
import { DetailsDialog } from '@/components/dialogs/details-dialog'
import { SearchInput } from '@/components/search-input'
import { CampaignFilter } from '@/components/campaign-filter'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Filter,
  ExternalLink,
  Instagram,
  MessageCircle,
  Download,
  Grid3X3,
  List,
  Trash2,
  Edit
} from 'lucide-react'

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [campaignFilter, setCampaignFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [creatorsData, bookingsData] = await Promise.all([
          getCreators(),
          getBookings()
        ])
        setCreators(creatorsData)
        setBookings(bookingsData)
        setFilteredCreators(creatorsData)
      } catch (error) {
        console.error('Error fetching creators:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [refreshKey])

  // Filter creators based on search, platform, and campaign
  useEffect(() => {
    let filtered = creators
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(creator => 
        creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (creator.handle && creator.handle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (creator.tags && creator.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    }
    
    // Apply platform filter
    if (platformFilter && platformFilter !== 'all') {
      filtered = filtered.filter(creator => creator.platform === platformFilter)
    }
    
    // Apply campaign filter - show only creators with bookings in the selected campaign
    if (campaignFilter) {
      const creatorIdsInCampaign = bookings
        .filter(booking => booking.campaign_id === campaignFilter)
        .map(booking => booking.creator_id)
        .filter(Boolean)
      
      filtered = filtered.filter(creator => creatorIdsInCampaign.includes(creator.id))
    }
    
    setFilteredCreators(filtered)
  }, [creators, bookings, searchQuery, platformFilter, campaignFilter])

  const handleCreatorSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id)
    try {
      await deleteCreator(id)
      toast.success(`Deleted ${name} successfully`)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      toast.error('Failed to delete creator')
      console.error('Delete error:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = () => {
    const csvData = filteredCreators.map(creator => ({
      Name: creator.name,
      Handle: creator.handle || '',
      Email: creator.email || '',
      Platform: creator.platform || '',
      Followers: creator.followers || 0,
      'Engagement Rate': creator.avg_likes || 0,
      Rate: creator.rate_card ? Object.values(creator.rate_card)[0] : 0,
      Tags: creator.tags ? creator.tags.join(', ') : '',
      Location: '',
      Notes: creator.notes || ''
    }))
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `creators-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Creators exported successfully!')
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
                KOL/KOC management
              </p>
            </div>
            <div className="flex gap-2">
              <SearchInput 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search creators..."
                className="w-64"
              />
              
              <CampaignFilter
                value={campaignFilter}
                onChange={setCampaignFilter}
                placeholder="All Campaigns"
              />
              
              <select 
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <option value="">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="other">Other</option>
              </select>
              <div className="flex border border-input rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none border-r"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
              <CreatorDialog onSuccess={handleCreatorSuccess} />
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

        {/* Creators Display */}
        {creators.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No creators yet</h3>
                <p className="text-gray-500 mb-4">
                  Get started by adding your first KOL or content creator to the platform.
                </p>
                <CreatorDialog onSuccess={handleCreatorSuccess} />
              </div>
            </CardContent>
          </Card>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No creators found matching your search criteria.</p>
            <Button 
              variant="ghost" 
              onClick={() => {
                setSearchQuery('')
                setPlatformFilter('')
              }}
              className="mt-2"
            >
              Clear Filters
            </Button>
          </div>
        ) : viewMode === 'table' ? (
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCreators.map((creator) => (
                    <TableRow key={creator.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{creator.name}</div>
                            <div className="text-sm text-gray-500">{creator.handle}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {creator.platform && getPlatformIcon(creator.platform)}
                          <Badge variant="secondary" className="capitalize">
                            {creator.platform || 'other'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {creator.followers?.toLocaleString() || '0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>👁️ {creator.avg_views?.toLocaleString() || '0'}</div>
                          <div>❤️ {creator.avg_likes?.toLocaleString() || '0'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {creator.rate_card ? (
                          <div className="text-sm">
                            {Object.entries(creator.rate_card).slice(0, 2).map(([type, rate]) => (
                              <div key={type}>
                                {formatCurrency(rate as number)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {creator.email && <div>📧 {creator.email}</div>}
                          {creator.phone && <div>📱 {creator.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <DetailsDialog 
                            data={creator}
                            type="creator"
                            trigger={
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            }
                          />
                          <BookingDialog 
                            prefilledCreatorId={creator.id}
                            onSuccess={handleCreatorSuccess}
                            trigger={
                              <Button size="sm">
                                Book
                              </Button>
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={deletingId === creator.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Creator</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {creator.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(creator.id, creator.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCreators.map((creator) => (
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
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {creator.platform || 'other'}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={deletingId === creator.id}
                            className="p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Creator</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {creator.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(creator.id, creator.name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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

                  {/* Tags section removed */}

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
                    <DetailsDialog 
                      data={creator}
                      type="creator"
                      trigger={
                        <Button variant="outline" size="sm" className="flex-1">
                          View Profile
                        </Button>
                      }
                    />
                    <BookingDialog 
                      prefilledCreatorId={creator.id}
                      onSuccess={handleCreatorSuccess}
                      trigger={
                        <Button size="sm" className="flex-1">
                          Create Booking
                        </Button>
                      }
                    />
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
