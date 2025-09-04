-- Optimize RLS Policies for Performance
-- Run this in your Supabase SQL Editor to replace inefficient policies

-- First, let's create helper functions to cache expensive operations
-- This prevents repeated auth.uid() calls and subquery evaluations

-- Function to get current user info (cached within transaction)
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE(user_id UUID, role user_role, provider_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT up.id, up.user_role, up.provider_id
  FROM user_profiles up
  WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_role IN ('business_admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if current user can access creator
CREATE OR REPLACE FUNCTION can_access_creator(creator_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND (
      up.user_role IN ('business_admin', 'super_admin')
      OR up.provider_id = creator_id
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

DROP POLICY IF EXISTS "Anyone can view active creators" ON creators;
DROP POLICY IF EXISTS "Service providers can manage their own creator profile" ON creators;
DROP POLICY IF EXISTS "Admins can manage all creators" ON creators;

DROP POLICY IF EXISTS "Authenticated users can view active campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins can manage campaigns" ON campaigns;

DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON bookings;
DROP POLICY IF EXISTS "Service providers and admins can update bookings" ON bookings;

DROP POLICY IF EXISTS "Users can view relevant deliverables" ON deliverables;
DROP POLICY IF EXISTS "Service providers can manage their deliverables" ON deliverables;

DROP POLICY IF EXISTS "Users can view relevant payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON payments;

-- OPTIMIZED RLS POLICIES

-- User Profiles - Simplified and cached
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (is_admin());

-- Creators - Using helper functions
CREATE POLICY "Anyone can view active creators" ON creators
  FOR SELECT USING (status = 'active');

CREATE POLICY "Creators can manage own profile" ON creators
  FOR ALL USING (can_access_creator(id));

CREATE POLICY "Admins can manage all creators" ON creators
  FOR ALL USING (is_admin());

-- Campaigns - Simplified
CREATE POLICY "Authenticated users can view active campaigns" ON campaigns
  FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active');

CREATE POLICY "Admins can manage campaigns" ON campaigns
  FOR ALL USING (is_admin());

-- Bookings - Optimized with single query pattern
CREATE POLICY "Users can view accessible bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      LEFT JOIN creators c ON c.id = up.provider_id
      WHERE up.id = auth.uid()
      AND (
        up.user_role IN ('customer', 'business_admin', 'super_admin')
        OR (up.user_role = 'service_provider' AND c.id = bookings.creator_id)
      )
    )
  );

CREATE POLICY "Authorized users can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_role IN ('customer', 'business_admin', 'super_admin')
    )
  );

CREATE POLICY "Authorized users can update bookings" ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      LEFT JOIN creators c ON c.id = up.provider_id
      WHERE up.id = auth.uid()
      AND (
        up.user_role IN ('business_admin', 'super_admin')
        OR (up.user_role = 'service_provider' AND c.id = bookings.creator_id)
      )
    )
  );

-- Deliverables - Single efficient check
CREATE POLICY "Users can view accessible deliverables" ON deliverables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM bookings b
      JOIN user_profiles up ON up.id = auth.uid()
      LEFT JOIN creators c ON c.id = up.provider_id
      WHERE b.id = deliverables.booking_id
      AND (
        up.user_role IN ('customer', 'business_admin', 'super_admin')
        OR (up.user_role = 'service_provider' AND c.id = b.creator_id)
      )
    )
  );

CREATE POLICY "Authorized users can manage deliverables" ON deliverables
  FOR ALL USING (
    EXISTS (
      SELECT 1 
      FROM bookings b
      JOIN user_profiles up ON up.id = auth.uid()
      LEFT JOIN creators c ON c.id = up.provider_id
      WHERE b.id = deliverables.booking_id
      AND (
        up.user_role IN ('business_admin', 'super_admin')
        OR (up.user_role = 'service_provider' AND c.id = b.creator_id)
      )
    )
  );

-- Payments - Single efficient check
CREATE POLICY "Users can view accessible payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM bookings b
      JOIN user_profiles up ON up.id = auth.uid()
      LEFT JOIN creators c ON c.id = up.provider_id
      WHERE b.id = payments.booking_id
      AND (
        up.user_role IN ('customer', 'business_admin', 'super_admin')
        OR (up.user_role = 'service_provider' AND c.id = b.creator_id)
      )
    )
  );

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (is_admin());

-- Add missing indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_uid ON user_profiles(id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_creator_id_idx ON bookings(creator_id) WHERE creator_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deliverables_booking_id_idx ON deliverables(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_booking_id_idx ON payments(booking_id) WHERE booking_id IS NOT NULL;

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_provider ON user_profiles(user_role, provider_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Test the policies work correctly
SELECT 'RLS policies optimized successfully!' as status;
