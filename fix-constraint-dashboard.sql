-- SQL Script to fix booking status constraint
-- Run this in your Supabase Dashboard's SQL Editor

-- Step 1: Drop the existing constraint that is blocking 'deal' and 'delivered' statuses
DO $$
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'bookings' 
        AND constraint_name = 'bookings_status_check'
        AND constraint_type = 'CHECK'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
        RAISE NOTICE 'Dropped existing bookings_status_check constraint';
    ELSE
        RAISE NOTICE 'No existing bookings_status_check constraint found';
    END IF;
END $$;

-- Step 2: Create the new constraint with all required statuses
ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN (
    'pending',           -- Initial state - booking created
    'deal',              -- Deal confirmed, preparing for delivery  
    'delivered',         -- Goods shipped to creator
    'content_submitted', -- Content delivered by creator
    'approved',          -- Content approved
    'completed'          -- Fully completed
));

-- Step 3: Verify the constraint was created successfully
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'bookings_status_check';

-- Step 4: Test the fix with a sample update (this should work now)
DO $$
DECLARE
    test_booking_id UUID;
    original_status TEXT;
BEGIN
    -- Get a sample booking
    SELECT id, status INTO test_booking_id, original_status 
    FROM bookings 
    LIMIT 1;
    
    IF test_booking_id IS NOT NULL THEN
        -- Test updating to 'delivered' status
        UPDATE bookings 
        SET status = 'delivered', updated_at = NOW() 
        WHERE id = test_booking_id;
        
        RAISE NOTICE '✅ Successfully updated booking % to delivered status', test_booking_id;
        
        -- Test updating to 'deal' status  
        UPDATE bookings 
        SET status = 'deal', updated_at = NOW() 
        WHERE id = test_booking_id;
        
        RAISE NOTICE '✅ Successfully updated booking % to deal status', test_booking_id;
        
        -- Restore original status
        UPDATE bookings 
        SET status = original_status, updated_at = NOW() 
        WHERE id = test_booking_id;
        
        RAISE NOTICE '✅ Restored booking % to original status: %', test_booking_id, original_status;
    ELSE
        RAISE NOTICE 'No bookings found to test with';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;

-- Step 5: Show success message
SELECT 'Booking status constraint has been successfully updated! ✅' AS result;
