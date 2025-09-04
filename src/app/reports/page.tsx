'use client'

import React, { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { getDashboardKPIs, getBookingStatusFunnel } from '@/lib/actions/dashboard'
import { getBookings } from '@/lib/actions/bookings'
import { getPayments } from '@/lib/actions/payments'
import { formatCurrency } from '@/lib/utils'
import type { DashboardKPIs, FunnelData, Booking, Payment } from '@/types'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  BarChart3,
  Download,
  Filter
} from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function ReportsPage() {
  const [kpis, setKpis] = useState<DashboardKPIs>({} as DashboardKPIs)
  const [funnelData, setFunnelData] = useState<FunnelData[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpisData, funnelData, bookingsData, paymentsData] = await Promise.all([
          getDashboardKPIs(),
          getBookingStatusFunnel(),
          getBookings(),
          getPayments()
        ])
        
        setKpis(kpisData)
        setFunnelData(funnelData)
        setBookings(bookingsData)
        setPayments(paymentsData)
      } catch (error) {
        console.error('Error fetching reports data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Process data for charts
  const campaignPerformance = bookings.reduce((acc, booking) => {
    const campaignName = booking.campaign?.name || 'Unknown'
    if (!acc[campaignName]) {
      acc[campaignName] = { name: campaignName, bookings: 0, revenue: 0, completed: 0 }
    }
    acc[campaignName].bookings += 1
    acc[campaignName].revenue += booking.agreed_amount || booking.offer_amount || 0
    if (['posted', 'reported', 'paid'].includes(booking.status)) {
      acc[campaignName].completed += 1
    }
    return acc
  }, {} as Record<string, any>)

  const campaignData = Object.values(campaignPerformance)

  const monthlyRevenue = payments
    .filter(p => p.paid_at)
    .reduce((acc, payment) => {
      const month = new Date(payment.paid_at!).toISOString().slice(0, 7)
      if (!acc[month]) {
        acc[month] = { month, revenue: 0, count: 0 }
      }
      acc[month].revenue += payment.amount || 0
      acc[month].count += 1
      return acc
    }, {} as Record<string, any>)

  const revenueData = Object.values(monthlyRevenue).sort((a, b) => a.month.localeCompare(b.month))

  const platformData = bookings.reduce((acc, booking) => {
    const platform = booking.creator?.platform || 'other'
    if (!acc[platform]) {
      acc[platform] = { name: platform, value: 0, bookings: 0 }
    }
    acc[platform].value += booking.agreed_amount || booking.offer_amount || 0
    acc[platform].bookings += 1
    return acc
  }, {} as Record<string, any>)

  const platformChartData = Object.values(platformData)

  if (loading) {
    return (
      <AppShell>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading reports...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-500 mt-1">
                Performance insights and campaign analytics
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(kpis.budgetUsed || 0)}
              </div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Conversion Rate
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.length > 0 
                  ? Math.round((bookings.filter(b => ['posted', 'reported', 'paid'].includes(b.status)).length / bookings.length) * 100)
                  : 0
                }%
              </div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Deal Size
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.length > 0
                  ? formatCurrency(
                      bookings.reduce((sum, b) => sum + (b.agreed_amount || b.offer_amount || 0), 0) / bookings.length
                    )
                  : formatCurrency(0)
                }
              </div>
              <div className="flex items-center text-xs text-red-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                -3% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Creators
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(bookings.map(b => b.creator_id)).size}
              </div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8 this month
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Campaign Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : value,
                    name === 'revenue' ? 'Revenue' : name === 'bookings' ? 'Bookings' : 'Completed'
                  ]} />
                  <Bar dataKey="bookings" fill="#8884d8" />
                  <Bar dataKey="completed" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Platform Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={platformChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="bookings"
                  >
                    {platformChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((item, index) => (
                <div key={item.status} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium capitalize">
                    {item.status.replace('_', ' ')}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-blue-600 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ width: `${item.percentage}%` }}
                      >
                        {item.count}
                      </div>
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
