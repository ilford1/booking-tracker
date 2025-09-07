// Script to seed test data into Supabase with correct schema
// Run with: node scripts/seed-test-data-fixed.js

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
    console.log('Starting to seed test data with correct schema...')
    
    // Get current date for scheduling
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const threeWeeksFromNow = new Date(today)
    threeWeeksFromNow.setDate(threeWeeksFromNow.getDate() + 21)
    
    // Create test creators first
    const creators = [
      {
        name: 'Fashion Vlog VN',
        handle: 'fashionista_vn',
        platform: 'instagram', // Required legacy field
        platforms: ['instagram', 'tiktok'],
        followers: 125000,
        avg_views: 45000,
        avg_likes: 3200,
        rate_card: {
          post: 2500000,
          story: 800000,
          reel: 3500000
        }
      },
      {
        name: 'Style Guru',
        handle: 'style_guru',
        platform: 'tiktok', // Required legacy field
        platforms: ['tiktok', 'instagram'],
        followers: 89000,
        avg_views: 67000,
        avg_likes: 5100,
        rate_card: {
          video: 4000000,
          live: 1500000
        }
      },
      {
        name: 'Tech Review Vietnam',
        handle: 'techreview_vn',
        platform: 'youtube', // Required legacy field
        platforms: ['youtube', 'facebook'],
        followers: 234000,
        avg_views: 125000,
        avg_likes: 8900,
        rate_card: {
          video: 8000000,
          review: 12000000
        }
      },
      {
        name: 'Foodie Saigon',
        handle: 'foodie_saigon',
        platform: 'instagram', // Required legacy field
        platforms: ['instagram'],
        followers: 67000,
        avg_views: 23000,
        avg_likes: 1800,
        rate_card: {
          post: 1500000,
          story: 500000,
          reel: 2000000
        }
      },
      {
        name: 'Mobile Expert',
        handle: 'mobile_expert',
        platform: 'facebook', // Required legacy field
        platforms: ['facebook', 'youtube'],
        followers: 145000,
        avg_views: 78000,
        avg_likes: 4500,
        rate_card: {
          post: 3500000,
          video: 6000000,
          live: 2000000
        }
      },
      {
        name: 'Hanoi Fashion',
        handle: 'hanoi_fashion',
        platform: 'instagram', // Required legacy field
        platforms: ['instagram'],
        followers: 98000,
        avg_views: 34000,
        avg_likes: 2700,
        rate_card: {
          post: 2800000,
          reel: 4200000
        }
      }
    ]
    
    console.log('Creating creators...')
    const { data: createdCreators, error: creatorError } = await supabase
      .from('creators')
      .insert(creators)
      .select()
    
    if (creatorError) {
      console.error('Error creating creators:', creatorError)
      return
    } else {
      console.log(`Created ${createdCreators.length} creators`)
    }
    
    // Create test campaigns
    const campaigns = [
      {
        name: 'Winter Fashion Campaign 2025',
        brand: 'Fashion Forward VN', // Required field
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
        brand: 'TechFlow Vietnam', // Required field
        description: 'Launch campaign for new smartphone',
        start_date: nextWeek.toISOString().split('T')[0],
        end_date: threeWeeksFromNow.toISOString().split('T')[0],
        budget: 25000000,
        status: 'active',
        target_audience: 'Tech enthusiasts',
        goals: ['Product awareness', 'Pre-orders']
      },
      {
        name: 'Food Delivery Promo',
        brand: 'QuickEats Vietnam', // Required field
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
      return
    } else {
      console.log(`Created ${createdCampaigns.length} campaigns`)
    }
    
    // Create test bookings with proper relationships
    const bookings = [
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Winter Fashion')).id,
        creator_id: createdCreators.find(c => c.handle === 'fashionista_vn').id,
        brief: 'Focus on winter jackets and accessories',
        offer_amount: 3500000,
        agreed_amount: 3500000,
        status: 'confirmed',
        deadline: tomorrow.toISOString().split('T')[0],
        deliverables: ['1 Reel', '3 Stories', '1 Feed Post']
      },
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Winter Fashion')).id,
        creator_id: createdCreators.find(c => c.handle === 'style_guru').id,
        brief: 'Trendy video with outfit transitions',
        offer_amount: 5000000,
        agreed_amount: 5000000,
        status: 'in_process',
        deadline: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliverables: ['2 TikTok videos', '1 Live session']
      },
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Tech Product')).id,
        creator_id: createdCreators.find(c => c.handle === 'techreview_vn').id,
        brief: 'Detailed review with camera tests',
        offer_amount: 8000000,
        status: 'pending',
        deadline: nextWeek.toISOString().split('T')[0],
        deliverables: ['1 Unboxing video', '1 Review video']
      },
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Food Delivery')).id,
        creator_id: createdCreators.find(c => c.handle === 'foodie_saigon').id,
        brief: 'Show ordering process and food quality',
        offer_amount: 2000000,
        agreed_amount: 2000000,
        status: 'confirmed',
        deadline: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliverables: ['5 Stories over weekend']
      },
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Tech Product')).id,
        creator_id: createdCreators.find(c => c.handle === 'mobile_expert').id,
        brief: 'Focus on unique features',
        offer_amount: 4500000,
        agreed_amount: 4500000,
        status: 'confirmed',
        deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliverables: ['2 Facebook posts', '1 Live demo']
      },
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Winter Fashion')).id,
        creator_id: createdCreators.find(c => c.handle === 'hanoi_fashion').id,
        brief: 'Completed - great engagement',
        offer_amount: 6000000,
        agreed_amount: 6000000,
        status: 'completed',
        deadline: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliverables: ['3 Feed posts', '2 Reels']
      },
      // Add a few more bookings with deadlines in different days this month
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Winter Fashion')).id,
        creator_id: createdCreators.find(c => c.handle === 'fashionista_vn').id,
        brief: 'Weekend winter content',
        offer_amount: 2800000,
        agreed_amount: 2800000,
        status: 'approved',
        deadline: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliverables: ['2 Stories', '1 Reel']
      },
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Food Delivery')).id,
        creator_id: createdCreators.find(c => c.handle === 'mobile_expert').id,
        brief: 'App demonstration and ordering',
        offer_amount: 3200000,
        status: 'pending',
        deadline: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliverables: ['1 Demo video', '3 Stories']
      }
    ]
    
    console.log('Creating bookings...')
    const { data: createdBookings, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookings)
      .select()
    
    if (bookingError) {
      console.error('Error creating bookings:', bookingError)
      return
    } else {
      console.log(`Created ${createdBookings.length} bookings`)
      
      // Create payments for some completed/approved bookings
      if (createdBookings && createdBookings.length > 0) {
        const paymentsToCreate = createdBookings
          .filter(booking => ['completed', 'approved'].includes(booking.status))
          .slice(0, 4)
          .map(booking => ({
            booking_id: booking.id,
            amount: (booking.agreed_amount || booking.offer_amount) * 0.5, // 50% advance payment
            status: 'completed',
            payment_method: 'Bank Transfer',
            paid_at: new Date().toISOString(),
            notes: 'Advance payment received'
          }))
        
        if (paymentsToCreate.length > 0) {
          console.log('Creating payments...')
          const { data: createdPayments, error: paymentError } = await supabase
            .from('payments')
            .insert(paymentsToCreate)
            .select()
          
          if (paymentError) {
            console.error('Error creating payments:', paymentError)
          } else {
            console.log(`Created ${createdPayments.length} payments`)
          }
        }
      }
    }
    
    console.log('\n✅ Test data seeded successfully with correct schema!')
    console.log('Data includes:')
    console.log(`- ${createdCreators.length} creators with proper platform arrays`)
    console.log(`- ${createdCampaigns.length} campaigns with start dates`)
    console.log(`- ${createdBookings.length} bookings with deadlines and relationships`)
    console.log('- Multiple bookings with deadlines spread across this month')
    console.log('\nYou should now see dots and events in your calendar!')
    
  } catch (error) {
    console.error('Error seeding data:', error)
  }
}

seedData()
