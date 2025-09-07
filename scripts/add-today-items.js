// Quick script to add items that should show up in today's schedule
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addTodayItems() {
  try {
    console.log('Adding items for today to test schedule widget...')
    
    const today = new Date()
    
    // Get existing campaign and creator
    const { data: campaigns } = await supabase.from('campaigns').select('*').limit(1)
    const { data: creators } = await supabase.from('creators').select('*').limit(1)
    
    if (!campaigns || campaigns.length === 0 || !creators || creators.length === 0) {
      console.error('No campaigns or creators found. Run the simple seed script first.')
      return
    }
    
    // Add a booking with deadline TODAY
    const { data: todayBooking, error: todayError } = await supabase
      .from('bookings')
      .insert({
        campaign_id: campaigns[0].id,
        creator_id: creators[0].id,
        notes: 'URGENT: Content due TODAY',
        offer_amount: 2000000,
        agreed_amount: 2000000,
        status: 'pending',
        deadline: today.toISOString().split('T')[0]
      })
      .select()
    
    if (todayError) {
      console.error('Error creating today booking:', todayError)
    } else {
      console.log('✅ Added booking with deadline TODAY')
    }
    
    // Add a campaign starting today
    const { data: todayCampaign, error: campaignError } = await supabase
      .from('campaigns')  
      .insert({
        name: 'Flash Sale Campaign',
        slug: 'flash-sale-today',
        brand: 'QuickDeals VN',
        description: 'One day flash sale campaign',
        start_date: today.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        budget: 5000000,
        status: 'active'
      })
      .select()
    
    if (campaignError) {
      console.error('Error creating today campaign:', campaignError)
    } else {
      console.log('✅ Added campaign starting TODAY')
    }
    
    console.log('\n✅ Today items added! The Schedule Widget should now show:')
    console.log('- A booking deadline TODAY')
    console.log('- A campaign starting TODAY') 
    console.log('- Recent booking creations (from previous seed)')
    
  } catch (error) {
    console.error('Error adding today items:', error)
  }
}

addTodayItems()
