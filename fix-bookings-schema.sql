-- Fix bookings table schema
-- Add missing columns and ensure proper structure

BEGIN;

-- Add deadline column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'deadline'
    ) THEN
        ALTER TABLE bookings ADD COLUMN deadline DATE;
    END IF;
END $$;

-- Add actor column if it doesn't exist (for staff ownership)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'actor'
    ) THEN
        ALTER TABLE bookings ADD COLUMN actor UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Drop brief column if it exists (simplified workflow)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'brief'
    ) THEN
        ALTER TABLE bookings DROP COLUMN brief;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_bookings_deadline ON bookings(deadline);
CREATE INDEX IF NOT EXISTS idx_bookings_actor ON bookings(actor);

-- Ensure actor column is populated with created_by if it exists and actor is null
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'created_by'
    ) THEN
        UPDATE bookings SET actor = created_by WHERE actor IS NULL AND created_by IS NOT NULL;
    END IF;
END $$;

COMMIT;

-- Show current bookings table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
