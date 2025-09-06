-- Fix the booking status constraint to match our application's expected values

-- First, drop the existing constraint if it exists
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add the new constraint with the correct status values
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'in_process', 'content_submitted', 'approved', 'completed', 'canceled'));

-- If there are existing bookings with different status values, update them
-- (This is commented out as we don't know what values might exist)
-- UPDATE bookings SET status = 'pending' WHERE status NOT IN ('pending', 'in_process', 'content_submitted', 'approved', 'completed', 'canceled');
