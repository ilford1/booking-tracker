// Script to add calendar events with proper data
// Run with: node scripts/add-calendar-events.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addCalendarEvents() {
  try {
    console.log('Adding calendar events for December 2025...')
    
    // Get current date info for December 2025
    const today = new Date()
    const currentMonth = 8 // September (0-indexed)
    const currentYear = 2025
    
    // Create dates in September 2025
    const dates = {
      sep6: '2025-09-06',
      sep7: '2025-09-07',
      sep8: '2025-09-08',
      sep10: '2025-09-10',
      sep12: '2025-09-12',
      sep13: '2025-09-13',
      sep15: '2025-09-15',
      sep20: '2025-09-20',
      sep25: '2025-09-25'
    }
    
    // First, let's update existing bookings with better data
    console.log('\n--- Updating existing bookings with campaign/creator names ---\n')
    
    // Get existing bookings
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (existingBookings && existingBookings.length > 0) {
      console.log(`Found ${existingBookings.length} existing bookings to update`)
      
      // Update each booking with sample data
      const sampleData = [
        { campaign_name: 'Fashion Week Campaign', creator_username: '@fashion_influencer_vn' },
        { campaign_name: 'Tech Review Series', creator_username: '@tech_guru_sg' },
        { campaign_name: 'Food Festival Promo', creator_username: '@foodie_hanoi' },
        { campaign_name: 'Fitness Challenge', creator_username: '@gym_master_hcm' },
        { campaign_name: 'Beauty Product Launch', creator_username: '@beauty_blogger_vn' }
      ]
      
      for (let i = 0; i < Math.min(existingBookings.length, sampleData.length); i++) {
        const booking = existingBookings[i]
        const data = sampleData[i]
        
        // Only update if values are null
        if (!booking.campaign_name || !booking.creator_username) {
          const { error } = await supabase
            .from('bookings')
            .update({
              campaign_name: booking.campaign_name || data.campaign_name,
              creator_username: booking.creator_username || data.creator_username,
              amount: booking.amount || (2000000 + Math.floor(Math.random() * 8000000))
            })
            .eq('id', booking.id)
          
          if (error) {
            console.log(`Error updating booking ${booking.id}:`, error.message)
          } else {
            console.log(`✅ Updated booking: ${data.campaign_name} by ${data.creator_username}`)
          }
        }
      }
    }
    
    // Now add some campaigns for September
    console.log('\n--- Adding campaigns for September 2025 ---\n')
    
    const campaigns = [
      {
        name: 'Mid-Autumn Festival Campaign',
        brand: 'VN Traditions Co.',
        slug: 'mid-autumn-festival-2025',
        description: 'Promoting traditional mooncakes and lanterns',
        start_date: dates.sep10,
        end_date: dates.sep20,
        budget: 12000000,
        status: 'active'
      },
      {
        name: 'Back to School Promotion',
        brand: 'EduTech Solutions',
        slug: 'back-to-school-2025',
        description: 'School supplies and educational apps',
        start_date: dates.sep6,
        end_date: dates.sep15,
        budget: 8000000,
        status: 'active'
      },
      {
        name: 'Autumn Fashion Collection',
        brand: 'Style Avenue',
        slug: 'autumn-fashion-2025',
        description: 'New autumn clothing line launch',
        start_date: dates.sep15,
        end_date: dates.sep25,
        budget: 15000000,
        status: 'draft'
      }
    ]
    
    for (const campaign of campaigns) {
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaign)
        .select()
      
      if (error) {
        if (error.message.includes('duplicate')) {
          console.log(`Campaign ${campaign.name} already exists`)
        } else {
          console.log(`Error creating campaign ${campaign.name}:`, error.message)
        }
      } else {
        console.log(`✅ Created campaign: ${campaign.name} starting ${campaign.start_date}`)
      }
    }
    
    console.log('\n--- Summary ---')
    
    // Fetch and display current month's events
    const { data: septemberBookings } = await supabase
      .from('bookings')
      .select('*')
      .or(`scheduled_date.gte.2025-09-01,scheduled_date.lte.2025-09-30`)
      .order('scheduled_date', { ascending: true })
    
    const { data: septemberCampaigns } = await supabase
      .from('campaigns')
      .select('*')
      .gte('start_date', '2025-09-01')
      .lte('start_date', '2025-09-30')
      .order('start_date', { ascending: true })
    
    console.log(`\nSeptember 2025 Events:`)
    console.log(`- ${septemberBookings?.length || 0} bookings with scheduled dates`)
    console.log(`- ${septemberCampaigns?.length || 0} campaigns starting`)
    
    if (septemberBookings && septemberBookings.length > 0) {
      console.log('\nBookings:')
      septemberBookings.forEach(b => {
        if (b.scheduled_date) {
          console.log(`  📅 ${b.scheduled_date}: ${b.campaign_name || 'Unnamed'} by ${b.creator_username || 'Unknown'}`)
        }
      })
    }
    
    if (septemberCampaigns && septemberCampaigns.length > 0) {
      console.log('\nCampaigns:')
      septemberCampaigns.forEach(c => {
        console.log(`  🚀 ${c.start_date}: ${c.name} (${c.brand})`)
      })
    }
    
    console.log('\n✅ Calendar events added! Refresh your calendar page to see them.')
    console.log('Note: Make sure you\'re viewing September 2025 in the calendar.')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

addCalendarEvents()
