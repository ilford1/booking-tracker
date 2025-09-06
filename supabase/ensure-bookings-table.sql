-- Ensure bookings table exists with all necessary columns
-- Run this if you're getting errors about missing bookings table

-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campaign and creator info
    campaign_id UUID,
    campaign_name TEXT,
    creator_id UUID,
    creator_username TEXT,
    creator_platform TEXT,
    
    -- Booking details
    content_type TEXT,
    deliverables TEXT[],
    amount DECIMAL(10, 2) DEFAULT 0,
    currency TEXT DEFAULT 'VND',
    status TEXT DEFAULT 'pending',
    notes TEXT,
    
    -- Important: Deliverable tracking
    scheduled_date DATE, -- When content is due
    
    -- Financial
    offer_amount DECIMAL(10, 2),
    agreed_amount DECIMAL(10, 2),
    
    -- Tracking
    contract_url TEXT,
    brief TEXT,
    contact_channel TEXT,
    utm_code TEXT,
    affiliate_code TEXT,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns if they're missing (for existing tables)
DO $$ 
BEGIN
    -- Add scheduled_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='scheduled_date') THEN
        ALTER TABLE bookings ADD COLUMN scheduled_date DATE;
        RAISE NOTICE 'Added scheduled_date column';
    END IF;
    
    -- Add content_type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='content_type') THEN
        ALTER TABLE bookings ADD COLUMN content_type TEXT;
        RAISE NOTICE 'Added content_type column';
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
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_campaign_id ON bookings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_bookings_creator_id ON bookings(creator_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (adjust as needed)
DO $$
BEGIN
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;
    DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
    DROP POLICY IF EXISTS "Authenticated users can update bookings" ON bookings;
    DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON bookings;
    
    -- Create new policies
    CREATE POLICY "Anyone can view bookings" ON bookings
        FOR SELECT USING (true);
    
    CREATE POLICY "Authenticated users can create bookings" ON bookings
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Authenticated users can update bookings" ON bookings
        FOR UPDATE USING (auth.uid() IS NOT NULL);
    
    CREATE POLICY "Authenticated users can delete bookings" ON bookings
        FOR DELETE USING (auth.uid() IS NOT NULL);
END $$;

-- Add some sample data if table is empty (optional)
INSERT INTO bookings (campaign_name, creator_username, scheduled_date, content_type, amount, status)
SELECT 
    'Sample Campaign',
    '@sample_creator',
    CURRENT_DATE + INTERVAL '7 days',
    'post',
    1000000,
    'pending'
WHERE NOT EXISTS (SELECT 1 FROM bookings LIMIT 1);

-- Verify the setup
SELECT 
    'Table Status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings')
        THEN '✅ Bookings table exists'
        ELSE '❌ Bookings table missing'
    END as status,
    (SELECT COUNT(*) FROM bookings) as total_bookings,
    (SELECT COUNT(*) FROM bookings WHERE scheduled_date IS NOT NULL) as bookings_with_deadlines;
