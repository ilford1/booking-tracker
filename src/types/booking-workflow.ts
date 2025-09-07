// Simplified booking workflow types - 6 states only
export type BookingStatus = 
  | 'pending'         // Initial state - booking created, awaiting confirmation
  | 'in_process'      // Booking confirmed and work is in progress
  | 'content_submitted' // Content delivered by creator
  | 'approved'        // Content approved
  | 'completed'       // Fully completed
  | 'canceled'        // Canceled

export type DeliverableStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'approved'
  | 'published'

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_requested'

export interface BookingDeliverable {
  id: string
  booking_id: string
  type: 'post' | 'story' | 'reel' | 'video' | 'blog' | 'other'
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'other'
  description: string
  requirements: string
  deadline: Date
  status: DeliverableStatus
  submission_url?: string
  submitted_at?: Date
  approved_at?: Date
  approved_by?: string
  notes?: string
  revision_count: number
  files?: BookingFile[]
}

export interface BookingFile {
  id: string
  booking_id: string
  deliverable_id?: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_by: string
  uploaded_at: Date
  category: 'contract' | 'brief' | 'content' | 'report' | 'other'
}

export interface BookingComment {
  id: string
  booking_id: string
  user_id: string
  user_name: string
  user_role: string
  comment: string
  created_at: Date
  is_internal: boolean // Internal notes vs client-visible comments
  mentioned_users?: string[]
}

export interface BookingTimeline {
  id: string
  booking_id: string
  event_type: 
    | 'status_change'
    | 'comment_added'
    | 'file_uploaded'
    | 'deliverable_submitted'
    | 'approval_requested'
    | 'revision_requested'
    | 'approved'
    | 'payment_processed'
  event_description: string
  event_data?: any
  created_by: string
  created_at: Date
}

export interface BookingMilestone {
  id: string
  booking_id: string
  title: string
  description: string
  due_date: Date
  completed_at?: Date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  deliverables: string[] // IDs of related deliverables
}

export interface BookingApproval {
  id: string
  booking_id: string
  deliverable_id: string
  requested_by: string
  requested_at: Date
  reviewed_by?: string
  reviewed_at?: Date
  status: ApprovalStatus
  comments?: string
  revision_notes?: string
}

export interface EnhancedBooking {
  // Basic info (existing)
  id: string
  campaign_id: string
  creator_id: string
  status: BookingStatus
  
  // Enhanced workflow fields
  deliverables: BookingDeliverable[]
  milestones: BookingMilestone[]
  files: BookingFile[]
  comments: BookingComment[]
  timeline: BookingTimeline[]
  approvals: BookingApproval[]
  
  // Communication
  last_creator_message?: Date
  last_client_update?: Date
  unread_messages: number
  
  // Progress tracking
  overall_progress: number // 0-100
  content_quality_score?: number // 1-5
  creator_responsiveness?: number // 1-5
  
  // Important dates
  brief_sent_at?: Date
  work_started_at?: Date
  first_submission_at?: Date
  final_approval_at?: Date
  published_at?: Date
}

// Workflow configuration - Simplified to 6 states
export const BOOKING_WORKFLOW_STEPS = [
  {
    status: 'pending' as BookingStatus,
    label: 'Pending',
    description: 'Awaiting confirmation',
    next: ['in_process', 'canceled'] as BookingStatus[],
    color: 'yellow'
  },
  {
    status: 'in_process' as BookingStatus,
    label: 'In Process',
    description: 'Work is in progress',
    next: ['content_submitted', 'canceled'] as BookingStatus[],
    color: 'blue'
  },
  {
    status: 'content_submitted' as BookingStatus,
    label: 'Content Submitted',
    description: 'Content has been submitted for review',
    next: ['approved', 'in_process'] as BookingStatus[],
    color: 'purple'
  },
  {
    status: 'approved' as BookingStatus,
    label: 'Approved',
    description: 'Content has been approved',
    next: ['completed', 'in_process'] as BookingStatus[],
    color: 'green'
  },
  {
    status: 'completed' as BookingStatus,
    label: 'Completed',
    description: 'Booking is fully completed',
    next: [] as BookingStatus[],
    color: 'green'
  },
  {
    status: 'canceled' as BookingStatus,
    label: 'Canceled',
    description: 'Booking has been canceled',
    next: [] as BookingStatus[],
    color: 'red'
  }
]

// Helper functions
export function getNextValidStatuses(currentStatus: BookingStatus): BookingStatus[] {
  const step = BOOKING_WORKFLOW_STEPS.find(s => s.status === currentStatus)
  return step?.next || []
}

export function canTransitionTo(from: BookingStatus, to: BookingStatus): boolean {
  const validNext = getNextValidStatuses(from)
  return validNext.includes(to)
}

export function getStatusColor(status: BookingStatus): string {
  const step = BOOKING_WORKFLOW_STEPS.find(s => s.status === status)
  return step?.color || 'gray'
}

export function getStatusLabel(status: BookingStatus): string {
  const step = BOOKING_WORKFLOW_STEPS.find(s => s.status === status)
  return step?.label || status
}

export function calculateBookingProgress(booking: Partial<EnhancedBooking>): number {
  const weights = {
    pending: 10,
    in_process: 40,
    content_submitted: 70,
    approved: 90,
    completed: 100,
    canceled: 0
  }
  
  return weights[booking.status as BookingStatus] || 0
}
