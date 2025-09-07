-- Add deliverable tracking fields to bookings table
-- This allows tracking when content is due and what type of content

-- 1. Add scheduled_date column (when deliverables are due)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='scheduled_date') THEN
        ALTER TABLE bookings ADD COLUMN scheduled_date DATE;
        RAISE NOTICE 'Added scheduled_date column to bookings table';
    ELSE
        RAISE NOTICE 'scheduled_date column already exists';
    END IF;
END $$;

-- 2. Add content_type column if it doesn't exist as a proper field
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='content_type') THEN
        -- First check if there's a constraint we need to drop
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'bookings' AND constraint_name = 'bookings_content_type_check') THEN
            ALTER TABLE bookings DROP CONSTRAINT bookings_content_type_check;
        END IF;
        
        -- Add the column if it doesn't exist
        ALTER TABLE bookings ADD COLUMN content_type TEXT;
        
        -- Add the check constraint
        ALTER TABLE bookings ADD CONSTRAINT bookings_content_type_check 
            CHECK (content_type IN ('post', 'story', 'reel', 'video', 'live', 'review', 'other') OR content_type IS NULL);
            
        RAISE NOTICE 'Added content_type column to bookings table';
    ELSE
        RAISE NOTICE 'content_type column already exists';
        
        -- Ensure the constraint exists even if column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE table_name = 'bookings' AND constraint_name = 'bookings_content_type_check') THEN
            ALTER TABLE bookings ADD CONSTRAINT bookings_content_type_check 
                CHECK (content_type IN ('post', 'story', 'reel', 'video', 'live', 'review', 'other') OR content_type IS NULL);
            RAISE NOTICE 'Added content_type constraint';
        END IF;
    END IF;
END $$;

-- 3. Add deliverables array if missing (for multiple deliverables)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='deliverables') THEN
        ALTER TABLE bookings ADD COLUMN deliverables TEXT[];
        RAISE NOTICE 'Added deliverables column to bookings table';
    ELSE
        RAISE NOTICE 'deliverables column already exists';
    END IF;
END $$;

-- 4. Create an index on scheduled_date for better performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'bookings' AND indexname = 'idx_bookings_scheduled_date') THEN
        CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);
        RAISE NOTICE 'Created index on scheduled_date';
    ELSE
        RAISE NOTICE 'Index on scheduled_date already exists';
    END IF;
END $$;

-- 5. Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'bookings'
    AND column_name IN ('scheduled_date', 'content_type', 'deliverables')
ORDER BY ordinal_position;

-- 6. Show sample query to test the new fields
SELECT 
    'You can now track deliverables!' as message,
    'Example: INSERT INTO bookings (campaign_name, creator_username, scheduled_date, content_type) VALUES (''Summer Campaign'', ''@influencer'', ''2024-01-20'', ''post'');' as example_query;
