const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ggwkkxmufcjnwgeqllev.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testDeletion() {
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })

  console.log('🧪 Testing booking deletion functionality...')
  
  try {
    // First, let's see all current bookings
    const { data: allBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, creator_id, campaign_id, status, created_at')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('❌ Error fetching bookings:', fetchError)
      return
    }

    console.log(`📊 Found ${allBookings.length} total bookings:`)
    allBookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ID: ${booking.id} | Status: ${booking.status}`)
    })

    if (allBookings.length === 0) {
      console.log('✅ No bookings to delete - this might explain why deletion appears to not work.')
      return
    }

    // Let's test creating a dummy booking and then deleting it
    console.log('\n🔨 Creating a test booking...')
    
    const { data: testBooking, error: createError } = await supabase
      .from('bookings')
      .insert({
        status: 'pending',
        offer_amount: 100,
        currency: 'VND',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating test booking:', createError)
      return
    }

    console.log(`✅ Test booking created with ID: ${testBooking.id}`)

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Now try to delete it
    console.log(`🗑️ Attempting to delete test booking: ${testBooking.id}`)
    
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', testBooking.id)

    if (deleteError) {
      console.error('❌ Error deleting test booking:', deleteError)
      return
    }

    console.log('✅ Test booking deleted successfully')

    // Verify it's gone
    const { data: verifyBooking, error: verifyError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', testBooking.id)
      .single()

    if (verifyError && verifyError.code === 'PGRST116') {
      console.log('✅ Verification successful: Test booking no longer exists in database')
    } else if (verifyBooking) {
      console.log('❌ Problem: Test booking still exists after deletion!')
    } else {
      console.log('⚠️ Verification unclear:', verifyError)
    }

    // Check final count
    const { data: finalBookings, error: finalError } = await supabase
      .from('bookings')
      .select('id')

    if (!finalError) {
      console.log(`📊 Final booking count: ${finalBookings.length}`)
    }

    console.log('\n✅ Deletion test completed successfully')
    console.log('\nIf you\'re still seeing bookings in the UI after deletion, the issue is likely:')
    console.log('1. Browser cache - try hard refresh (Ctrl+Shift+R)')
    console.log('2. Component state management - the UI needs better refresh handling')
    console.log('3. Next.js cache - the revalidatePath calls might not be sufficient')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDeletion()
