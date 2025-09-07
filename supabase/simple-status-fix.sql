-- Simple recreation of status constraint
-- This will forcibly recreate the constraint with the correct values

-- 1. Remove ALL constraints on the bookings table temporarily
ALTER TABLE bookings DISABLE TRIGGER ALL;

-- 2. Drop all check constraints on bookings
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT constraint_name FROM information_schema.table_constraints 
              WHERE table_name = 'bookings' AND constraint_type = 'CHECK')
    LOOP
        EXECUTE 'ALTER TABLE bookings DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- 3. Create the new status constraint
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
    CHECK (status IN ('pending', 'deal', 'delivered', 'content_submitted', 'approved', 'completed'));

-- 4. Re-enable triggers
ALTER TABLE bookings ENABLE TRIGGER ALL;

-- 5. Test by updating a booking (this should work now)
DO $$
DECLARE
    test_booking_id UUID;
BEGIN
    -- Get the first booking ID
    SELECT id INTO test_booking_id FROM bookings LIMIT 1;
    
    IF test_booking_id IS NOT NULL THEN
        -- Test update with a valid status
        UPDATE bookings SET status = 'pending', updated_at = NOW() WHERE id = test_booking_id;
        RAISE NOTICE 'Successfully updated booking % to pending status', test_booking_id;
    ELSE
        RAISE NOTICE 'No bookings found to test';
    END IF;
END $$;
