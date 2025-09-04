// Force dynamic rendering since this page uses server actions with cookies
export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDashboardKPIs, getRecentActivity } from '@/lib/actions/dashboard'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CampaignDialog } from '@/components/dialogs/campaign-dialog'
import { CreatorDialog } from '@/components/dialogs/creator-dialog'
import { BookingDialog } from '@/components/dialogs/booking-dialog'
import { CalendarWidget } from '@/components/calendar-widget'
import { ScheduleWidget } from '@/components/schedule-widget'
import Link from 'next/link'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Megaphone,
  Download
} from 'lucide-react'

async function DashboardContent() {
  const kpis = await getDashboardKPIs()
  const recentActivity = await getRecentActivity()

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 mt-1">
                Welcome back! Here's what's happening with your KOL campaigns.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/reports">
                  <Download className="h-4 w-4" />
                  Export Report
                </Link>
              </Button>
              <CampaignDialog />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Campaigns
              </CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.activeCampaigns}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                Active campaigns
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Posts This Week
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.bookedPostsThisWeek}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                This week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Budget Used
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(kpis.budgetUsed)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                of {formatCurrency(kpis.totalBudget)} total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Tasks
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.pendingDeliverables}</div>
              <div className="flex items-center text-xs text-red-600 mt-1">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                {kpis.overdueTasks} overdue
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar and Schedule Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Calendar Widget */}
          <CalendarWidget className="lg:col-span-2" />
          
          {/* Schedule Widget */}
          <ScheduleWidget />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1 text-sm">
                    <span className="font-medium">@fashionista_vn</span> posted content for 
                    <span className="font-medium"> Low-Rise Logic Drop</span>
                  </div>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1 text-sm">
                    <span className="font-medium">Payment</span> of ₫3,000,000 sent to 
                    <span className="font-medium">@beauty_influencer</span>
                  </div>
                  <span className="text-xs text-gray-500">4h ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1 text-sm">
                    Content submitted for review: 
                    <span className="font-medium">Polka-Dot Swim Campaign</span>
                  </div>
                  <span className="text-xs text-gray-500">6h ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute requiredRoles={['customer', 'service_provider', 'business_admin', 'super_admin']}>
      <DashboardContent />
    </ProtectedRoute>
  )
}
