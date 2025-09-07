export * from './database'

// App-specific types
export interface DashboardKPIs {
  activeCampaigns: number
  bookedPostsThisWeek: number
  budgetUsed: number
  totalBudget: number
  pendingDeliverables: number
  overdueTasks: number
}

export interface FunnelData {
  status: string
  count: number
  percentage: number
}

export interface PerformanceMetrics {
  totalSpend: number
  totalViews: number
  totalClicks: number
  cpv: number
  cpc: number
  conversionRate: number
}

// Constants for the app
export const BOOKING_STATUSES = [
  'pending',
  'deal',
  'delivered',
  'content_submitted',
  'approved',
  'completed'
] as const

// Deliverable constants removed - simplified to booking-only workflow

export const PAYMENT_STATUSES = [
  'unconfirmed',
  'pending_invoice',
  'waiting_payment',
  'paid',
  'failed'
] as const

export const SENDOUT_STATUSES = [
  'requested',
  'packed',
  'shipped',
  'delivered', 
  'returned'
] as const

export const PLATFORMS = [
  'instagram',
  'tiktok',
  'youtube',
  'facebook',
  'other'
] as const

export const CONTACT_CHANNELS = [
  'instagram',
  'tiktok',
  'email',
  'zalo',
  'phone',
  'other'
] as const

export const PAYMENT_METHODS = [
  'bank',
  'cash',
  'transfer',
  'other'
] as const

export const FILE_SCOPES = [
  'creator',
  'booking',
  'deliverable',
  'campaign',
  'payment',
  'sendout',
  'other'
] as const

// Status colors for UI
export const STATUS_COLORS = {
  // Booking statuses (simplified)
  pending: 'bg-yellow-100 text-yellow-800',
  deal: 'bg-blue-100 text-blue-800',
  delivered: 'bg-orange-100 text-orange-800',
  content_submitted: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  completed: 'bg-emerald-100 text-emerald-800',
  
  // Payment statuses
  unconfirmed: 'bg-gray-100 text-gray-800',
  pending_invoice: 'bg-yellow-100 text-yellow-800',
  waiting_payment: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
  
  // Note: Sendout status colors removed to avoid conflicts
} as const
