// Script to fix RLS policies for bookings table
// Run with: node scripts/fix-rls-policies.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLSPolicies() {
  try {
    console.log('Fixing RLS policies for bookings table...\n')
    
    // First, let's check current RLS status
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('bookings', 'campaigns')
        `
      })
    
    if (!rlsError && rlsStatus) {
      console.log('Current RLS status:')
      console.log(rlsStatus)
    }
    
    // Option 1: Disable RLS temporarily (for testing)
    console.log('\n--- Option 1: Disabling RLS for testing ---')
    console.log('This will allow all users to see all data.')
    console.log('Run this SQL in Supabase Dashboard SQL Editor:\n')
    
    const disableRLS = `
-- Disable RLS on bookings table (temporary for testing)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'bookings';
`
    console.log(disableRLS)
    
    // Option 2: Create a more permissive policy
    console.log('\n--- Option 2: Create permissive policy ---')
    console.log('This will allow all authenticated users to view all bookings.')
    console.log('Run this SQL in Supabase Dashboard SQL Editor:\n')
    
    const permissivePolicy = `
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view bookings" ON bookings;

-- Create a new permissive policy for viewing
CREATE POLICY "Anyone can view bookings" ON bookings
    FOR SELECT
    USING (true);

-- Verify the policy
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'bookings';
`
    console.log(permissivePolicy)
    
    console.log('\n--- Instructions ---')
    console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Run either Option 1 (disable RLS) or Option 2 (permissive policy)')
    console.log('5. Refresh your calendar page')
    
    console.log('\n✅ After running the SQL, your calendar should display all events!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixRLSPolicies()
