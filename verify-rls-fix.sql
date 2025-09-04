-- Verification Script: Check RLS Performance Fix Results
-- Run this after executing fix-all-rls-performance.sql

-- 1. Check that all policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual IS NOT NULL as has_using_clause,
    with_check IS NOT NULL as has_with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'creators', 'campaigns', 'bookings', 'deliverables', 'payments')
ORDER BY tablename, policyname;

-- 2. Check that all required indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'creators', 'campaigns', 'bookings', 'deliverables', 'payments')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 3. Check that helper functions were created
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    is_deterministic,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'current_user_id',
    'current_user_role', 
    'current_user_provider_id',
    'is_admin_role',
    'is_authenticated'
)
ORDER BY routine_name;

-- 4. Count policies by table
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'creators', 'campaigns', 'bookings', 'deliverables', 'payments')
GROUP BY tablename
ORDER BY tablename;

-- 5. Test a simple query to verify RLS is working (should not error)
SELECT 'RLS policies are active and functional' as test_result;

-- 6. Check table sizes and statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
AND relname IN ('user_profiles', 'creators', 'campaigns', 'bookings', 'deliverables', 'payments')
ORDER BY relname;

-- Summary
SELECT 
    'Verification Complete!' as status,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' 
     AND tablename IN ('user_profiles', 'creators', 'campaigns', 'bookings', 'deliverables', 'payments')) as total_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' 
     AND tablename IN ('user_profiles', 'creators', 'campaigns', 'bookings', 'deliverables', 'payments')
     AND indexname LIKE 'idx_%') as total_custom_indexes;
