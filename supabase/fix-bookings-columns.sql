-- Fix bookings table by adding any missing columns
-- This script safely adds columns without dropping existing data

-- First, let's see what columns currently exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Add missing columns one by one (safe approach)
DO $$ 
BEGIN
    -- Add amount column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='amount') THEN
        ALTER TABLE bookings ADD COLUMN amount DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE 'Added amount column';
    END IF;
    
    -- Add scheduled_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='scheduled_date') THEN
        ALTER TABLE bookings ADD COLUMN scheduled_date DATE;
        RAISE NOTICE 'Added scheduled_date column';
    END IF;
    
    -- Add content_type if missing (as TEXT, not array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='content_type') THEN
        ALTER TABLE bookings ADD COLUMN content_type TEXT;
        RAISE NOTICE 'Added content_type column';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='bookings' AND column_name='content_type' 
                  AND data_type = 'ARRAY') THEN
        -- If it exists as array, convert to TEXT
        ALTER TABLE bookings RENAME COLUMN content_type TO content_type_old;
        ALTER TABLE bookings ADD COLUMN content_type TEXT;
        UPDATE bookings SET content_type = content_type_old[1] WHERE content_type_old IS NOT NULL;
        ALTER TABLE bookings DROP COLUMN content_type_old;
        RAISE NOTICE 'Converted content_type from array to text';
    END IF;
    
    -- Add campaign_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='campaign_name') THEN
        ALTER TABLE bookings ADD COLUMN campaign_name TEXT;
        RAISE NOTICE 'Added campaign_name column';
    END IF;
    
    -- Add creator_username if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='creator_username') THEN
        ALTER TABLE bookings ADD COLUMN creator_username TEXT;
        RAISE NOTICE 'Added creator_username column';
    END IF;
    
    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='status') THEN
        ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column';
    END IF;
    
    -- Add currency if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='currency') THEN
        ALTER TABLE bookings ADD COLUMN currency TEXT DEFAULT 'VND';
        RAISE NOTICE 'Added currency column';
    END IF;
    
    -- Add notes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='notes') THEN
        ALTER TABLE bookings ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;
    
    -- Add offer_amount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='offer_amount') THEN
        ALTER TABLE bookings ADD COLUMN offer_amount DECIMAL(10, 2);
        RAISE NOTICE 'Added offer_amount column';
    END IF;
    
    -- Add agreed_amount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='agreed_amount') THEN
        ALTER TABLE bookings ADD COLUMN agreed_amount DECIMAL(10, 2);
        RAISE NOTICE 'Added agreed_amount column';
    END IF;
    
    -- Add created_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='created_at') THEN
        ALTER TABLE bookings ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='updated_at') THEN
        ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Add constraint for content_type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'bookings' 
                   AND constraint_name = 'bookings_content_type_check') THEN
        ALTER TABLE bookings ADD CONSTRAINT bookings_content_type_check 
            CHECK (content_type IN ('post', 'story', 'reel', 'video', 'live', 'review', 'other') OR content_type IS NULL);
        RAISE NOTICE 'Added content_type constraint';
    END IF;
END $$;

-- Now let's verify the columns exist
SELECT 
    'Column Check' as check_type,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='amount') as has_amount,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='scheduled_date') as has_scheduled_date,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='content_type') as has_content_type,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='campaign_name') as has_campaign_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='creator_username') as has_creator_username;

-- Try to add sample data only if all columns exist
DO $$
BEGIN
    -- Check if we can insert sample data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='amount')
       AND NOT EXISTS (SELECT 1 FROM bookings WHERE campaign_name = 'Sample Campaign') THEN
        
        INSERT INTO bookings (
            campaign_name, 
            creator_username, 
            scheduled_date, 
            content_type, 
            amount, 
            status,
            currency
        ) VALUES (
            'Sample Campaign',
            '@sample_creator',
            CURRENT_DATE + INTERVAL '7 days',
            'post',
            1000000,
            'pending',
            'VND'
        );
        
        RAISE NOTICE 'Added sample booking';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add sample data: %', SQLERRM;
END $$;

-- Final verification
SELECT 
    'Final Status' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'bookings') as total_columns,
    (SELECT COUNT(*) FROM bookings) as total_bookings;

-- List all columns for verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
