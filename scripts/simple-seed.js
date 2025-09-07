// Simple seed script that works with the actual database schema
// Run with: node scripts/simple-seed.js

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
    console.log('Creating simple test data...')
    
    // Get current date for scheduling
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    // Create simple campaigns first using only the required fields from the original schema
    console.log('Creating campaigns...')
    const { data: createdCampaigns, error: campaignError } = await supabase
      .from('campaigns')
      .insert([
        {
          name: 'Winter Fashion Campaign 2025',
          slug: 'winter-fashion-2025',
          brand: 'Fashion Forward VN',
          description: 'Promoting winter collection across social media',
          start_date: today.toISOString().split('T')[0],
          end_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          budget: 15000000,
          status: 'active'
        },
        {
          name: 'Tech Product Launch',
          slug: 'tech-product-launch',
          brand: 'TechFlow Vietnam',
          description: 'Launch campaign for new smartphone',
          start_date: nextWeek.toISOString().split('T')[0],
          end_date: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          budget: 25000000,
          status: 'active'
        }
      ])
      .select()
    
    if (campaignError) {
      console.error('Error creating campaigns:', campaignError)
      return
    } else {
      console.log(`Created ${createdCampaigns.length} campaigns`)
    }

    // Create simple creators using only required fields
    console.log('Creating creators...')
    const { data: createdCreators, error: creatorError } = await supabase
      .from('creators')
      .insert([
        {
          name: 'Fashion Vlog VN',
          handle: 'fashionista_vn',
          platform: 'instagram'
        },
        {
          name: 'Tech Review Vietnam', 
          handle: 'techreview_vn',
          platform: 'youtube'
        },
        {
          name: 'Style Guru',
          handle: 'style_guru',
          platform: 'tiktok'
        }
      ])
      .select()
    
    if (creatorError) {
      console.error('Error creating creators:', creatorError)
      return
    } else {
      console.log(`Created ${createdCreators.length} creators`)
    }
    
    // Create bookings with proper relationships and deadlines
    console.log('Creating bookings with deadlines...')
    const bookings = [
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Winter Fashion')).id,
        creator_id: createdCreators.find(c => c.handle === 'fashionista_vn').id,
        notes: 'Focus on winter jackets and accessories',
        offer_amount: 3500000,
        agreed_amount: 3500000,
        status: 'pending',
        deadline: tomorrow.toISOString().split('T')[0]
      },
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Winter Fashion')).id,
        creator_id: createdCreators.find(c => c.handle === 'style_guru').id,
        notes: 'Trendy video with outfit transitions',
        offer_amount: 5000000,
        agreed_amount: 5000000,
        status: 'pending',
        deadline: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Tech Product')).id,
        creator_id: createdCreators.find(c => c.handle === 'techreview_vn').id,
        notes: 'Detailed review with camera tests',
        offer_amount: 8000000,
        status: 'pending',
        deadline: nextWeek.toISOString().split('T')[0]
      },
      // Add more bookings with deadlines throughout the month
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Winter Fashion')).id,
        creator_id: createdCreators.find(c => c.handle === 'fashionista_vn').id,
        notes: 'Weekend winter content',
        offer_amount: 2800000,
        agreed_amount: 2800000,
        status: 'pending',
        deadline: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Tech Product')).id,
        creator_id: createdCreators.find(c => c.handle === 'style_guru').id,
        notes: 'App demonstration and ordering',
        offer_amount: 3200000,
        status: 'pending',
        deadline: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        campaign_id: createdCampaigns.find(c => c.name.includes('Winter Fashion')).id,
        creator_id: createdCreators.find(c => c.handle === 'techreview_vn').id,
        notes: 'Holiday season content',
        offer_amount: 4200000,
        status: 'pending',
        deadline: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]
    
    const { data: createdBookings, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookings)
      .select()
    
    if (bookingError) {
      console.error('Error creating bookings:', bookingError)
      return
    } else {
      console.log(`Created ${createdBookings.length} bookings with deadlines`)
      
      // Show the deadlines that were created
      console.log('\\nBookings created with these deadlines:')
      createdBookings.forEach((booking, i) => {
        const deadline = new Date(booking.deadline)
        console.log(`  ${i+1}. ${booking.notes?.substring(0, 30)}... - Deadline: ${deadline.toDateString()}`)
      })
    }
    
    console.log('\\n✅ Simple test data seeded successfully!')
    console.log('\\nYour calendar should now show:')
    console.log(`- ${createdCampaigns.length} campaigns with start dates`)
    console.log(`- ${createdBookings.length} bookings with deadlines throughout this month`)
    console.log('- Blue dots for booking creation dates')
    console.log('- Red dots for booking deadlines')
    console.log('- Green dots for campaign start dates')
    
  } catch (error) {
    console.error('Error seeding simple data:', error)
  }
}

seedData()
