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
  'prospect',
  'outreaching', 
  'negotiating',
  'booked',
  'content_due',
  'submitted',
  'approved',
  'posted',
  'reported',
  'paid',
  'archived'
] as const

export const DELIVERABLE_TYPES = [
  'post',
  'reel', 
  'story',
  'live',
  'video',
  'tiktok',
  'short',
  'carousel',
  'album',
  'other'
] as const

export const DELIVERABLE_STATUSES = [
  'planned',
  'due',
  'submitted',
  'revision', 
  'approved',
  'scheduled',
  'posted'
] as const

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
  // Booking statuses
  prospect: 'bg-gray-100 text-gray-800',
  outreaching: 'bg-blue-100 text-blue-800',
  negotiating: 'bg-yellow-100 text-yellow-800',
  booked: 'bg-green-100 text-green-800',
  content_due: 'bg-orange-100 text-orange-800',
  submitted: 'bg-purple-100 text-purple-800',
  approved: 'bg-emerald-100 text-emerald-800',
  posted: 'bg-indigo-100 text-indigo-800',
  reported: 'bg-cyan-100 text-cyan-800',
  paid: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
  
  // Deliverable statuses
  planned: 'bg-gray-100 text-gray-800',
  due: 'bg-red-100 text-red-800',
  revision: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-blue-100 text-blue-800',
  
  // Payment statuses
  unconfirmed: 'bg-gray-100 text-gray-800',
  pending_invoice: 'bg-yellow-100 text-yellow-800',
  waiting_payment: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
  
  // Sendout statuses
  requested: 'bg-gray-100 text-gray-800',
  packed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  returned: 'bg-orange-100 text-orange-800'
} as const
