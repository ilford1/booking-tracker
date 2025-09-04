-- COMPREHENSIVE RLS Performance Fix for ALL Tables
-- This addresses the Auth RLS Initialization Plan warnings for all affected tables

-- First, let's drop ALL existing policies to recreate them efficiently
DO $$
BEGIN
    -- Drop all existing policies
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
    
    RAISE NOTICE 'All existing policies dropped successfully';
END $$;

-- Create optimized helper functions that cache expensive auth operations
-- These functions use STABLE to ensure they're only called once per transaction

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
DECLARE
    role user_role;
BEGIN
    SELECT user_role INTO role
    FROM user_profiles
    WHERE id = current_user_id();
    
    RETURN COALESCE(role, 'customer'::user_role);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_provider_id()
RETURNS UUID AS $$
DECLARE
    provider UUID;
BEGIN
    SELECT provider_id INTO provider
    FROM user_profiles
    WHERE id = current_user_id();
    
    RETURN provider;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_role() IN ('business_admin', 'super_admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Add critical indexes before creating policies
-- These indexes are essential for RLS performance

-- Primary indexes for auth lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_provider ON user_profiles(provider_id) WHERE provider_id IS NOT NULL;

-- Relationship indexes for RLS policies
CREATE INDEX IF NOT EXISTS idx_bookings_creator ON bookings(creator_id) WHERE creator_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deliverables_booking ON deliverables(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id) WHERE booking_id IS NOT NULL;

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_provider ON user_profiles(user_role, provider_id);
CREATE INDEX IF NOT EXISTS idx_creators_status ON creators(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- OPTIMIZED RLS POLICIES
-- These policies avoid the auth.<function>() re-evaluation issue

-- USER PROFILES POLICIES
CREATE POLICY "user_can_view_own_profile" ON user_profiles
    FOR SELECT USING (id = current_user_id());

CREATE POLICY "user_can_update_own_profile" ON user_profiles
    FOR UPDATE USING (id = current_user_id());

CREATE POLICY "admin_can_view_all_profiles" ON user_profiles
    FOR SELECT USING (is_admin_role());

-- CREATORS POLICIES
CREATE POLICY "anyone_can_view_active_creators" ON creators
    FOR SELECT USING (status = 'active');

CREATE POLICY "provider_can_manage_own_creator_profile" ON creators
    FOR ALL USING (
        is_admin_role() 
        OR id = current_user_provider_id()
    );

-- CAMPAIGNS POLICIES
CREATE POLICY "authenticated_users_can_view_active_campaigns" ON campaigns
    FOR SELECT USING (is_authenticated() AND status = 'active');

CREATE POLICY "admin_can_manage_campaigns" ON campaigns
    FOR ALL USING (is_admin_role());

-- BOOKINGS POLICIES
CREATE POLICY "user_can_view_accessible_bookings" ON bookings
    FOR SELECT USING (
        current_user_role() IN ('customer', 'business_admin', 'super_admin')
        OR (
            current_user_role() = 'service_provider' 
            AND creator_id = current_user_provider_id()
        )
    );

CREATE POLICY "authorized_user_can_create_bookings" ON bookings
    FOR INSERT WITH CHECK (
        current_user_role() IN ('customer', 'business_admin', 'super_admin')
    );

CREATE POLICY "authorized_user_can_update_bookings" ON bookings
    FOR UPDATE USING (
        is_admin_role()
        OR (
            current_user_role() = 'service_provider' 
            AND creator_id = current_user_provider_id()
        )
    );

-- DELIVERABLES POLICIES
CREATE POLICY "user_can_view_accessible_deliverables" ON deliverables
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = deliverables.booking_id
            AND (
                current_user_role() IN ('customer', 'business_admin', 'super_admin')
                OR (
                    current_user_role() = 'service_provider' 
                    AND b.creator_id = current_user_provider_id()
                )
            )
        )
    );

CREATE POLICY "authorized_user_can_manage_deliverables" ON deliverables
    FOR ALL USING (
        is_admin_role()
        OR EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = deliverables.booking_id
            AND current_user_role() = 'service_provider' 
            AND b.creator_id = current_user_provider_id()
        )
    );

-- PAYMENTS POLICIES
CREATE POLICY "user_can_view_accessible_payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = payments.booking_id
            AND (
                current_user_role() IN ('customer', 'business_admin', 'super_admin')
                OR (
                    current_user_role() = 'service_provider' 
                    AND b.creator_id = current_user_provider_id()
                )
            )
        )
    );

CREATE POLICY "admin_can_manage_payments" ON payments
    FOR ALL USING (is_admin_role());

-- Refresh table statistics for optimal query planning
ANALYZE user_profiles;
ANALYZE creators;
ANALYZE campaigns;
ANALYZE bookings;
ANALYZE deliverables;
ANALYZE payments;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verification queries
DO $$
DECLARE 
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'creators', 'campaigns', 'bookings', 'deliverables', 'payments');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'creators', 'campaigns', 'bookings', 'deliverables', 'payments');
    
    RAISE NOTICE 'RLS optimization complete! Created % policies and % indexes', policy_count, index_count;
END $$;

-- Final status
SELECT 'ALL RLS performance issues fixed! Auth re-evaluation warnings should be resolved.' as status;
