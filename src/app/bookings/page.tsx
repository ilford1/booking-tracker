'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getBookings } from '@/lib/actions/bookings'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BOOKING_STATUSES, STATUS_COLORS, type Booking } from '@/types'
import { isBookingOverdue, getDaysUntilDeadline, getDisplayStatus } from '@/lib/utils/booking-status'
import { BookingDialog } from '@/components/dialogs/booking-dialog'
import { StatusSelect } from '@/components/status-select'
import { BookingActionsMenu } from '@/components/booking-context-menu'
import { SearchInput } from '@/components/search-input'
import { CampaignFilter } from '@/components/campaign-filter'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Filter,
  LayoutGrid,
  List,
  User,
  Calendar,
  DollarSign,
  Download,
  Eye,
  ArrowRight,
  Edit,
  ExternalLink,
  Clock,
  AlertTriangle
} from 'lucide-react'

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [campaignFilter, setCampaignFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const bookingsData = await getBookings()
        setBookings(bookingsData)
        setFilteredBookings(bookingsData)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [refreshKey])

  const handleBookingSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Filter bookings based on search, status, and campaign
  useEffect(() => {
    let filtered = bookings

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(booking => 
        booking.creator?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.creator?.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.campaign?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.brief?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.utm_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.affiliate_code?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(booking => statusFilter.includes(booking.status))
    }

    // Apply campaign filter
    if (campaignFilter) {
      filtered = filtered.filter(booking => booking.campaign_id === campaignFilter)
    }

    setFilteredBookings(filtered)
  }, [bookings, searchQuery, statusFilter, campaignFilter])

  const handleExport = () => {
    const csvData = filteredBookings.map(booking => ({
      Creator: booking.creator?.name || 'Unknown',
      Campaign: booking.campaign?.name || 'Unknown',
      Status: booking.status,
      Rate: booking.agreed_amount || booking.offer_amount || 0,
      Brief: booking.brief || '',
      'UTM Code': booking.utm_code || '',
      'Contact Channel': booking.contact_channel || ''
    }))
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Bookings exported successfully!')
  }

  const getStatusBadgeColor = (booking: Booking) => {
    // Check if overdue first
    if (isBookingOverdue(booking)) {
      return 'bg-red-100 text-red-800 border-red-300'
    }
    
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_process: 'bg-blue-100 text-blue-800',
      content_submitted: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      completed: 'bg-emerald-100 text-emerald-800',
      canceled: 'bg-red-100 text-red-800'
    }
    return colors[booking.status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading bookings...</p>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  // Group bookings by status for Kanban view
  const kanbanColumns = BOOKING_STATUSES.map(status => ({
    status,
    title: status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    bookings: filteredBookings.filter(booking => booking.status === status),
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending
  }))

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
              <p className="text-gray-500 mt-1">
                Creator booking & tracking
              </p>
            </div>
            <div className="flex gap-2">
              <SearchInput 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search bookings..."
                className="w-64"
              />
              
              <CampaignFilter
                value={campaignFilter}
                onChange={setCampaignFilter}
                placeholder="All Campaigns"
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                    {statusFilter.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {statusFilter.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <div className="px-2 py-1.5 text-sm font-semibold">Status</div>
                  <DropdownMenuSeparator />
                  {BOOKING_STATUSES.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={statusFilter.includes(status)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setStatusFilter([...statusFilter, status])
                        } else {
                          setStatusFilter(statusFilter.filter(s => s !== status))
                        }
                      }}
                    >
                      {status.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {statusFilter.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setStatusFilter([])}>
                        Clear filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant={viewMode === 'table' ? 'default' : 'outline'} 
                className="gap-2"
                onClick={() => setViewMode(viewMode === 'kanban' ? 'table' : 'kanban')}
              >
                {viewMode === 'kanban' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                {viewMode === 'kanban' ? 'Table View' : 'Kanban View'}
              </Button>
              
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
              
              <BookingDialog onSuccess={handleBookingSuccess} />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Bookings
              </CardTitle>
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredBookings.length}</div>
              <p className="text-xs text-gray-500">
                {bookings.length !== filteredBookings.length && `of ${bookings.length} total`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Bookings
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredBookings.filter(b => 
                  ['in_process', 'content_submitted', 'approved'].includes(b.status)
                ).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  filteredBookings.reduce((sum, b) => sum + (b.agreed_amount || b.offer_amount || 0), 0)
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completion Rate
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredBookings.length > 0
                  ? Math.round(
                      (filteredBookings.filter(b => ['completed'].includes(b.status)).length / filteredBookings.length) * 100
                    )
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Views */}
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first booking to start tracking creator collaborations.
                </p>
                <BookingDialog onSuccess={handleBookingSuccess} />
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'kanban' ? (
          /* Kanban View */
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max">
              {kanbanColumns.map((column) => (
                <div key={column.status} className="flex-shrink-0 w-80">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {column.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {column.bookings.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3 min-h-[200px]">
                    {column.bookings.map((booking) => (
                      <Card 
                        key={booking.id} 
                        className="hover:shadow-md transition-all duration-200 cursor-pointer group border hover:border-blue-200"
                        onClick={() => router.push(`/bookings/${booking.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm group-hover:text-blue-600 transition-colors">
                                  {booking.creator?.name || 'Unknown Creator'}
                                </p>
                                <ArrowRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {booking.campaign?.name || 'No Campaign'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className={`text-xs ${getStatusBadgeColor(booking)}`}>
                                {getDisplayStatus(booking).replace('_', ' ')}
                              </Badge>
                              {isBookingOverdue(booking) && (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            <div className="text-xs text-gray-600">
                              {formatCurrency(booking.agreed_amount || booking.offer_amount || 0)}
                            </div>
                            
                            {(booking as any).scheduled_date && (
                              <div className="flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                <span className={getDaysUntilDeadline(booking).isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                                  {getDaysUntilDeadline(booking).message}
                                </span>
                              </div>
                            )}
                            
                            {(booking as any).content_type && (
                              <div className="text-xs text-gray-500">
                                Content: {(booking as any).content_type}
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-400">
                              Created {formatDate(new Date(booking.created_at))}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <StatusSelect 
                              bookingId={booking.id}
                              currentStatus={booking.status}
                              onStatusUpdate={handleBookingSuccess}
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs px-2 py-1 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/bookings/${booking.id}`)
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {column.bookings.length === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                        <p className="text-sm text-gray-500">
                          No bookings in {column.title.toLowerCase()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Table View */
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Bookings Table</h3>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Brief</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking, index) => (
                    <TableRow 
                      key={booking.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors focus-within:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-200 focus-within:ring-opacity-50"
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          router.push(`/bookings/${booking.id}`)
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium flex items-center gap-2 group">
                              {booking.creator?.name || 'Unknown'}
                              <ArrowRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <p className="text-sm text-gray-500">{booking.creator?.handle || ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{booking.campaign?.name || 'No Campaign'}</span>
                          {booking.campaign?.name && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/campaigns/${booking.campaign_id}`)
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(booking)}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(booking.agreed_amount || booking.offer_amount || 0)}
                      </TableCell>
                      <TableCell>
                        <div title={booking.brief || 'No brief'}>
                          {booking.brief ? booking.brief.substring(0, 50) + '...' : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(new Date(booking.created_at))}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/bookings/${booking.id}`)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <BookingDialog 
                            booking={booking}
                            onSuccess={handleBookingSuccess}
                            trigger={
                              <Button size="sm" variant="ghost">
                                <Edit className="h-3 w-3" />
                              </Button>
                            }
                          />
                          <BookingActionsMenu 
                            booking={booking}
                            onStatusUpdate={handleBookingSuccess}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredBookings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No bookings match your current filters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
