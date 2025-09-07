'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserMenu } from '@/components/auth/user-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StaffWorkloadWidget } from '@/components/widgets/staff-workload-widget'
import { getBookings } from '@/lib/actions/bookings'
import { getUserProfiles, getCurrentUser, isUserAdmin } from '@/lib/actions/users'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Briefcase, Users, TrendingUp, Loader2 } from 'lucide-react'
import type { Booking } from '@/types'
import type { UserProfile } from '@/types/database'

function DashboardContent() {
  const [bookings, setBookings] = React.useState<Booking[]>([])
  const [users, setUsers] = React.useState<UserProfile[]>([])
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null)
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // First try to get bookings
        const bookingsData = await getBookings()
        setBookings(bookingsData)
        
        // Then try to get user data (may fail if schema isn't set up)
        try {
          const [usersData, currentUserData, adminStatus] = await Promise.all([
            getUserProfiles(),
            getCurrentUser(),
            isUserAdmin()
          ])
          setUsers(usersData)
          setCurrentUser(currentUserData)
          setIsAdmin(adminStatus)
        } catch (userError) {
          console.warn('User data not available yet:', userError)
          setUsers([])
          setCurrentUser(null)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Loading your dashboard...</p>
              </div>
              <UserMenu showFullProfile={true} />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const totalBookings = bookings.length
  const activeBookings = bookings.filter(b => 
    ['pending', 'deal', 'delivered', 'content_submitted', 'approved'].includes(b.status)
  ).length
  const completedBookings = bookings.filter(b => b.status === 'completed').length
  const totalValue = bookings.reduce((sum, b) => sum + (b.agreed_amount || b.offer_amount || 0), 0)
  const recentBookings = bookings.slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {currentUser?.first_name || 'User'}!</p>
            </div>
            <UserMenu showFullProfile={true} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Quick stats cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                {activeBookings} active bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBookings}</div>
              <p className="text-xs text-muted-foreground">
                {completedBookings} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Across all bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Team members
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>
                Your latest booking activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.length > 0 ? (
                  recentBookings.map(booking => (
                    <div key={booking.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{booking.campaign?.name || 'No Campaign'}</p>
                        <p className="text-sm text-gray-500">{booking.creator?.name || 'Unknown Creator'}</p>
                      </div>
                      <Badge 
                        variant={booking.status === 'completed' ? 'default' : 'outline'}
                        className={
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'deal' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'delivered' ? 'bg-orange-100 text-orange-800' :
                          booking.status === 'content_submitted' ? 'bg-purple-100 text-purple-800' :
                          booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent bookings</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Staff workload or Quick actions */}
          {isAdmin && users.length > 0 ? (
            <StaffWorkloadWidget 
              bookings={bookings}
              users={users}
              currentUser={currentUser}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <Calendar className="h-6 w-6 text-blue-600 mb-2" />
                    <p className="font-medium">New Booking</p>
                    <p className="text-sm text-gray-500">Create a new booking</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <Briefcase className="h-6 w-6 text-green-600 mb-2" />
                    <p className="font-medium">New Campaign</p>
                    <p className="text-sm text-gray-500">Start a new campaign</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <Users className="h-6 w-6 text-purple-600 mb-2" />
                    <p className="font-medium">Add Creator</p>
                    <p className="text-sm text-gray-500">Onboard new creator</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <TrendingUp className="h-6 w-6 text-orange-600 mb-2" />
                    <p className="font-medium">View Reports</p>
                    <p className="text-sm text-gray-500">Check analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRoles={['customer', 'service_provider', 'business_admin', 'super_admin']}>
      <DashboardContent />
    </ProtectedRoute>
  )
}
