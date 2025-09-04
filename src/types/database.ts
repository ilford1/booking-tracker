// Database Types based on the schema
export type Creator = {
  id: string
  name: string
  handle?: string | null
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'other' | null
  email?: string | null
  phone?: string | null
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
  | 'prospect' 
  | 'outreaching' 
  | 'negotiating' 
  | 'booked' 
  | 'content_due' 
  | 'submitted' 
  | 'approved' 
  | 'posted' 
  | 'reported' 
  | 'paid' 
  | 'archived'

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
  actor: string
  created_at: string
  updated_at: string
  // Relations
  campaign?: Campaign
  creator?: Creator
}

export type DeliverableType = 
  | 'post' 
  | 'reel' 
  | 'story' 
  | 'live' 
  | 'video' 
  | 'tiktok' 
  | 'short' 
  | 'carousel' 
  | 'album' 
  | 'other'

export type DeliverableStatus = 
  | 'planned' 
  | 'due' 
  | 'submitted' 
  | 'revision' 
  | 'approved' 
  | 'scheduled' 
  | 'posted'

export type Deliverable = {
  id: string
  booking_id?: string | null
  type: DeliverableType
  title?: string | null
  caption?: string | null
  due_date?: string | null
  publish_date?: string | null
  status: DeliverableStatus
  link?: string | null
  draft_url?: string | null
  notes?: string | null
  actor: string
  created_at: string
  updated_at: string
  // Relations
  booking?: Booking
}

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
  deliverable_id?: string | null
  views?: number | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  clicks?: number | null
  sales?: number | null
  captured_at: string
  // Relations
  deliverable?: Deliverable
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

export type CreateDeliverableData = Omit<Deliverable, 'id' | 'created_at' | 'updated_at' | 'actor' | 'booking'>
export type UpdateDeliverableData = Partial<CreateDeliverableData>

export type CreatePaymentData = Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'actor' | 'booking'>
export type UpdatePaymentData = Partial<CreatePaymentData>

export type CreateSendoutData = Omit<Sendout, 'id' | 'created_at' | 'updated_at' | 'actor' | 'booking'>
export type UpdateSendoutData = Partial<CreateSendoutData>
