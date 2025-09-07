// Script to check table structure and seed compatible test data
// Run with: node scripts/check-and-seed.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndSeed() {
  try {
    console.log('Checking database structure...')
    
    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1)
    
    if (tablesError) {
      console.log('Error checking bookings table:', tablesError.message)
      console.log('This might mean the table doesn\'t exist or has different columns.')
    } else {
      console.log('Bookings table exists. Sample structure:', tables)
    }
    
    // Try to get campaigns
    const { data: campaignsSample, error: campaignsCheckError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1)
    
    if (campaignsCheckError) {
      console.log('Error checking campaigns table:', campaignsCheckError.message)
    } else {
      console.log('Campaigns table exists. Sample:', campaignsSample)
    }
    
    // Get current date for scheduling
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    // Try to create simple test data with minimal fields
    console.log('\n--- Attempting to create test data ---\n')
    
    // Create a simple booking with only essential fields
    const testBooking = {
      campaign_name: 'Test Campaign ' + new Date().getTime(),
      creator_username: '@test_creator_' + Math.floor(Math.random() * 1000),
      amount: 1000000,
      status: 'confirmed',
      scheduled_date: tomorrow.toISOString().split('T')[0],
      content_type: 'post',
      notes: 'Test booking created for calendar display'
    }
    
    console.log('Creating test booking:', testBooking)
    const { data: createdBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert(testBooking)
      .select()
    
    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      console.log('\nTrying alternative structure...')
      
      // Try without content_type
      delete testBooking.content_type
      const { data: retryBooking, error: retryError } = await supabase
        .from('bookings')
        .insert(testBooking)
        .select()
      
      if (retryError) {
        console.error('Retry also failed:', retryError.message)
      } else {
        console.log('✅ Successfully created booking (without content_type):', retryBooking)
      }
    } else {
      console.log('✅ Successfully created booking:', createdBooking)
    }
    
    // Try to create a campaign
    const testCampaign = {
      name: 'Test Campaign ' + new Date().getTime(),
      description: 'Test campaign for calendar display',
      start_date: today.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0],
      budget: 5000000,
      status: 'active'
    }
    
    console.log('\nCreating test campaign:', testCampaign)
    const { data: createdCampaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert(testCampaign)
      .select()
    
    if (campaignError) {
      console.error('Error creating campaign:', campaignError)
      
      // If error mentions 'brand' column, add it
      if (campaignError.message && campaignError.message.includes('brand')) {
        testCampaign.brand = 'Test Brand'
        console.log('Retrying with brand field...')
        const { data: retryCampaign, error: retryError } = await supabase
          .from('campaigns')
          .insert(testCampaign)
          .select()
        
        if (retryError) {
          console.error('Retry failed:', retryError.message)
        } else {
          console.log('✅ Successfully created campaign (with brand):', retryCampaign)
        }
      }
    } else {
      console.log('✅ Successfully created campaign:', createdCampaign)
    }
    
    // Fetch all bookings to see what we have
    console.log('\n--- Checking existing data ---\n')
    const { data: allBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (fetchError) {
      console.error('Error fetching bookings:', fetchError)
    } else {
      console.log(`Found ${allBookings?.length || 0} recent bookings:`)
      allBookings?.forEach(booking => {
        console.log(`- ${booking.campaign_name} by ${booking.creator_username} on ${booking.scheduled_date || booking.created_at}`)
      })
    }
    
    // Fetch all campaigns
    const { data: allCampaigns } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (allCampaigns && allCampaigns.length > 0) {
      console.log(`\nFound ${allCampaigns.length} recent campaigns:`)
      allCampaigns.forEach(campaign => {
        console.log(`- ${campaign.name} starting ${campaign.start_date}`)
      })
    }
    
    console.log('\n✅ Check complete! Refresh your calendar page to see the data.')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkAndSeed()
