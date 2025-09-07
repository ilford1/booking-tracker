'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { createClientWithFallback } from '@/utils/supabase/client-fallback'

interface DeliverableQuickAddProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface Booking {
  id: string
  campaign_name: string
  creator_username: string
  scheduled_date?: string
  content_type?: string
}

export function DeliverableQuickAdd({ open, onClose, onSuccess }: DeliverableQuickAddProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    booking_id: '',
    scheduled_date: '',
    content_type: '',
    notes: ''
  })

  useEffect(() => {
    if (open) {
      fetchBookings()
    }
  }, [open])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      // Try to create client and handle potential issues
      let supabase
      try {
        supabase = createClientWithFallback()
      } catch (clientError) {
        console.error('Failed to create Supabase client:', clientError)
        toast.error('Connection error. Please refresh the page and try again.')
        setBookings([])
        return
      }
      
      // Check if client is properly initialized
      if (!supabase) {
        console.error('Supabase client is not initialized')
        toast.error('Connection error. Please refresh the page.')
        setBookings([])
        return
      }
      
      // Fetch bookings without deliverables or all recent bookings
      const { data, error } = await supabase
        .from('bookings')
        .select('id, campaign_name, creator_username, scheduled_date, content_type')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) {
        // Handle specific error types
        if (error.code === 'PGRST116' || 
            error.code === 'PGRST204' || 
            error.message?.includes('relation') || 
            error.message?.includes('does not exist')) {
          console.log('Bookings table might not exist or is empty')
          toast.info('No bookings available. Create your first booking to get started.')
          setBookings([])
          return
        }
        
        // Handle authentication errors
        if (error.code === '401' || error.message?.includes('JWT')) {
          console.error('Authentication error:', error)
          toast.error('Please sign in to continue.')
          setBookings([])
          return
        }
        
        console.error('Database error:', error.code || error.message || error)
        toast.error('Unable to load bookings. Please try again.')
        setBookings([])
        return
      }
      
      // Filter to show bookings without scheduled_date first
      const sortedBookings = (data || []).sort((a, b) => {
        if (!a.scheduled_date && b.scheduled_date) return -1
        if (a.scheduled_date && !b.scheduled_date) return 1
        return 0
      })
      
      setBookings(sortedBookings)
      
      if (sortedBookings.length === 0) {
        console.log('No bookings found in database')
        // Don't show toast here as it's handled by the UI
      }
    } catch (error: any) {
      console.error('Unexpected error fetching bookings:', {
        message: error?.message,
        code: error?.code,
        details: error
      })
      
      // Check if it's a network error
      if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
        toast.error('Network error. Please check your internet connection.')
      } else {
        toast.error('Unable to load bookings. Please try again.')
      }
      
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.booking_id || !formData.scheduled_date || !formData.content_type) {
      toast.error('Please fill in all required fields')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      let supabase
      try {
        supabase = createClientWithFallback()
      } catch (clientError) {
        console.error('Failed to create Supabase client:', clientError)
        toast.error('Connection error. Please refresh the page and try again.')
        return
      }
      
      // Update the booking with deliverable information
      const { data, error } = await supabase
        .from('bookings')
        .update({
          scheduled_date: formData.scheduled_date,
          content_type: formData.content_type,
          notes: formData.notes ? 
            `${formData.notes}\n\n[Deadline added: ${new Date().toLocaleDateString()}]` : 
            `[Deadline added: ${new Date().toLocaleDateString()}]`
        })
        .eq('id', formData.booking_id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating booking:', error)
        if (error.code === 'PGRST116') {
          toast.error('Booking not found. It may have been deleted.')
        } else if (error.message?.includes('column')) {
          toast.error('Database schema issue. Please contact support.')
        } else {
          toast.error('Failed to add deadline. Please try again.')
        }
        return
      }
      
      if (data) {
        toast.success('✅ Deadline added to calendar!')
        // Reset form
        setFormData({
          booking_id: '',
          scheduled_date: '',
          content_type: '',
          notes: ''
        })
        onSuccess?.()
      }
    } catch (error: any) {
      console.error('Unexpected error adding deliverable:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Add Content Deadline
          </DialogTitle>
          <DialogDescription>
            Set a deliverable deadline for an existing booking. This will appear on your calendar.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">
              No bookings found. Create a booking first to add deadlines.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => {
                onClose()
                // Trigger the booking dialog instead
                const bookingBtn = document.querySelector('[data-booking-trigger]')
                if (bookingBtn) (bookingBtn as HTMLElement).click()
              }}>
                Create Booking
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booking">Select Booking *</Label>
              <Select 
                value={formData.booking_id} 
                onValueChange={(value) => setFormData({...formData, booking_id: value})}
              >
                <SelectTrigger id="booking">
                  <SelectValue placeholder="Choose a booking" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {booking.campaign_name || 'No Campaign'}
                        </span>
                        <span className="text-sm text-gray-500">
                          - {booking.creator_username || 'No Creator'}
                        </span>
                        {booking.scheduled_date && (
                          <span className="text-xs text-orange-600">
                            (Has deadline)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Due Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Content Type *</Label>
              <Select 
                value={formData.content_type} 
                onValueChange={(value) => setFormData({...formData, content_type: value})}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">📱 Instagram/Facebook Post</SelectItem>
                  <SelectItem value="story">⏰ Story (24h)</SelectItem>
                  <SelectItem value="reel">🎬 Reel/Short Video</SelectItem>
                  <SelectItem value="video">📹 YouTube Video</SelectItem>
                  <SelectItem value="live">🔴 Live Stream</SelectItem>
                  <SelectItem value="review">⭐ Product Review</SelectItem>
                  <SelectItem value="other">📝 Other Content</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific requirements or notes..."
                className="resize-none h-20"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.booking_id || !formData.scheduled_date || !formData.content_type}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Add Deadline
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
