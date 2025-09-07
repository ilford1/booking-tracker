'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  BookingStatus,
  getStatusColor,
  getStatusLabel,
  getNextValidStatuses,
  calculateBookingProgress,
  BookingComment,
  BookingFile,
  BookingTimeline
} from '@/types/booking-workflow'
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Download,
  Upload,
  Edit,
  MoreVertical,
  ArrowRight,
  PlayCircle,
  PauseCircle,
  XCircle,
  RefreshCw,
  Send,
  Eye,
  FileText,
  Image,
  Video,
  Link,
  Star,
  Printer,
  Share2,
  Archive,
  Trash2,
  Plus
} from 'lucide-react'

// Note: Mock data removed - now loading real data from database

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [newComment, setNewComment] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')

  // Fetch booking data on component mount
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { getBooking } = await import('@/lib/actions/bookings')
        
        const bookingData = await getBooking(params.id as string)
        
        if (bookingData) {
          // Merge with extended data (simplified - no deliverables)
          const enhancedBooking = {
            ...bookingData,
            creator_name: bookingData.creator?.name || 'Unknown Creator',
            creator_handle: bookingData.creator?.handle || '@unknown',
            creator_avatar: '', // No avatar in current schema
            campaign_name: bookingData.campaign?.name || 'Unknown Campaign',
            overall_progress: calculateBookingProgress({ status: bookingData.status }),
            
            // Empty arrays for features not yet in database
            timeline: [],
            comments: [],
            files: []
          }
          setBooking(enhancedBooking)
          
          // Set tracking number if it exists
          if (bookingData.tracking_number) {
            setTrackingNumber(bookingData.tracking_number)
          }
        } else {
          toast.error('Booking not found')
          router.push('/bookings')
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error)
        toast.error('Failed to load booking data')
        router.push('/bookings')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchBooking()
    }
  }, [params.id, router])

  // Status change handler - now with database persistence
  const handleStatusChange = async (newStatus: BookingStatus) => {
    const validStatuses = getNextValidStatuses(booking.status)
    if (!validStatuses.includes(newStatus)) {
      toast.error('Invalid status transition')
      return
    }

    try {
      // Import the updateBookingStatus function
      const { updateBookingStatus } = await import('@/lib/actions/bookings')
      
      // Update in database
      await updateBookingStatus(booking.id, newStatus)
      
      // Update local state for immediate UI feedback
      setBooking((prev: any) => ({
        ...prev,
        status: newStatus,
        overall_progress: calculateBookingProgress({ status: newStatus })
      }))

      // Add to timeline (local state only for now)
      const newTimelineEntry = {
        id: `t${Date.now()}`,
        event_type: 'status_change' as const,
        event_description: `Status changed to ${getStatusLabel(newStatus)}`,
        created_by: 'Current User',
        created_at: new Date()
      }

      setBooking((prev: any) => ({
        ...prev,
        timeline: [...prev.timeline, newTimelineEntry]
      }))

      toast.success(`Status updated to ${getStatusLabel(newStatus)}`)
    } catch (error) {
      console.error('Failed to update booking status:', error)
      toast.error('Failed to update booking status')
    }
  }

  // Add comment handler
  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment = {
      id: `c${Date.now()}`,
      user_name: 'Current User',
      user_role: 'Manager',
      comment: newComment,
      created_at: new Date(),
      is_internal: isInternalNote
    }

    setBooking((prev: any) => ({
      ...prev,
      comments: [...prev.comments, comment]
    }))

    setNewComment('')
    toast.success('Comment added')
  }

  // Handle tracking number update
  const handleUpdateTrackingNumber = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number')
      return
    }

    try {
      const { updateBookingTrackingNumber } = await import('@/lib/actions/calendar')
      await updateBookingTrackingNumber(booking.id, trackingNumber)
      
      // Update local state
      setBooking((prev: any) => ({
        ...prev,
        tracking_number: trackingNumber,
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        overall_progress: calculateBookingProgress({ status: 'delivered' })
      }))
      
      toast.success('Tracking number updated and status set to delivered')
    } catch (error) {
      console.error('Failed to update tracking number:', error)
      toast.error('Failed to update tracking number')
    }
  }

  // Handle delivery confirmation (delivered -> content_submitted)
  const handleDeliveredConfirmation = async () => {
    try {
      const { updateBookingStatus } = await import('@/lib/actions/bookings')
      await updateBookingStatus(booking.id, 'content_submitted')
      
      setBooking((prev: any) => ({
        ...prev,
        status: 'content_submitted',
        overall_progress: calculateBookingProgress({ status: 'content_submitted' })
      }))
      
      toast.success('Package confirmed received, awaiting content submission')
    } catch (error) {
      console.error('Failed to confirm delivery:', error)
      toast.error('Failed to confirm delivery')
    }
  }

  // Handle confirm deal (pending -> deal)
  const handleConfirmDeal = async () => {
    try {
      const { updateBookingStatus } = await import('@/lib/actions/bookings')
      await updateBookingStatus(booking.id, 'deal')
      
      setBooking((prev: any) => ({
        ...prev,
        status: 'deal',
        overall_progress: calculateBookingProgress({ status: 'deal' })
      }))
      
      toast.success('Deal confirmed! Ready to prepare delivery')
    } catch (error) {
      console.error('Failed to confirm deal:', error)
      toast.error('Failed to confirm deal')
    }
  }

  // Deliverable handlers removed - simplified to booking-only workflow

  // Handle booking file download
  const handleBookingFileDownload = (fileId: string, fileName: string) => {
    // In a real app, this would trigger an actual download
    toast.success(`Downloading ${fileName}`)
  }

  // Handle file upload
  const handleFileUpload = () => {
    // In a real app, this would open a file picker
    toast.info('File upload functionality would be implemented here')
  }


  // Handle export booking details
  const handleExport = () => {
    try {
      // Create a JSON export of the booking data
      const exportData = {
        booking: booking,
        exported_at: new Date().toISOString(),
        version: '1.0'
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `booking-${booking.id}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Booking details exported')
    } catch (error) {
      toast.error('Failed to export booking details')
    }
  }

  // Handle print
  const handlePrint = () => {
    window.print()
    toast.success('Print dialog opened')
  }

  // Handle share link
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/bookings/${booking.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Booking: ${booking.campaign_name}`,
          text: `Check out this booking for ${booking.creator_name}`,
          url: shareUrl
        })
        toast.success('Link shared successfully')
      } catch (error) {
        // User cancelled share, do nothing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard')
    }
  }

  // Handle archive booking
  const handleArchive = async () => {
    try {
      if (confirm('Are you sure you want to archive this booking?')) {
        toast.loading('Archiving booking...')
        // TODO: Implement booking archiving
        toast.info('Archive functionality would be implemented here')
        // router.push('/bookings')
      }
    } catch (error) {
      toast.error('Failed to archive booking')
    }
  }

  // Handle delete booking
  const handleDelete = async () => {
    try {
      if (confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
        const loadingToast = toast.loading('Deleting booking...')
        
        const { deleteBooking } = await import('@/lib/actions/bookings')
        const result = await deleteBooking(booking.id)
        
        console.log('✅ Booking deleted successfully:', result)
        toast.dismiss(loadingToast)
        toast.success('Booking deleted successfully')
        
        // Navigate back to bookings page
        router.push('/bookings')
        
        // Force a page refresh after navigation to ensure clean state
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    } catch (error) {
      console.error('❌ Error deleting booking:', error)
      toast.error(`Failed to delete booking: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get status badge color
  const getStatusBadgeVariant = (status: BookingStatus): "default" | "secondary" | "destructive" | "outline" => {
    const colorMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      gray: 'secondary',
      yellow: 'outline',
      blue: 'default',
      indigo: 'default',
      purple: 'default',
      orange: 'outline',
      red: 'destructive',
      green: 'default'
    }
    const color = getStatusColor(status)
    return colorMap[color] || 'secondary'
  }

  // Show loading state
  if (loading) {
    return (
      <AppShell>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading booking details...</p>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  // Show error state if no booking
  if (!booking) {
    return (
      <AppShell>
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Booking not found</h3>
            <p className="text-gray-500 mb-4">The booking you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/bookings')}>Back to Bookings</Button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <button 
                  onClick={() => router.push('/bookings')}
                  className="hover:text-gray-700"
                >
                  Bookings
                </button>
                <span>/</span>
                <span>Booking #{booking.id}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {booking.campaign_name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={booking.creator_avatar} />
                    <AvatarFallback>{booking.creator_name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">
                    {booking.creator_name} ({booking.creator_handle})
                  </span>
                </div>
                <Badge variant={getStatusBadgeVariant(booking.status as BookingStatus)}>
                  {getStatusLabel(booking.status)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => toast.info('Edit functionality would be implemented here')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Booking
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Details
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Summary
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Link
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Booking
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Booking
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-500">{booking.overall_progress}%</span>
            </div>
            <Progress value={booking.overall_progress} className="h-2" />
            
            {/* Status Workflow */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">Change Status:</span>
              {getNextValidStatuses(booking.status).map(status => (
                <Button
                  key={status}
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(status)}
                  className="text-xs"
                >
                  {getStatusLabel(status)}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tracking">
              Delivery & Tracking
            </TabsTrigger>
            <TabsTrigger value="submissions">
              Creator Submissions
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="comments">
              Comments
              <Badge variant="secondary" className="ml-2">
                {booking.comments.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Key Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Booking Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  <div>
                    <p className="text-sm text-gray-500">Deadline</p>
                    <p className="font-medium">
                      {booking.deadline ? new Date(booking.deadline).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                    <div>
                      <p className="text-sm text-gray-500">Campaign</p>
                      <p className="font-medium">{booking.campaign_name}</p>
                    </div>
                  <div>
                    <p className="text-sm text-gray-500">Creator</p>
                    <p className="font-medium">{booking.creator_name}</p>
                  </div>
                  {booking.status === 'delivered' && booking.tracking_number && (
                    <div>
                      <p className="text-sm text-gray-500">Tracking Number</p>
                      <p className="font-medium">{booking.tracking_number}</p>
                    </div>
                  )}
                  {booking.delivered_at && (
                    <div>
                      <p className="text-sm text-gray-500">Delivered At</p>
                      <p className="font-medium">
                        {new Date(booking.delivered_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusBadgeVariant(booking.status as BookingStatus)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Days Remaining</p>
                    <p className="text-2xl font-bold">
                      {booking.deadline ? Math.ceil((new Date(booking.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="text-2xl font-bold">
                      {booking.agreed_amount ? 
                        `${booking.agreed_amount.toLocaleString()} ${booking.currency}` : 
                        booking.offer_amount ? 
                        `${booking.offer_amount.toLocaleString()} ${booking.currency}` : 
                        'Not set'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking">
            <div className="space-y-6">
              {/* Delivery Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery & Tracking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.status === 'pending' ? (
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Deal</h3>
                        <p className="text-gray-500 mb-6">Confirm booking details and proceed to delivery preparation</p>
                      </div>
                      
                      <div className="flex justify-center">
                        <Button onClick={handleConfirmDeal}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Deal
                        </Button>
                      </div>
                    </div>
                  ) : booking.status === 'deal' ? (
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Send className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Prepare Delivery</h3>
                        <p className="text-gray-500 mb-6">Add tracking number when goods are shipped to creator</p>
                      </div>
                      
                      <div className="max-w-md mx-auto space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tracking Number
                          </label>
                          <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Enter tracking number"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <Button 
                          onClick={handleUpdateTrackingNumber}
                          disabled={!trackingNumber.trim()}
                          className="w-full"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Mark as Delivered
                        </Button>
                      </div>
                    </div>
                  ) : booking.status === 'delivered' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-orange-800">Package Delivered</p>
                          <p className="text-sm text-orange-600">Awaiting creator confirmation</p>
                        </div>
                      </div>
                      
                      {booking.tracking_number && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Tracking Number</p>
                          <p className="text-lg font-mono bg-gray-50 p-2 rounded border">{booking.tracking_number}</p>
                        </div>
                      )}
                      
                      {booking.delivered_at && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Delivered At</p>
                          <p className="text-gray-900">{new Date(booking.delivered_at).toLocaleString()}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button onClick={handleDeliveredConfirmation}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Received
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery Complete</h3>
                      <p className="text-gray-500">
                        {booking.status === 'content_submitted' && 'Package delivered, awaiting content submission'}
                        {booking.status === 'approved' && 'Content approved, ready for completion'}
                        {booking.status === 'completed' && 'Booking completed successfully'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {booking.timeline.map((event: any, index: number) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {event.event_type === 'status_change' && <ArrowRight className="h-4 w-4" />}
                          {event.event_type === 'deliverable_submitted' && <Upload className="h-4 w-4" />}
                          {event.event_type === 'comment_added' && <MessageSquare className="h-4 w-4" />}
                        </div>
                        {index < booking.timeline.length - 1 && (
                          <div className="w-0.5 h-16 bg-gray-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="font-medium">{event.event_description}</p>
                        <p className="text-sm text-gray-500">
                          by {event.created_by} • {event.created_at.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Creator Submissions Tab */}
          <TabsContent value="submissions">
            <div className="space-y-6">
              {/* Submission Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {booking.status === 'content_submitted' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-purple-800">Content Submitted</p>
                          <p className="text-sm text-purple-600">Awaiting review and approval</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => toast.info('Request revision functionality')}>Request Revision</Button>
                        <Button onClick={() => {
                          handleStatusChange('approved')
                          toast.success('Content approved!')
                        }}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Content
                        </Button>
                      </div>
                    </div>
                  ) : booking.status === 'approved' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-green-800">Content Approved</p>
                          <p className="text-sm text-green-600">Ready for completion</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={() => {
                          handleStatusChange('completed')
                          toast.success('Booking completed!')
                        }}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Completed
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Awaiting Content Submission</h3>
                      <p className="text-gray-500">
                        {booking.status === 'pending' && 'Confirm deal first before content submission'}
                        {booking.status === 'deal' && 'Deliver goods first before content submission'}
                        {booking.status === 'delivered' && 'Creator will submit content once they receive the goods'}
                        {booking.status === 'completed' && 'Booking has been completed'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Comments & Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {booking.comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{comment.user_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.user_name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {comment.user_role}
                          </Badge>
                          {comment.is_internal && (
                            <Badge variant="outline" className="text-xs">
                              Internal
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {comment.created_at.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-6" />
                
                {/* Add Comment */}
                <div className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                      />
                      <span className="text-sm">Internal note</span>
                    </label>
                    <Button onClick={handleAddComment}>
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
