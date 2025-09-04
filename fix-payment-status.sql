-- Fix payment status enum values to match application expectations
-- Run this SQL in your Supabase SQL Editor

-- First, update any existing data to use the new status values
UPDATE payments 
SET status = CASE 
  WHEN status = 'pending' THEN 'unconfirmed'
  WHEN status = 'paid' THEN 'paid'
  WHEN status = 'failed' THEN 'failed'
  WHEN status = 'refunded' THEN 'failed' -- Map refunded to failed for now
  WHEN status = 'cancelled' THEN 'failed' -- Map cancelled to failed for now
  ELSE 'unconfirmed'
END;

-- Drop the existing constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Add the new constraint with correct status values
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
CHECK (status IN ('unconfirmed', 'pending_invoice', 'waiting_payment', 'paid', 'failed'));

-- Update the default value
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'unconfirmed';

-- Show current payment statuses to verify the update
SELECT status, COUNT(*) as count FROM payments GROUP BY status;
