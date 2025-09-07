// Database Types based on the schema
export type Creator = {
  id: string
  name: string
  handle?: string | null
  platform?: 'instagram' | 'tiktok' | 'facebook' | 'other' | null
  platforms?: string[] | null
  address?: string | null
  phone?: string | null
  bank_account?: Record<string, string> | null
  followers?: number | null
  avg_views?: number | null
  avg_likes?: number | null
  rate_card?: Record<string, number> | null
  tags?: string[] | null
  notes?: string | null
  links?: Record<string, string> | null
  actor: string
  created_at: string
  updated_at: string
}

export type Campaign = {
  id: string
  name: string
  slug?: string | null
  brand?: string | null
  objective?: string | null
  budget?: number | null
  start_date?: string | null
  end_date?: string | null
  default_brief?: string | null
  tags?: string[] | null
  actor: string
  created_at: string
  updated_at: string
}

export type BookingStatus = 
  | 'pending'
  | 'deal'
  | 'delivered'
  | 'content_submitted'
  | 'approved'
  | 'completed'

export type UserProfile = {
  id: string
  user_role: 'customer' | 'service_provider' | 'business_admin' | 'super_admin'
  business_id?: string | null
  provider_id?: string | null
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  avatar_url?: string | null
  preferences?: Record<string, any> | null
  onboarded: boolean
  created_at: string
  updated_at: string
  // Computed fields
  full_name?: string
  email?: string
}

export type Booking = {
  id: string
  campaign_id?: string | null
  creator_id?: string | null
  status: BookingStatus
  offer_amount?: number | null
  agreed_amount?: number | null
  currency: string
  contract_url?: string | null
  brief?: string | null
  contact_channel?: 'instagram' | 'tiktok' | 'email' | 'zalo' | 'phone' | 'other' | null
  utm_code?: string | null
  affiliate_code?: string | null
  tracking_number?: string | null
  scheduled_date?: string | null
  deadline?: string | null
  delivered_at?: string | null
  actor: string // The user who created/owns this booking
  created_at: string
  updated_at: string
  // Relations
  campaign?: Campaign
  creator?: Creator
  created_by?: UserProfile // User who created the booking
}

// Deliverable types removed - simplified to booking-only workflow

export type PaymentStatus = 
  | 'unconfirmed' 
  | 'pending_invoice' 
  | 'waiting_payment' 
  | 'paid' 
  | 'failed'

export type Payment = {
  id: string
  booking_id?: string | null
  status: PaymentStatus
  amount?: number | null
  currency?: string | null
  payment_method?: string | null
  transaction_id?: string | null
  notes?: string | null
  due_date?: string | null
  paid_at?: string | null
  actor: string
  created_at: string
  updated_at: string
  // Relations
  booking?: Booking
}

export type SendoutStatus = 
  | 'requested' 
  | 'packed' 
  | 'shipped' 
  | 'delivered' 
  | 'returned'

export type Sendout = {
  id: string
  booking_id?: string | null
  items?: Record<string, any> | null
  address?: string | null
  recipient?: string | null
  phone?: string | null
  courier?: string | null
  tracking_no?: string | null
  status: SendoutStatus
  ship_date?: string | null
  delivered_date?: string | null
  return_date?: string | null
  notes?: string | null
  actor: string
  created_at: string
  updated_at: string
  // Relations
  booking?: Booking
}

export type Metrics = {
  id: string
  booking_id?: string | null
  views?: number | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  clicks?: number | null
  sales?: number | null
  captured_at: string
  // Relations
  booking?: Booking
}

export type FileScope = 
  | 'creator' 
  | 'booking' 
  | 'deliverable' 
  | 'campaign' 
  | 'payment' 
  | 'sendout' 
  | 'other'

export type File = {
  id: string
  scope: FileScope
  scope_id: string
  path: string
  label?: string | null
  mimetype?: string | null
  size?: number | null
  actor: string
  created_at: string
  updated_at: string
}

// Form types for creating/updating records
export type CreateCreatorData = Omit<Creator, 'id' | 'created_at' | 'updated_at' | 'actor'>
export type UpdateCreatorData = Partial<CreateCreatorData>

export type CreateCampaignData = Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'actor'>
export type UpdateCampaignData = Partial<CreateCampaignData>

export type CreateBookingData = Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'actor' | 'campaign' | 'creator'>
export type UpdateBookingData = Partial<CreateBookingData>

// Deliverable form types removed

export type CreatePaymentData = Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'actor' | 'booking'>
export type UpdatePaymentData = Partial<CreatePaymentData>

export type CreateSendoutData = Omit<Sendout, 'id' | 'created_at' | 'updated_at' | 'actor' | 'booking'>
export type UpdateSendoutData = Partial<CreateSendoutData>
