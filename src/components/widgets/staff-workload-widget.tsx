'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { UserAvatar } from '@/components/ui/user-avatar'
import { formatCurrency } from '@/lib/utils'
import { Users, TrendingUp, AlertCircle } from 'lucide-react'
import type { Booking } from '@/types'
import type { UserProfile } from '@/types/database'

interface StaffWorkloadWidgetProps {
  bookings: Booking[]
  users: UserProfile[]
  currentUser?: UserProfile | null
  className?: string
}

interface StaffStats {
  user: UserProfile
  totalBookings: number
  activeBookings: number
  completedBookings: number
  totalValue: number
  overdue: number
  recentBookings: Booking[]
}

export function StaffWorkloadWidget({ 
  bookings, 
  users, 
  currentUser, 
  className = '' 
}: StaffWorkloadWidgetProps) {
  const staffStats: StaffStats[] = React.useMemo(() => {
    return users.map(user => {
      const userBookings = bookings.filter(booking => booking.actor === user.id)
      const activeBookings = userBookings.filter(b => 
        ['pending', 'deal', 'delivered', 'content_submitted', 'approved'].includes(b.status)
      )
      const completedBookings = userBookings.filter(b => b.status === 'completed')
      const overdueBookings = userBookings.filter(booking => {
        if (!booking.deadline) return false
        return new Date(booking.deadline) < new Date() && !['completed'].includes(booking.status)
      })
      
      return {
        user,
        totalBookings: userBookings.length,
        activeBookings: activeBookings.length,
        completedBookings: completedBookings.length,
        totalValue: userBookings.reduce((sum, b) => sum + (b.agreed_amount || b.offer_amount || 0), 0),
        overdue: overdueBookings.length,
        recentBookings: userBookings
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)
      }
    }).filter(stats => stats.totalBookings > 0) // Only show staff with bookings
      .sort((a, b) => b.totalBookings - a.totalBookings) // Sort by total bookings
  }, [bookings, users])

  const maxBookings = Math.max(...staffStats.map(s => s.totalBookings), 1)

  if (staffStats.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Workload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No staff bookings found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Staff Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {staffStats.map(stats => {
          const workloadPercentage = (stats.totalBookings / maxBookings) * 100
          const completionRate = stats.totalBookings > 0 
            ? (stats.completedBookings / stats.totalBookings) * 100 
            : 0

          return (
            <div key={stats.user.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <UserAvatar 
                  user={stats.user} 
                  size="md" 
                  showName 
                  showRole 
                  className="flex-1 min-w-0" 
                />
                <div className="flex items-center gap-2 ml-3">
                  {stats.overdue > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {stats.overdue} overdue
                    </Badge>
                  )}
                  {stats.user.id === currentUser?.id && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-sm">
                <div className="text-center">
                  <p className="font-medium text-lg">{stats.totalBookings}</p>
                  <p className="text-gray-500 text-xs">Total</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg text-blue-600">{stats.activeBookings}</p>
                  <p className="text-gray-500 text-xs">Active</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg text-green-600">{stats.completedBookings}</p>
                  <p className="text-gray-500 text-xs">Done</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg">{formatCurrency(stats.totalValue)}</p>
                  <p className="text-gray-500 text-xs">Value</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Workload</span>
                  <span>{workloadPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={workloadPercentage} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Completion Rate</span>
                  <span>{completionRate.toFixed(0)}%</span>
                </div>
                <Progress 
                  value={completionRate} 
                  className="h-2"
                />
              </div>

              {stats.recentBookings.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Recent Bookings:</p>
                  <div className="space-y-1">
                    {stats.recentBookings.map(booking => (
                      <div key={booking.id} className="flex items-center justify-between text-xs">
                        <span className="truncate flex-1">
                          {booking.creator?.name || 'Unknown'} • {booking.campaign?.name || 'No Campaign'}
                        </span>
                        <Badge 
                          variant="outline" 
                          className="text-xs ml-2"
                          style={{
                            backgroundColor: booking.status === 'completed' ? '#dcfce7' : 
                                           booking.status === 'deal' ? '#dbeafe' :
                                           booking.status === 'delivered' ? '#fed7aa' :
                                           booking.status === 'content_submitted' ? '#e9d5ff' :
                                           booking.status === 'approved' ? '#dcfce7' :
                                           booking.status === 'pending' ? '#fef3c7' : '#f3f4f6',
                            borderColor: booking.status === 'completed' ? '#16a34a' :
                                        booking.status === 'deal' ? '#2563eb' :
                                        booking.status === 'delivered' ? '#ea580c' :
                                        booking.status === 'content_submitted' ? '#9333ea' :
                                        booking.status === 'approved' ? '#16a34a' :
                                        booking.status === 'pending' ? '#d97706' : '#6b7280'
                          }}
                        >
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {staffStats.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No staff bookings to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
