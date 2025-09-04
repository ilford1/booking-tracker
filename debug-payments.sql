-- Debug script to check payment status values
-- Run this in your Supabase SQL Editor

-- 1. Check current payment statuses
SELECT DISTINCT status, COUNT(*) as count 
FROM payments 
GROUP BY status 
ORDER BY status;

-- 2. Check the current constraint
SELECT 
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'payments'::regclass 
AND contype = 'c' 
AND conname LIKE '%status%';

-- 3. Show payment table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- 4. Show a few sample payments
SELECT id, status, amount, booking_id, created_at 
FROM payments 
LIMIT 5;
