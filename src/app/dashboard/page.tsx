import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserMenu } from '@/components/auth/user-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Briefcase, Users, TrendingUp } from 'lucide-react'

function DashboardContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome to your booking tracker</p>
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
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                +1 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₫1,045,000,000</div>
              <p className="text-xs text-muted-foreground">
                +20% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +3 from last month
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Summer Collection Campaign</p>
                    <p className="text-sm text-gray-500">@fashionista_jane</p>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tech Product Launch</p>
                    <p className="text-sm text-gray-500">@tech_reviewer</p>
                  </div>
                  <Badge variant="outline">In Progress</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Skincare Routine</p>
                    <p className="text-sm text-gray-500">@beauty_influencer</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
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
