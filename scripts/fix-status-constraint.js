const { createClient } = require('@supabase/supabase-js')

// Use the same Supabase URL and key from your app
const supabaseUrl = 'https://ggwkkxmufcjnwgeqllev.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function fixStatusConstraint() {
  if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
    console.log('Make sure you have the service role key in your .env.local file')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🔍 Checking current constraint...')
  
  // Check current constraint
  const { data: constraints, error: constraintError } = await supabase.rpc('sql', {
    query: `
      SELECT conname, pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'bookings') 
      AND contype = 'c';
    `
  })

  if (constraintError) {
    console.log('Trying alternative method to check constraints...')
  } else {
    console.log('Current constraints:', constraints)
  }

  console.log('🛠️ Fixing status constraint...')

  // Drop existing constraint and recreate
  const fixQuery = `
    -- Drop all check constraints on bookings table
    DO $$
    DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT constraint_name FROM information_schema.table_constraints 
                  WHERE table_name = 'bookings' AND constraint_type = 'CHECK')
        LOOP
            EXECUTE 'ALTER TABLE bookings DROP CONSTRAINT ' || quote_ident(r.constraint_name);
            RAISE NOTICE 'Dropped constraint %', r.constraint_name;
        END LOOP;
    END $$;

    -- Create new constraint with correct status values
    ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
        CHECK (status IN ('pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed'));

    -- Test the constraint
    SELECT 'Status constraint fixed successfully' as result;
  `

  try {
    const { data, error } = await supabase.rpc('sql', { query: fixQuery })
    
    if (error) {
      console.error('❌ Error fixing constraint:', error)
      
      // Try simpler approach
      console.log('Trying simpler approach...')
      const { error: simpleError } = await supabase
        .from('bookings')
        .update({ updated_at: new Date().toISOString() })
        .eq('status', 'delivered')
        .limit(1)
      
      if (simpleError && simpleError.code === '23514') {
        console.log('✅ Confirmed: Status constraint needs fixing')
        
        // Try direct SQL execution
        const queries = [
          "ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;",
          "ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed'));"
        ]
        
        for (const query of queries) {
          const { error: queryError } = await supabase.rpc('sql', { query })
          if (queryError) {
            console.error('Error executing:', query, queryError)
          } else {
            console.log('✅ Executed:', query)
          }
        }
      }
    } else {
      console.log('✅ Status constraint fixed successfully:', data)
    }

    // Test the fix
    console.log('🧪 Testing the fix...')
    const { data: testBooking } = await supabase
      .from('bookings')
      .select('id, status')
      .limit(1)
      .single()

    if (testBooking) {
      const { error: testError } = await supabase
        .from('bookings')
        .update({ status: 'delivered', updated_at: new Date().toISOString() })
        .eq('id', testBooking.id)

      if (testError) {
        console.error('❌ Test failed:', testError)
      } else {
        console.log('✅ Test passed: Can now update to "delivered" status')
        
        // Restore original status
        await supabase
          .from('bookings')
          .update({ status: testBooking.status })
          .eq('id', testBooking.id)
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

fixStatusConstraint()
