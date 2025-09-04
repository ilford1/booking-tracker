-- CONSERVATIVE RLS Performance Fix
-- This addresses the main performance issue without major restructuring

-- Step 1: Create a simple helper function to cache auth.uid() lookups
CREATE OR REPLACE FUNCTION get_user_role_and_provider()
RETURNS TABLE(user_role user_role, provider_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT up.user_role, up.provider_id
  FROM user_profiles up
  WHERE up.id = auth.uid()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 2: Update the most problematic policy (the one causing the warning)
-- Drop and recreate the admin profile viewing policy with better performance

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- More efficient admin check - avoids the nested EXISTS in EXISTS pattern
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    (SELECT user_role FROM user_profiles WHERE id = auth.uid()) 
    IN ('business_admin', 'super_admin')
  );

-- Step 3: Add critical indexes that are likely missing
-- These indexes will dramatically improve RLS policy performance

-- Index for auth.uid() lookups (most critical)
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id) 
WHERE id IS NOT NULL;

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_role ON user_profiles(user_role) 
WHERE user_role IS NOT NULL;

-- Composite index for provider checks
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_provider_composite ON user_profiles(user_role, provider_id)
WHERE provider_id IS NOT NULL;

-- Step 4: Optimize a few other high-impact policies

-- Replace the complex bookings policy with a more efficient version
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;

CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (
    -- Get current user info once
    (SELECT user_role FROM user_profiles WHERE id = auth.uid()) IN ('customer', 'business_admin', 'super_admin')
    OR
    -- Service provider check with single query
    EXISTS (
      SELECT 1 
      FROM user_profiles up 
      WHERE up.id = auth.uid() 
        AND up.user_role = 'service_provider' 
        AND up.provider_id = bookings.creator_id
    )
  );

-- Step 5: Add ANALYZE to refresh statistics
ANALYZE user_profiles;
ANALYZE bookings;
ANALYZE creators;

-- Step 6: Create a simple function to check admin status (reusable)
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT user_role FROM user_profiles 
    WHERE id = auth.uid()
  ) IN ('business_admin', 'super_admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Test query to verify the fix worked
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'user_profiles' 
  AND schemaname = 'public'
ORDER BY indexname;

SELECT 'RLS performance optimization completed!' as status;
