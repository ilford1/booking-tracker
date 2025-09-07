// Script to clear test data from Supabase
// Run with: node scripts/clear-test-data.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearData() {
  try {
    console.log('Clearing existing test data...')
    
    // Delete in order to respect foreign key constraints
    console.log('Deleting payments...')
    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('Deleting bookings...')
    await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('Deleting campaigns...')
    await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('Deleting creators...')
    await supabase.from('creators').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('✅ Test data cleared successfully!')
    
  } catch (error) {
    console.error('Error clearing data:', error)
  }
}

clearData()
