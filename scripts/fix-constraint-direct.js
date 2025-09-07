const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ggwkkxmufcjnwgeqllev.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function fixConstraintDirect() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('🔧 Attempting direct constraint fix...')
    
    // Try to get a sample booking to test current constraint
    const { data: sampleBooking } = await supabase
      .from('bookings')
      .select('id, status')
      .limit(1)
      .single()

    if (!sampleBooking) {
      console.log('No bookings found to test with')
      return
    }

    console.log('Testing current constraint with sample booking:', sampleBooking.id)

    // Try to update with 'delivered' status to trigger the constraint error
    const { error: testError } = await supabase
      .from('bookings')
      .update({ status: 'delivered' })
      .eq('id', sampleBooking.id)

    if (testError && testError.code === '23514') {
      console.log('✅ Confirmed: Status constraint blocks "delivered" status')
      console.log('Constraint error:', testError.message)
      
      // Log what we need to do
      console.log(`
🛠️ The database constraint needs to be updated to allow these statuses:
- pending
- deal  
- delivered
- content_submitted
- approved
- completed

The current constraint is blocking 'deal' and 'delivered' statuses.

To fix this, you need to run this SQL manually in your Supabase dashboard:

DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed'));
      `)

      return
    }

    if (!testError) {
      console.log('✅ Status constraint already allows "delivered" - trying "deal"...')
      
      // Test 'deal' status
      const { error: dealError } = await supabase
        .from('bookings')
        .update({ status: 'deal' })
        .eq('id', sampleBooking.id)

      if (dealError && dealError.code === '23514') {
        console.log('✅ Status constraint blocks "deal" status but allows "delivered"')
      } else if (!dealError) {
        console.log('✅ Status constraint seems to be working correctly!')
        
        // Restore original status
        await supabase
          .from('bookings')
          .update({ status: sampleBooking.status })
          .eq('id', sampleBooking.id)
      }
    }

  } catch (err) {
    console.error('❌ Error:', err)
  }
}

fixConstraintDirect()
