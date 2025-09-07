const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ggwkkxmufcjnwgeqllev.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function fixInvalidStatuses() {
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })

  console.log('🔍 Checking for invalid booking statuses...')
  
  try {
    // First, let's see all existing status values
    const { data: allBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status')
    
    if (fetchError) {
      console.error('❌ Error fetching bookings:', fetchError)
      return
    }

    console.log(`📊 Found ${allBookings.length} total bookings`)
    
    // Count status occurrences
    const statusCounts = {}
    allBookings.forEach(booking => {
      statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1
    })
    
    console.log('📈 Current status distribution:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} bookings`)
    })
    
    // Define valid statuses
    const validStatuses = ['pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed']
    
    // Find invalid statuses
    const invalidStatuses = Object.keys(statusCounts).filter(status => !validStatuses.includes(status))
    
    if (invalidStatuses.length === 0) {
      console.log('✅ All statuses are valid! The constraint should work now.')
      return
    }
    
    console.log(`❌ Found invalid statuses: ${invalidStatuses.join(', ')}`)
    console.log('🛠️ Need to fix these before applying the constraint...')
    
    // Mapping for common invalid statuses to valid ones
    const statusMappings = {
      'canceled': 'pending',        // Map canceled back to pending
      'in_process': 'deal',         // Map in_process to deal
      'cancelled': 'pending',       // Alternative spelling
      'draft': 'pending',           // Draft becomes pending
      'rejected': 'pending',        // Rejected goes back to pending
      'review': 'content_submitted', // Review becomes content_submitted
      'confirmed': 'deal',          // Confirmed becomes deal
      'shipped': 'delivered',       // Shipped becomes delivered
      'finished': 'completed',      // Finished becomes completed
      'done': 'completed'           // Done becomes completed
    }
    
    // Update invalid statuses
    console.log('🔧 Updating invalid statuses...')
    
    for (const invalidStatus of invalidStatuses) {
      const mappedStatus = statusMappings[invalidStatus] || 'pending' // Default to pending
      const bookingsToUpdate = allBookings.filter(b => b.status === invalidStatus)
      
      console.log(`📝 Updating ${bookingsToUpdate.length} bookings from '${invalidStatus}' to '${mappedStatus}'`)
      
      if (bookingsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            status: mappedStatus,
            updated_at: new Date().toISOString()
          })
          .eq('status', invalidStatus)
        
        if (updateError) {
          console.error(`❌ Error updating status '${invalidStatus}':`, updateError)
        } else {
          console.log(`✅ Successfully updated ${bookingsToUpdate.length} bookings from '${invalidStatus}' to '${mappedStatus}'`)
        }
      }
    }
    
    // Verify the updates
    console.log('🔍 Verifying updates...')
    const { data: updatedBookings } = await supabase
      .from('bookings')
      .select('status')
    
    const updatedStatusCounts = {}
    updatedBookings.forEach(booking => {
      updatedStatusCounts[booking.status] = (updatedStatusCounts[booking.status] || 0) + 1
    })
    
    console.log('📈 Updated status distribution:')
    Object.entries(updatedStatusCounts).forEach(([status, count]) => {
      const isValid = validStatuses.includes(status)
      console.log(`  ${status}: ${count} bookings ${isValid ? '✅' : '❌'}`)
    })
    
    const remainingInvalid = Object.keys(updatedStatusCounts).filter(status => !validStatuses.includes(status))
    
    if (remainingInvalid.length === 0) {
      console.log('\\n✅ All statuses are now valid!')
      console.log('\\n🛠️ Now you can run this SQL in your Supabase Dashboard:')
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
    } else {
      console.log(`\\n❌ Still have invalid statuses: ${remainingInvalid.join(', ')}`)
      console.log('You may need to manually fix these in the Supabase Dashboard.')
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error)
  }
}

fixInvalidStatuses()
