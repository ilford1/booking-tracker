-- Update booking status flow: pending -> deal -> delivered -> content_submitted -> approved -> completed
-- Remove 'canceled' and 'in_process', add 'deal' status

-- 1. Update booking status constraint to new flow
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'bookings' AND constraint_name = 'bookings_status_check') THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
        RAISE NOTICE 'Dropped existing status constraint';
    END IF;
    
    -- Add new constraint with updated status flow
    ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
        CHECK (status IN ('pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed'));
    RAISE NOTICE 'Added new status constraint with updated flow: pending -> deal -> delivered -> content_submitted -> approved -> completed';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update status constraint: %', SQLERRM;
END $$;

-- 2. Optional: Update existing bookings with old statuses
DO $$
BEGIN
    -- Update any 'in_process' bookings to 'deal' as closest equivalent
    UPDATE bookings 
    SET status = 'deal', updated_at = NOW() 
    WHERE status = 'in_process';
    
    -- Update any 'canceled' bookings to 'pending' (you might want to handle these differently)
    UPDATE bookings 
    SET status = 'pending', updated_at = NOW() 
    WHERE status = 'canceled';
    
    RAISE NOTICE 'Updated existing bookings with old statuses';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update existing booking statuses: %', SQLERRM;
END $$;

-- 3. Verify the changes
SELECT 
    status,
    COUNT(*) as count
FROM bookings 
GROUP BY status 
ORDER BY 
    CASE status 
        WHEN 'pending' THEN 1
        WHEN 'deal' THEN 2
        WHEN 'delivered' THEN 3
        WHEN 'content_submitted' THEN 4
        WHEN 'approved' THEN 5
        WHEN 'completed' THEN 6
        ELSE 7
    END;

-- 4. Show the new workflow
SELECT 
    'New Booking Workflow:' as message,
    'pending -> deal -> delivered -> content_submitted -> approved -> completed' as flow;
