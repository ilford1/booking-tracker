'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { CalendarWidget } from '@/components/calendar-widget'
import { ScheduleWidget } from '@/components/schedule-widget'
import { Button } from '@/components/ui/button'
import { BookingDialog } from '@/components/dialogs/booking-dialog'
import { CampaignFilter } from '@/components/campaign-filter'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { Download, Calendar, Plus, CalendarPlus } from 'lucide-react'

export default function CalendarPage() {
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [campaignFilter, setCampaignFilter] = useState<string | null>(null)

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                Calendar
              </h1>
              <p className="text-gray-500 mt-1">
                View and manage your campaign schedules and bookings
              </p>
            </div>
            <div className="flex gap-2">
              <CampaignFilter
                value={campaignFilter}
                onChange={setCampaignFilter}
                placeholder="All Campaigns"
              />
              
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/reports">
                  <Download className="h-4 w-4" />
                  Export Schedule
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => setShowBookingDialog(true)}
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    New Booking
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookings" className="cursor-pointer">
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Manage Bookings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Calendar and Schedule Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Widget */}
          <CalendarWidget className="lg:col-span-2" campaignFilter={campaignFilter} />
          
          {/* Schedule Widget */}
          <ScheduleWidget campaignFilter={campaignFilter} />
        </div>
      </div>

      {/* Dialogs */}
      {showBookingDialog && (
        <BookingDialog 
          trigger={
            <div /> // Hidden trigger since we control it manually
          }
          onSuccess={() => {
            setShowBookingDialog(false)
            window.location.reload() // Refresh to show new booking
          }}
        />
      )}
    </AppShell>
  )
}
