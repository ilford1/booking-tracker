// Quick script to test calendar dots by adding events for current month
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCalendarDots() {
  try {
    console.log('Testing calendar dots with current date...')
    
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    console.log(`Current date: ${now.toDateString()}`)
    console.log(`Current month: ${currentMonth + 1}/${currentYear}`)
    
    // Get existing data to see what we have
    const { data: campaigns } = await supabase.from('campaigns').select('*')
    const { data: creators } = await supabase.from('creators').select('*')
    const { data: bookings } = await supabase.from('bookings').select('*')
    
    console.log('\\nExisting data:')
    console.log(`- Campaigns: ${campaigns?.length || 0}`)
    console.log(`- Creators: ${creators?.length || 0}`)
    console.log(`- Bookings: ${bookings?.length || 0}`)
    
    if (campaigns?.length > 0) {
      console.log('\\nCampaign dates:')
      campaigns.forEach(c => {
        const startDate = new Date(c.start_date)
        console.log(`  ${c.name}: ${startDate.toDateString()}`)
      })
    }
    
    if (bookings?.length > 0) {
      console.log('\\nBooking dates:')
      bookings.forEach(b => {
        const createdDate = new Date(b.created_at)
        const deadlineDate = b.deadline ? new Date(b.deadline) : null
        console.log(`  Booking ${b.id.substring(0, 8)}:`)
        console.log(`    Created: ${createdDate.toDateString()}`)
        if (deadlineDate) {
          console.log(`    Deadline: ${deadlineDate.toDateString()}`)
        }
      })
    }
    
    // Test calendar widget logic
    console.log('\\n=== TESTING CALENDAR LOGIC ===')
    
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    
    console.log(`Month range: ${firstDay.toDateString()} to ${lastDay.toDateString()}`)
    
    // Check for events in current month
    const currentMonthEvents = []
    
    // Check campaigns
    campaigns?.forEach(campaign => {
      const campaignDate = new Date(campaign.start_date)
      if (campaignDate.getMonth() === currentMonth && campaignDate.getFullYear() === currentYear) {
        currentMonthEvents.push({
          date: campaignDate.getDate(),
          type: 'campaign',
          title: campaign.name
        })
      }
    })
    
    // Check bookings
    bookings?.forEach(booking => {
      const createdDate = new Date(booking.created_at)
      if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
        currentMonthEvents.push({
          date: createdDate.getDate(),
          type: 'booking',
          title: 'Booking created'
        })
      }
      
      if (booking.deadline) {
        const deadlineDate = new Date(booking.deadline)
        if (deadlineDate.getMonth() === currentMonth && deadlineDate.getFullYear() === currentYear) {
          currentMonthEvents.push({
            date: deadlineDate.getDate(),
            type: 'deadline',
            title: 'Booking deadline'
          })
        }
      }
    })
    
    console.log(`\\nEvents in current month (${currentMonth + 1}/${currentYear}):`)
    if (currentMonthEvents.length === 0) {
      console.log('  ❌ NO EVENTS FOUND - This is why no dots are showing!')
      console.log('\\n💡 SOLUTION: Add events for December 2024')
      
      // Add some events for current month
      if (campaigns && campaigns.length > 0 && creators && creators.length > 0) {
        console.log('\\nAdding events for current month...')
        
        // Add booking with deadline today + 3 days
        const todayPlus3 = new Date()
        todayPlus3.setDate(todayPlus3.getDate() + 3)
        
        const { data: newBooking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            campaign_id: campaigns[0].id,
            creator_id: creators[0].id,
            notes: 'December test booking',
            offer_amount: 1500000,
            agreed_amount: 1500000,
            status: 'pending',
            deadline: todayPlus3.toISOString().split('T')[0]
          })
          .select()
        
        if (bookingError) {
          console.error('Error creating test booking:', bookingError)
        } else {
          console.log(`✅ Added booking with deadline: ${todayPlus3.toDateString()}`)
        }
        
        // Add campaign starting today + 5 days  
        const todayPlus5 = new Date()
        todayPlus5.setDate(todayPlus5.getDate() + 5)
        
        const { data: newCampaign, error: campaignError } = await supabase
          .from('campaigns')
          .insert({
            name: 'December Test Campaign',
            slug: 'dec-test-campaign',
            brand: 'Test Brand',
            description: 'Campaign for testing calendar dots',
            start_date: todayPlus5.toISOString().split('T')[0],
            budget: 3000000,
            status: 'active'
          })
          .select()
        
        if (campaignError) {
          console.error('Error creating test campaign:', campaignError)  
        } else {
          console.log(`✅ Added campaign starting: ${todayPlus5.toDateString()}`)
        }
        
        console.log('\\n🎉 Calendar should now show dots!')
      }
    } else {
      console.log('  ✅ Found events:')
      currentMonthEvents.forEach(event => {
        console.log(`    Day ${event.date}: ${event.type} - ${event.title}`)
      })
    }
    
  } catch (error) {
    console.error('Error testing calendar:', error)
  }
}

testCalendarDots()
