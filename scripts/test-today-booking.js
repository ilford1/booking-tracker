// Test script to create a booking today with deadline on 18th
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTodayBooking() {
  try {
    console.log('Creating test booking for today with deadline on 18th...')
    
    const today = new Date()
    const deadline18th = new Date(today.getFullYear(), today.getMonth(), 18)
    
    console.log(`Today: ${today.toDateString()}`)
    console.log(`Deadline: ${deadline18th.toDateString()}`)
    
    // Get existing campaign and creator
    const { data: campaigns } = await supabase.from('campaigns').select('*').limit(1)
    const { data: creators } = await supabase.from('creators').select('*').limit(1)
    
    if (!campaigns || campaigns.length === 0 || !creators || creators.length === 0) {
      console.error('No campaigns or creators found. Run the simple seed script first.')
      return
    }
    
    // Create booking with today's date and deadline on 18th
    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        campaign_id: campaigns[0].id,
        creator_id: creators[0].id,
        notes: 'Test booking created TODAY with deadline on 18th',
        offer_amount: 2500000,
        agreed_amount: 2500000,
        status: 'pending',
        deadline: deadline18th.toISOString().split('T')[0]
      })
      .select()
    
    if (bookingError) {
      console.error('Error creating booking:', bookingError)
    } else {
      console.log('✅ Created booking successfully!')
      console.log('📅 Calendar should now show:')
      console.log(`  🔵 BLUE DOT on day ${today.getDate()} (booking created today)`)
      console.log(`  🔴 RED DOT on day 18 (deadline)`)
      console.log('\n🔄 Click the refresh button on calendar if dots don\'t appear immediately')
    }
    
  } catch (error) {
    console.error('Error creating test booking:', error)
  }
}

testTodayBooking()
