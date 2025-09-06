// Script to seed test data into Supabase
// Run with: node scripts/seed-test-data.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedData() {
  try {
    console.log('Starting to seed test data...')
    
    // Get current date for scheduling
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    // Create test campaigns
    const campaigns = [
      {
        name: 'Winter Fashion Campaign 2025',
        description: 'Promoting winter collection across social media',
        start_date: today.toISOString().split('T')[0],
        end_date: nextMonth.toISOString().split('T')[0],
        budget: 15000000,
        status: 'active',
        target_audience: 'Fashion enthusiasts 18-35',
        goals: ['Brand awareness', 'Sales conversion', 'Social engagement']
      },
      {
        name: 'Tech Product Launch',
        description: 'Launch campaign for new smartphone',
        start_date: nextWeek.toISOString().split('T')[0],
        end_date: nextMonth.toISOString().split('T')[0],
        budget: 25000000,
        status: 'active',
        target_audience: 'Tech enthusiasts',
        goals: ['Product awareness', 'Pre-orders']
      },
      {
        name: 'Food Delivery Promo',
        description: 'Weekend promotion for food delivery app',
        start_date: tomorrow.toISOString().split('T')[0],
        end_date: nextWeek.toISOString().split('T')[0],
        budget: 8000000,
        status: 'active',
        target_audience: 'Urban millennials',
        goals: ['App downloads', 'First orders']
      }
    ]
    
    console.log('Creating campaigns...')
    const { data: createdCampaigns, error: campaignError } = await supabase
      .from('campaigns')
      .insert(campaigns)
      .select()
    
    if (campaignError) {
      console.error('Error creating campaigns:', campaignError)
    } else {
      console.log(`Created ${createdCampaigns.length} campaigns`)
    }
    
    // Create test bookings with various scheduled dates
    const bookings = [
      {
        campaign_name: 'Winter Fashion Campaign 2025',
        creator_username: '@fashionista_vn',
        creator_platform: 'instagram',
        content_type: 'reel',
        deliverables: ['1 Reel', '3 Stories', '1 Feed Post'],
        amount: 3500000,
        status: 'confirmed',
        scheduled_date: tomorrow.toISOString().split('T')[0],
        notes: 'Focus on winter jackets and accessories'
      },
      {
        campaign_name: 'Winter Fashion Campaign 2025',
        creator_username: '@style_guru',
        creator_platform: 'tiktok',
        content_type: 'video',
        deliverables: ['2 TikTok videos', '1 Live session'],
        amount: 5000000,
        status: 'in_progress',
        scheduled_date: today.toISOString().split('T')[0],
        notes: 'Trendy video with outfit transitions'
      },
      {
        campaign_name: 'Tech Product Launch',
        creator_username: '@techreview_vn',
        creator_platform: 'youtube',
        content_type: 'video',
        deliverables: ['1 Unboxing video', '1 Review video'],
        amount: 8000000,
        status: 'pending',
        scheduled_date: nextWeek.toISOString().split('T')[0],
        notes: 'Detailed review with camera tests'
      },
      {
        campaign_name: 'Food Delivery Promo',
        creator_username: '@foodie_saigon',
        creator_platform: 'instagram',
        content_type: 'story',
        deliverables: ['5 Stories over weekend'],
        amount: 2000000,
        status: 'confirmed',
        scheduled_date: tomorrow.toISOString().split('T')[0],
        notes: 'Show ordering process and food quality'
      },
      {
        campaign_name: 'Tech Product Launch',
        creator_username: '@mobile_expert',
        creator_platform: 'facebook',
        content_type: 'post',
        deliverables: ['2 Facebook posts', '1 Live demo'],
        amount: 4500000,
        status: 'confirmed',
        scheduled_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Focus on unique features'
      },
      {
        campaign_name: 'Winter Fashion Campaign 2025',
        creator_username: '@hanoi_fashion',
        creator_platform: 'instagram',
        content_type: 'post',
        deliverables: ['3 Feed posts', '2 Reels'],
        amount: 6000000,
        status: 'delivered',
        scheduled_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Completed - great engagement'
      }
    ]
    
    console.log('Creating bookings...')
    const { data: createdBookings, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookings)
      .select()
    
    if (bookingError) {
      console.error('Error creating bookings:', bookingError)
    } else {
      console.log(`Created ${createdBookings.length} bookings`)
      
      // Create payments for some bookings
      if (createdBookings && createdBookings.length > 0) {
        const payments = createdBookings.slice(0, 3).map(booking => ({
          booking_id: booking.id,
          amount: booking.amount * 0.5, // 50% advance payment
          status: 'completed',
          payment_method: 'Bank Transfer',
          paid_at: new Date().toISOString(),
          notes: 'Advance payment received'
        }))
        
        console.log('Creating payments...')
        const { data: createdPayments, error: paymentError } = await supabase
          .from('payments')
          .insert(payments)
          .select()
        
        if (paymentError) {
          console.error('Error creating payments:', paymentError)
        } else {
          console.log(`Created ${createdPayments.length} payments`)
        }
      }
    }
    
    console.log('\n✅ Test data seeded successfully!')
    console.log('You can now view the data in your calendar and dashboard.')
    
  } catch (error) {
    console.error('Error seeding data:', error)
  }
}

seedData()
