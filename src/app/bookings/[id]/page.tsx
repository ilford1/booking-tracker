'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { EnhancedFileUpload } from '@/components/enhanced-file-upload'
import { CreatorSubmissions } from '@/components/creator-submissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  BookingStatus,
  getStatusColor,
  getStatusLabel,
  getNextValidStatuses,
  calculateBookingProgress,
  BookingDeliverable,
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
  Star
} from 'lucide-react'

// Mock data for demonstration
const mockBooking = {
  id: '1',
  campaign_id: 'campaign-1',
  campaign_name: 'Summer Collection 2024',
  creator_id: 'creator-1',
  creator_name: 'Sarah Johnson',
  creator_avatar: '',
  creator_handle: '@sarahj',
  status: 'in_process' as BookingStatus,
  overall_progress: 40,
  
  // Dates
  created_at: new Date('2024-01-10'),
  confirmed_at: new Date('2024-01-11'),
  deadline: new Date('2024-01-25'),
  
  // Deliverables
  deliverables: [
    {
      id: 'd1',
      type: 'post',
      platform: 'instagram',
      description: '3 Instagram feed posts',
      requirements: 'High-quality photos featuring summer collection',
      deadline: new Date('2024-01-20'),
      status: 'submitted',
      submission_url: 'https://instagram.com/p/example',
      submitted_at: new Date('2024-01-18'),
      revision_count: 1
    },
    {
      id: 'd2',
      type: 'story',
      platform: 'instagram',
      description: '5 Instagram stories',
      requirements: 'Behind-the-scenes content',
      deadline: new Date('2024-01-22'),
      status: 'in_process',
      revision_count: 0
    },
    {
      id: 'd3',
      type: 'reel',
      platform: 'instagram',
      description: '1 Instagram Reel',
      requirements: 'Trendy transition video showcasing outfits',
      deadline: new Date('2024-01-25'),
      status: 'not_started',
      revision_count: 0
    }
  ],
  
  // Timeline
  timeline: [
    {
      id: 't1',
      event_type: 'status_change',
      event_description: 'Booking created',
      created_by: 'Admin',
      created_at: new Date('2024-01-10T10:00:00')
    },
    {
      id: 't2',
      event_type: 'status_change',
      event_description: 'Booking confirmed by creator',
      created_by: 'Sarah Johnson',
      created_at: new Date('2024-01-11T14:30:00')
    },
    {
      id: 't3',
      event_type: 'deliverable_submitted',
      event_description: 'Instagram posts submitted for review',
      created_by: 'Sarah Johnson',
      created_at: new Date('2024-01-18T16:00:00')
    }
  ],
  
  // Comments
  comments: [
    {
      id: 'c1',
      user_name: 'Admin',
      user_role: 'Manager',
      comment: 'Please ensure all content aligns with our brand guidelines.',
      created_at: new Date('2024-01-11T15:00:00'),
      is_internal: false
    },
    {
      id: 'c2',
      user_name: 'Sarah Johnson',
      user_role: 'Creator',
      comment: 'Understood! I\'ll start working on the content today.',
      created_at: new Date('2024-01-11T16:00:00'),
      is_internal: false
    }
  ],
  
  // Files
  files: [
    {
      id: 'f1',
      file_name: 'brand-guidelines.pdf',
      file_type: 'application/pdf',
      file_size: 2500000,
      uploaded_by: 'Admin',
      uploaded_at: new Date('2024-01-10T11:00:00'),
      category: 'brief'
    },
    {
      id: 'f2',
      file_name: 'content-examples.zip',
      file_type: 'application/zip',
      file_size: 15000000,
      uploaded_by: 'Admin',
      uploaded_at: new Date('2024-01-10T11:30:00'),
      category: 'brief'
    }
  ]
}

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [newComment, setNewComment] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [creatorSubmissions, setCreatorSubmissions] = useState<any[]>([])

  // Fetch booking data on component mount
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { getBooking } = await import('@/lib/actions/bookings')
        const bookingData = await getBooking(params.id as string)
        
        if (bookingData) {
          // Merge with mock extended data for now (until we have full enhanced booking schema)
          const enhancedBooking = {
            ...bookingData,
            creator_name: bookingData.creator?.name || 'Unknown Creator',
            creator_handle: bookingData.creator?.handle || '@unknown',
            creator_avatar: '', // No avatar in current schema
            campaign_name: bookingData.campaign?.name || 'Unknown Campaign',
            overall_progress: calculateBookingProgress({ status: bookingData.status }),
            
            // Use mock data for enhanced features that don't exist in DB yet
            deliverables: mockBooking.deliverables,
            timeline: mockBooking.timeline,
            comments: mockBooking.comments,
            files: mockBooking.files
          }
          setBooking(enhancedBooking)
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

  // Handle creator submission
  const handleCreatorSubmission = (submission: any) => {
    setCreatorSubmissions(prev => [submission, ...prev])
    
    // Add to timeline
    const timelineEntry = {
      id: `t${Date.now()}`,
      event_type: 'deliverable_submitted' as const,
      event_description: `Content submitted via ${submission.source_type.replace('_', ' ')}`,
      created_by: booking.creator_name,
      created_at: new Date()
    }
    
    setBooking((prev: any) => ({
      ...prev,
      timeline: [timelineEntry, ...prev.timeline]
    }))
  }

  // Handle submission review
  const handleSubmissionReview = (submissionId: string, status: string, notes?: string) => {
    setCreatorSubmissions(prev => 
      prev.map(sub => 
        sub.id === submissionId 
          ? { ...sub, status, reviewed_by: 'Current User', reviewed_at: new Date(), staff_notes: notes }
          : sub
      )
    )
  }

  // Handle file download
  const handleFileDownload = (submissionId: string, fileId: string) => {
    // Mark file as downloaded
    setCreatorSubmissions(prev => 
      prev.map(sub => 
        sub.id === submissionId 
          ? {
              ...sub,
              files: sub.files.map((file: any) => 
                file.id === fileId 
                  ? { ...file, downloaded: true, download_date: new Date() }
                  : file
              )
            }
          : sub
      )
    )
  }

  // Handle deliverable actions
  const handleDeliverableApprove = (deliverableId: string) => {
    setBooking((prev: any) => ({
      ...prev,
      deliverables: prev.deliverables.map((d: any) => 
        d.id === deliverableId 
          ? { ...d, status: 'approved', approved_at: new Date(), approved_by: 'Current User' }
          : d
      )
    }))
    toast.success('Deliverable approved')
  }

  const handleDeliverableRevision = (deliverableId: string) => {
    const reason = prompt('Please provide revision notes:')
    if (reason === null) return // User cancelled
    
    setBooking((prev: any) => ({
      ...prev,
      deliverables: prev.deliverables.map((d: any) => 
        d.id === deliverableId 
          ? { 
              ...d, 
              status: 'revision_requested', 
              revision_count: d.revision_count + 1,
              notes: reason 
            }
          : d
      )
    }))
    toast.success('Revision requested')
  }

  const handleDeliverableStart = (deliverableId: string) => {
    setBooking((prev: any) => ({
      ...prev,
      deliverables: prev.deliverables.map((d: any) => 
        d.id === deliverableId 
          ? { ...d, status: 'in_progress' }
          : d
      )
    }))
    toast.success('Deliverable started')
  }

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

  // Handle booking edit
  const handleBookingEdit = () => {
    toast.info('Booking edit functionality would be implemented here')
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBookingEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
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
            <TabsTrigger value="deliverables">
              Deliverables 
              <Badge variant="secondary" className="ml-2">
                {booking.deliverables.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="files">
              Files
              <Badge variant="secondary" className="ml-2">
                {booking.files.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="submissions">
              Creator Submissions
              <Badge variant="secondary" className="ml-2">
                {creatorSubmissions.length}
              </Badge>
            </TabsTrigger>
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
                        {booking.created_at.toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Deadline</p>
                      <p className="font-medium">
                        {booking.deadline.toLocaleDateString()}
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
                    <p className="text-sm text-gray-500">Deliverables</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress 
                        value={
                          (booking.deliverables.filter((d: any) => 
                            d.status === 'approved' || d.status === 'published'
                          ).length / booking.deliverables.length) * 100
                        } 
                        className="h-2 flex-1" 
                      />
                      <span className="text-sm font-medium">
                        {booking.deliverables.filter((d: any) => 
                          d.status === 'approved' || d.status === 'published'
                        ).length}/{booking.deliverables.length}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Days Remaining</p>
                    <p className="text-2xl font-bold">
                      {Math.ceil((booking.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Revisions</p>
                    <p className="text-2xl font-bold">
                      {booking.deliverables.reduce((sum: number, d: any) => sum + d.revision_count, 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables">
            <div className="space-y-4">
              {booking.deliverables.map((deliverable: any) => (
                <Card key={deliverable.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{deliverable.description}</h3>
                          <Badge variant={
                            deliverable.status === 'approved' ? 'default' :
                            deliverable.status === 'submitted' ? 'secondary' :
                            deliverable.status === 'in_process' ? 'outline' :
                            'secondary'
                          }>
                            {deliverable.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {deliverable.requirements}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {deliverable.deadline.toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-4 w-4" />
                            {deliverable.revision_count} revisions
                          </span>
                          {deliverable.submission_url && (
                            <a 
                              href={deliverable.submission_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                            >
                              <Link className="h-4 w-4" />
                              View submission
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {deliverable.status === 'submitted' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeliverableRevision(deliverable.id)}
                            >
                              Request Revision
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleDeliverableApprove(deliverable.id)}
                            >
                              Approve
                            </Button>
                          </>
                        )}
                        {deliverable.status === 'not_started' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeliverableStart(deliverable.id)}
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

          {/* Files Tab */}
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Files & Attachments</CardTitle>
                  <Button 
                    size="sm"
                    onClick={handleFileUpload}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.files.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium">{file.file_name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.file_size / 1000000).toFixed(1)} MB • Uploaded by {file.uploaded_by}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleBookingFileDownload(file.id, file.file_name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Creator Submissions Tab */}
          <TabsContent value="submissions">
            <div className="space-y-6">
              {/* Add New Submission */}
              <EnhancedFileUpload
                bookingId={booking.id}
                creatorName={booking.creator_name}
                deliverables={booking.deliverables}
                onSubmissionAdded={handleCreatorSubmission}
              />
              
              {/* Existing Submissions */}
              <CreatorSubmissions
                submissions={creatorSubmissions}
                creatorName={booking.creator_name}
                creatorAvatar={booking.creator_avatar}
                onSubmissionReview={handleSubmissionReview}
                onFileDownload={handleFileDownload}
              />
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
