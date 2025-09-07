const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ggwkkxmufcjnwgeqllev.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function fixConstraintAdvanced() {
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })

  console.log('🔧 Starting advanced constraint fix...')
  
  try {
    // Method 1: Try using PostgREST directly with a function call
    console.log('📡 Attempting Method 1: Direct SQL via rpc...')
    
    const dropConstraintQuery = `
      DO $$
      BEGIN
          IF EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE table_name = 'bookings' 
              AND constraint_name = 'bookings_status_check'
              AND constraint_type = 'CHECK'
          ) THEN
              ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
          END IF;
      END $$;
    `
    
    const createConstraintQuery = `
      ALTER TABLE bookings 
      ADD CONSTRAINT bookings_status_check 
      CHECK (status IN ('pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed'));
    `

    // Try to execute drop constraint
    try {
      // Some Supabase instances have a custom SQL function
      const { data: dropResult, error: dropError } = await supabase
        .rpc('exec_sql', { sql: dropConstraintQuery })
      
      if (dropError) {
        console.log('📝 Drop constraint via rpc failed, trying alternative methods...')
      } else {
        console.log('✅ Drop constraint successful via rpc')
      }
    } catch (e) {
      console.log('📝 RPC method not available, trying alternatives...')
    }

    // Method 2: Try using direct database connection via pg
    console.log('📡 Attempting Method 2: Direct database modification...')
    
    // Create a test to see current allowed values
    const { data: currentBookings } = await supabase
      .from('bookings')
      .select('id, status')
      .limit(3)
    
    console.log('Current booking statuses:', currentBookings?.map(b => b.status))
    
    // Method 3: Try the constraint fix by updating a booking directly with error handling
    console.log('📡 Attempting Method 3: Force constraint recreation via client...')
    
    if (currentBookings && currentBookings.length > 0) {
      const testBooking = currentBookings[0]
      console.log(`Testing with booking: ${testBooking.id}, current status: ${testBooking.status}`)
      
      // Try to identify what statuses are currently allowed by testing each one
      const testStatuses = ['pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed']
      const allowedStatuses = []
      const blockedStatuses = []
      
      for (const status of testStatuses) {
        try {
          const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', testBooking.id)
          
          if (!error) {
            allowedStatuses.push(status)
            console.log(`✅ Status '${status}' is ALLOWED`)
          } else if (error.code === '23514') {
            blockedStatuses.push(status)
            console.log(`❌ Status '${status}' is BLOCKED by constraint`)
          } else {
            console.log(`⚠️ Status '${status}' failed with different error:`, error.message)
          }
        } catch (e) {
          console.log(`⚠️ Status '${status}' test failed:`, e.message)
        }
      }
      
      // Restore original status
      await supabase
        .from('bookings')
        .update({ status: testBooking.status })
        .eq('id', testBooking.id)
      
      console.log('\\n📊 Status Summary:')
      console.log('Allowed statuses:', allowedStatuses)
      console.log('Blocked statuses:', blockedStatuses)
      
      if (blockedStatuses.includes('deal') || blockedStatuses.includes('delivered')) {
        console.log('\\n❌ Constraint issue confirmed!')
        console.log('\\n🛠️ SOLUTION: Run this SQL in your Supabase Dashboard SQL Editor:')
        console.log('\\n```sql')
        console.log('-- Drop existing constraint')
        console.log('ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;')
        console.log('')
        console.log('-- Create new constraint with all required statuses')
        console.log('ALTER TABLE bookings ADD CONSTRAINT bookings_status_check')
        console.log("  CHECK (status IN ('pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed'));")
        console.log('')
        console.log('-- Test the fix')
        console.log("SELECT 'Constraint updated successfully!' AS result;")
        console.log('```')
        console.log('\\n📋 Steps:')
        console.log('1. Go to: https://supabase.com/dashboard/project/ggwkkxmufcjnwgeqllev')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Copy and paste the SQL above')
        console.log('4. Click RUN to execute')
        console.log('5. Restart your application')
      } else {
        console.log('\\n✅ Constraint appears to be working correctly!')
      }
    }

  } catch (error) {
    console.error('❌ Advanced fix failed:', error)
  }
}

fixConstraintAdvanced()
