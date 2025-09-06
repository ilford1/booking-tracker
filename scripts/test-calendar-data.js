// Test script to verify calendar data retrieval
// Run with: node scripts/test-calendar-data.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCalendarData() {
  try {
    console.log('Testing calendar data retrieval for September 2025...\n')
    
    // Define date range for September 2025
    const startOfMonth = '2025-09-01'
    const endOfMonth = '2025-09-30'
    
    console.log(`Date Range: ${startOfMonth} to ${endOfMonth}\n`)
    
    // Test 1: Fetch all bookings
    console.log('--- Test 1: All Bookings ---')
    const { data: allBookings, error: allBookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(10)
    
    if (allBookingsError) {
      console.error('Error fetching all bookings:', allBookingsError)
    } else {
      console.log(`Total bookings found: ${allBookings.length}`)
      allBookings.forEach(b => {
        console.log(`  - ID: ${b.id.substring(0,8)}... | Campaign: ${b.campaign_name || 'null'} | Creator: ${b.creator_username || 'null'} | Scheduled: ${b.scheduled_date || 'null'}`)
      })
    }
    
    // Test 2: Fetch bookings with scheduled dates in September
    console.log('\n--- Test 2: September Bookings (by scheduled_date) ---')
    const { data: septBookings, error: septError } = await supabase
      .from('bookings')
      .select('*')
      .gte('scheduled_date', startOfMonth)
      .lte('scheduled_date', endOfMonth)
    
    if (septError) {
      console.error('Error:', septError)
    } else {
      console.log(`Bookings with scheduled_date in September: ${septBookings.length}`)
      septBookings.forEach(b => {
        console.log(`  📅 ${b.scheduled_date}: ${b.campaign_name || 'Unnamed'} by ${b.creator_username || 'Unknown'}`)
      })
    }
    
    // Test 3: Fetch all campaigns
    console.log('\n--- Test 3: All Campaigns ---')
    const { data: allCampaigns, error: allCampaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(10)
    
    if (allCampaignsError) {
      console.error('Error fetching all campaigns:', allCampaignsError)
    } else {
      console.log(`Total campaigns found: ${allCampaigns.length}`)
      allCampaigns.forEach(c => {
        console.log(`  - ${c.name} | Start: ${c.start_date || 'null'} | Status: ${c.status}`)
      })
    }
    
    // Test 4: Fetch campaigns starting in September
    console.log('\n--- Test 4: September Campaigns ---')
    const { data: septCampaigns, error: septCampaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .gte('start_date', startOfMonth)
      .lte('start_date', endOfMonth)
    
    if (septCampaignsError) {
      console.error('Error:', septCampaignsError)
    } else {
      console.log(`Campaigns starting in September: ${septCampaigns.length}`)
      septCampaigns.forEach(c => {
        console.log(`  🚀 ${c.start_date}: ${c.name} (${c.brand || 'No brand'})`)
      })
    }
    
    // Test 5: Check for any null/undefined issues
    console.log('\n--- Test 5: Data Quality Check ---')
    const nullChecks = {
      bookingsWithNullCampaign: allBookings?.filter(b => !b.campaign_name).length || 0,
      bookingsWithNullCreator: allBookings?.filter(b => !b.creator_username).length || 0,
      bookingsWithNullScheduled: allBookings?.filter(b => !b.scheduled_date).length || 0,
      campaignsWithNullStart: allCampaigns?.filter(c => !c.start_date).length || 0
    }
    
    console.log('Data issues:')
    Object.entries(nullChecks).forEach(([key, count]) => {
      console.log(`  - ${key}: ${count}`)
    })
    
    // Summary
    console.log('\n=== SUMMARY FOR CALENDAR VIEW ===')
    console.log(`September 2025 should display:`)
    console.log(`  • ${septBookings?.length || 0} deadline dots (from bookings with scheduled_date)`)
    console.log(`  • ${septCampaigns?.length || 0} campaign dots (from campaigns with start_date)`)
    
    const allSeptemberDates = new Set()
    septBookings?.forEach(b => {
      if (b.scheduled_date) {
        const day = new Date(b.scheduled_date).getDate()
        allSeptemberDates.add(day)
      }
    })
    septCampaigns?.forEach(c => {
      if (c.start_date) {
        const day = new Date(c.start_date).getDate()
        allSeptemberDates.add(day)
      }
    })
    
    console.log(`\nDays with events: ${Array.from(allSeptemberDates).sort((a,b) => a-b).join(', ')}`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testCalendarData()
