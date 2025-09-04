'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getBookings } from '@/lib/actions/bookings'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BOOKING_STATUSES, STATUS_COLORS, type Booking } from '@/types'
import { BookingDialog } from '@/components/dialogs/booking-dialog'
import { StatusSelect } from '@/components/status-select'
import { 
  Plus, 
  Search, 
  Filter,
  LayoutGrid,
  List,
  User,
  Calendar,
  DollarSign
} from 'lucide-react'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const bookingsData = await getBookings()
        setBookings(bookingsData)
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
    bookings: bookings.filter(booking => booking.status === status),
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.prospect
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
                Manage creator bookings and track their progress through the workflow
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
              <Button variant="outline" className="gap-2">
                <List className="h-4 w-4" />
                Table View
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
              <div className="text-2xl font-bold">{bookings.length}</div>
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
                {bookings.filter(b => 
                  ['booked', 'content_due', 'submitted', 'approved'].includes(b.status)
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
                  bookings.reduce((sum, b) => sum + (b.agreed_amount || b.offer_amount || 0), 0)
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
                {bookings.length > 0
                  ? Math.round(
                      (bookings.filter(b => ['posted', 'reported', 'paid'].includes(b.status)).length / bookings.length) * 100
                    )
                  : 0
                }%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
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
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max">
              {kanbanColumns.map((column) => (
                <div key={column.status} className="flex-shrink-0 w-80">
                  {/* Column Header */}
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

                  {/* Column Content */}
                  <div className="space-y-3 min-h-[200px]">
                    {column.bookings.map((booking) => (
                      <Card key={booking.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-sm font-medium">
                                {booking.creator?.name || 'Unknown Creator'}
                              </CardTitle>
                              <p className="text-xs text-gray-500 mt-1">
                                {booking.campaign?.name || 'No Campaign'}
                              </p>
                            </div>
                            <Badge className={`text-xs ${column.color}`}>
                              {column.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {/* Creator Handle */}
                          {booking.creator?.handle && (
                            <div className="text-xs text-gray-600 mb-2">
                              @{booking.creator.handle}
                            </div>
                          )}

                          {/* Amount */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">Amount:</span>
                            <span className="text-xs font-medium">
                              {booking.agreed_amount 
                                ? formatCurrency(booking.agreed_amount)
                                : booking.offer_amount
                                ? formatCurrency(booking.offer_amount)
                                : 'Not set'
                              }
                            </span>
                          </div>

                          {/* Contact Channel */}
                          {booking.contact_channel && (
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">Contact:</span>
                              <span className="text-xs capitalize">
                                {booking.contact_channel}
                              </span>
                            </div>
                          )}

                          {/* Codes */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {booking.utm_code && (
                              <Badge variant="outline" className="text-xs">
                                UTM: {booking.utm_code}
                              </Badge>
                            )}
                            {booking.affiliate_code && (
                              <Badge variant="outline" className="text-xs">
                                AFF: {booking.affiliate_code}
                              </Badge>
                            )}
                          </div>

                          {/* Timestamps */}
                          <div className="text-xs text-gray-400 mb-3">
                            Created {formatDate(booking.created_at)}
                          </div>

                          {/* Status Update */}
                          <div className="mb-3">
                            <StatusSelect 
                              bookingId={booking.id}
                              currentStatus={booking.status}
                              onStatusUpdate={handleBookingSuccess}
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="flex-1 text-xs">
                              View
                            </Button>
                            <BookingDialog 
                              booking={booking}
                              onSuccess={handleBookingSuccess}
                              trigger={
                                <Button size="sm" className="flex-1 text-xs">
                                  Edit
                                </Button>
                              }
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Empty State for Column */}
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
        )}
      </div>
    </AppShell>
  )
}
