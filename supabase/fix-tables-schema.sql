-- Fix existing tables by adding missing columns
-- This script safely adds columns that might be missing

-- 1. Add created_by to campaigns if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='campaigns' AND column_name='created_by') THEN
        ALTER TABLE campaigns ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Add created_by to bookings if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='created_by') THEN
        ALTER TABLE bookings ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Add missing columns to campaigns table
DO $$ 
BEGIN
    -- Add description if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='campaigns' AND column_name='description') THEN
        ALTER TABLE campaigns ADD COLUMN description TEXT;
    END IF;
    
    -- Add start_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='campaigns' AND column_name='start_date') THEN
        ALTER TABLE campaigns ADD COLUMN start_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add end_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='campaigns' AND column_name='end_date') THEN
        ALTER TABLE campaigns ADD COLUMN end_date DATE;
    END IF;
    
    -- Add budget if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='campaigns' AND column_name='budget') THEN
        ALTER TABLE campaigns ADD COLUMN budget DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='campaigns' AND column_name='status') THEN
        ALTER TABLE campaigns ADD COLUMN status TEXT DEFAULT 'draft';
        -- Add constraint
        ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check 
            CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled'));
    END IF;
    
    -- Add target_audience if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='campaigns' AND column_name='target_audience') THEN
        ALTER TABLE campaigns ADD COLUMN target_audience TEXT;
    END IF;
    
    -- Add goals if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='campaigns' AND column_name='goals') THEN
        ALTER TABLE campaigns ADD COLUMN goals TEXT[];
    END IF;
    
    -- Add kpis if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='campaigns' AND column_name='kpis') THEN
        ALTER TABLE campaigns ADD COLUMN kpis JSONB DEFAULT '{}';
    END IF;
END $$;

-- 4. Add missing columns to bookings table
DO $$ 
BEGIN
    -- Add campaign_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='campaign_id') THEN
        ALTER TABLE bookings ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;
    END IF;
    
    -- Add campaign_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='campaign_name') THEN
        ALTER TABLE bookings ADD COLUMN campaign_name TEXT;
    END IF;
    
    -- Add creator_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='creator_id') THEN
        ALTER TABLE bookings ADD COLUMN creator_id UUID;
    END IF;
    
    -- Add creator_username if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='creator_username') THEN
        ALTER TABLE bookings ADD COLUMN creator_username TEXT;
    END IF;
    
    -- Add creator_platform if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='creator_platform') THEN
        ALTER TABLE bookings ADD COLUMN creator_platform TEXT;
        -- Add constraint
        ALTER TABLE bookings ADD CONSTRAINT bookings_creator_platform_check 
            CHECK (creator_platform IN ('instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'linkedin', 'other'));
    END IF;
    
    -- Add content_type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='content_type') THEN
        ALTER TABLE bookings ADD COLUMN content_type TEXT;
        -- Add constraint
        ALTER TABLE bookings ADD CONSTRAINT bookings_content_type_check 
            CHECK (content_type IN ('post', 'story', 'reel', 'video', 'live', 'other'));
    END IF;
    
    -- Add deliverables if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='deliverables') THEN
        ALTER TABLE bookings ADD COLUMN deliverables TEXT[];
    END IF;
    
    -- Add amount if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='amount') THEN
        ALTER TABLE bookings ADD COLUMN amount DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Add currency if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='currency') THEN
        ALTER TABLE bookings ADD COLUMN currency TEXT DEFAULT 'VND';
    END IF;
    
    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='status') THEN
        ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending';
        -- Add constraint
        ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
            CHECK (status IN ('pending', 'confirmed', 'in_progress', 'delivered', 'cancelled'));
    END IF;
    
    -- Add notes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='notes') THEN
        ALTER TABLE bookings ADD COLUMN notes TEXT;
    END IF;
    
    -- Add scheduled_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='scheduled_date') THEN
        ALTER TABLE bookings ADD COLUMN scheduled_date DATE;
    END IF;
END $$;

-- 5. Drop and recreate RLS policies with correct column references
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view all campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can create campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campaigns;

DROP POLICY IF EXISTS "Users can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;

-- Recreate policies
-- For now, allow all authenticated users to perform all operations
-- You can refine these later based on your needs

-- Campaigns policies (permissive for development)
CREATE POLICY "Anyone can view campaigns" ON campaigns
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create campaigns" ON campaigns
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update campaigns" ON campaigns
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete campaigns" ON campaigns
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Bookings policies (permissive for development)
CREATE POLICY "Anyone can view bookings" ON bookings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update bookings" ON bookings
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete bookings" ON bookings
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 6. Verify the schema
SELECT 
    'Schema check:' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'campaigns') as campaign_columns,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'bookings') as booking_columns,
    (SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='created_by')) as campaigns_has_created_by,
    (SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='created_by')) as bookings_has_created_by;

-- 7. List all columns for verification
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name IN ('campaigns', 'bookings', 'payments', 'notifications', 'user_profiles')
ORDER BY table_name, ordinal_position;
