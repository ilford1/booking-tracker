'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CampaignDialog } from '@/components/dialogs/campaign-dialog'
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
  Download,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

interface DashboardKPIs {
  activeCampaigns: number
  bookedPostsThisWeek: number
  budgetUsed: number
  totalBudget: number
  pendingDeliverables: number
  overdueTasks: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const [kpis, setKpis] = useState<DashboardKPIs>({
    activeCampaigns: 0,
    bookedPostsThisWeek: 0,
    budgetUsed: 0,
    totalBudget: 0,
    pendingDeliverables: 0,
    overdueTasks: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch campaigns count
      const { count: campaignsCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Fetch current week's posts
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      const { count: postsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString())
        .eq('status', 'confirmed')

      // Mock data for now (since we can't fetch payments/budgets reliably)
      setKpis({
        activeCampaigns: campaignsCount || 0,
        bookedPostsThisWeek: postsCount || 0,
        budgetUsed: 25000000, // Mock data
        totalBudget: 100000000, // Mock data
        pendingDeliverables: 3, // Mock data
        overdueTasks: 1 // Mock data
      })

      // Set mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'post',
          description: '@fashionista_vn posted content for Low-Rise Logic Drop',
          timestamp: '2h ago'
        },
        {
          id: '2',
          type: 'payment',
          description: 'Payment of ₫3,000,000 sent to @beauty_influencer',
          timestamp: '4h ago'
        },
        {
          id: '3',
          type: 'review',
          description: 'Content submitted for review: Polka-Dot Swim Campaign',
          timestamp: '6h ago'
        }
      ])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data. Using fallback values.')
      
      // Use fallback data
      setKpis({
        activeCampaigns: 0,
        bookedPostsThisWeek: 0,
        budgetUsed: 0,
        totalBudget: 0,
        pendingDeliverables: 0,
        overdueTasks: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['customer', 'service_provider', 'business_admin', 'super_admin']}>
        <AppShell>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading dashboard...</p>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['customer', 'service_provider', 'business_admin', 'super_admin']}>
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
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'post' ? 'bg-green-500' :
                        activity.type === 'payment' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <div className="flex-1 text-sm">
                        {activity.description}
                      </div>
                      <span className="text-xs text-gray-500">{activity.timestamp}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
