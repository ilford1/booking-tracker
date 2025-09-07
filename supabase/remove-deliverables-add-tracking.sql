-- Remove deliverables system and add tracking number to bookings
-- This migration simplifies the system to booking-only workflow with delivery tracking

-- 1. Add tracking_number field to bookings table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='tracking_number') THEN
        ALTER TABLE bookings ADD COLUMN tracking_number TEXT;
        RAISE NOTICE 'Added tracking_number column to bookings table';
    ELSE
        RAISE NOTICE 'tracking_number column already exists';
    END IF;
END $$;

-- 2. Add delivered_at timestamp field
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='delivered_at') THEN
        ALTER TABLE bookings ADD COLUMN delivered_at TIMESTAMPTZ;
        RAISE NOTICE 'Added delivered_at column to bookings table';
    ELSE
        RAISE NOTICE 'delivered_at column already exists';
    END IF;
END $$;

-- 3. Update booking status constraint to include 'delivered'
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'bookings' AND constraint_name = 'bookings_status_check') THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
        RAISE NOTICE 'Dropped existing status constraint';
    END IF;
    
    -- Add new constraint with 'delivered' status
    ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
        CHECK (status IN ('delivered', 'pending', 'in_process', 'content_submitted', 'approved', 'completed', 'canceled'));
    RAISE NOTICE 'Added new status constraint with delivered status';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update status constraint: %', SQLERRM;
END $$;

-- 4. Create indexes for better performance on new fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'bookings' AND indexname = 'idx_bookings_tracking_number') THEN
        CREATE INDEX idx_bookings_tracking_number ON bookings(tracking_number) WHERE tracking_number IS NOT NULL;
        RAISE NOTICE 'Created index on tracking_number';
    ELSE
        RAISE NOTICE 'Index on tracking_number already exists';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'bookings' AND indexname = 'idx_bookings_delivered_at') THEN
        CREATE INDEX idx_bookings_delivered_at ON bookings(delivered_at) WHERE delivered_at IS NOT NULL;
        RAISE NOTICE 'Created index on delivered_at';
    ELSE
        RAISE NOTICE 'Index on delivered_at already exists';
    END IF;
END $$;

-- 5. Optional: Drop deliverables table if you want to remove it completely
-- Uncomment the following section if you want to remove deliverables table
/*
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deliverables') THEN
        -- First, drop any foreign key constraints that reference deliverables
        DROP TABLE IF EXISTS deliverables CASCADE;
        RAISE NOTICE 'Dropped deliverables table and related constraints';
    ELSE
        RAISE NOTICE 'Deliverables table does not exist';
    END IF;
END $$;
*/

-- 6. Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'bookings'
    AND column_name IN ('tracking_number', 'delivered_at', 'status')
ORDER BY ordinal_position;

-- 7. Show example of new booking workflow
SELECT 
    'New workflow example:' as message,
    'delivered -> pending -> in_process -> content_submitted -> approved -> completed' as workflow,
    'tracking_number field now available for delivery tracking' as tracking_info;

-- 8. Show count of current bookings by status
SELECT 
    status,
    COUNT(*) as count
FROM bookings 
GROUP BY status 
ORDER BY count DESC;
