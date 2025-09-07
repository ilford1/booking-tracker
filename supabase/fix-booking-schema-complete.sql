-- Complete fix for booking system database schema
-- This ensures all required columns exist with proper constraints

-- 1. Ensure all required columns exist in bookings table
DO $$ 
BEGIN
    -- Check and add id column if missing (should exist as primary key)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='id') THEN
        ALTER TABLE bookings ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        RAISE NOTICE 'Added id column';
    END IF;

    -- Check and add campaign_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='campaign_id') THEN
        ALTER TABLE bookings ADD COLUMN campaign_id UUID REFERENCES campaigns(id);
        RAISE NOTICE 'Added campaign_id column';
    END IF;

    -- Check and add creator_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='creator_id') THEN
        ALTER TABLE bookings ADD COLUMN creator_id UUID REFERENCES creators(id);
        RAISE NOTICE 'Added creator_id column';
    END IF;

    -- Check and add status column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='status') THEN
        ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
        RAISE NOTICE 'Added status column';
    END IF;

    -- Check and add offer_amount column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='offer_amount') THEN
        ALTER TABLE bookings ADD COLUMN offer_amount DECIMAL(10, 2);
        RAISE NOTICE 'Added offer_amount column';
    END IF;

    -- Check and add agreed_amount column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='agreed_amount') THEN
        ALTER TABLE bookings ADD COLUMN agreed_amount DECIMAL(10, 2);
        RAISE NOTICE 'Added agreed_amount column';
    END IF;

    -- Check and add currency column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='currency') THEN
        ALTER TABLE bookings ADD COLUMN currency TEXT NOT NULL DEFAULT 'VND';
        RAISE NOTICE 'Added currency column';
    END IF;

    -- Check and add contract_url column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='contract_url') THEN
        ALTER TABLE bookings ADD COLUMN contract_url TEXT;
        RAISE NOTICE 'Added contract_url column';
    END IF;

    -- Check and add brief column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='brief') THEN
        ALTER TABLE bookings ADD COLUMN brief TEXT;
        RAISE NOTICE 'Added brief column';
    END IF;

    -- Check and add contact_channel column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='contact_channel') THEN
        ALTER TABLE bookings ADD COLUMN contact_channel TEXT;
        RAISE NOTICE 'Added contact_channel column';
    END IF;

    -- Check and add utm_code column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='utm_code') THEN
        ALTER TABLE bookings ADD COLUMN utm_code TEXT;
        RAISE NOTICE 'Added utm_code column';
    END IF;

    -- Check and add affiliate_code column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='affiliate_code') THEN
        ALTER TABLE bookings ADD COLUMN affiliate_code TEXT;
        RAISE NOTICE 'Added affiliate_code column';
    END IF;

    -- Check and add tracking_number column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tracking_number') THEN
        ALTER TABLE bookings ADD COLUMN tracking_number TEXT;
        RAISE NOTICE 'Added tracking_number column';
    END IF;

    -- Check and add scheduled_date column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='scheduled_date') THEN
        ALTER TABLE bookings ADD COLUMN scheduled_date DATE;
        RAISE NOTICE 'Added scheduled_date column';
    END IF;

    -- Check and add delivered_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='delivered_at') THEN
        ALTER TABLE bookings ADD COLUMN delivered_at TIMESTAMPTZ;
        RAISE NOTICE 'Added delivered_at column';
    END IF;

    -- Check and add created_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='created_at') THEN
        ALTER TABLE bookings ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;

    -- Check and add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='updated_at') THEN
        ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;

END $$;

-- 2. Update status constraint to new flow
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
    RAISE NOTICE 'Added new status constraint with updated flow';

    -- Add contact_channel constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'bookings' AND constraint_name = 'bookings_contact_channel_check') THEN
        ALTER TABLE bookings ADD CONSTRAINT bookings_contact_channel_check 
            CHECK (contact_channel IN ('instagram', 'tiktok', 'email', 'zalo', 'phone', 'other') OR contact_channel IS NULL);
        RAISE NOTICE 'Added contact_channel constraint';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update constraints: %', SQLERRM;
END $$;

-- 3. Update existing bookings with old statuses
DO $$
BEGIN
    -- Update any 'in_process' bookings to 'deal' as closest equivalent
    UPDATE bookings 
    SET status = 'deal', updated_at = NOW() 
    WHERE status = 'in_process';
    
    -- Update any 'canceled' bookings to 'pending'
    UPDATE bookings 
    SET status = 'pending', updated_at = NOW() 
    WHERE status = 'canceled';
    
    RAISE NOTICE 'Updated existing bookings with old statuses';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update existing booking statuses: %', SQLERRM;
END $$;

-- 4. Create useful indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'bookings' AND indexname = 'idx_bookings_status') THEN
        CREATE INDEX idx_bookings_status ON bookings(status);
        RAISE NOTICE 'Created index on status';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'bookings' AND indexname = 'idx_bookings_created_at') THEN
        CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
        RAISE NOTICE 'Created index on created_at';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'bookings' AND indexname = 'idx_bookings_tracking_number') THEN
        CREATE INDEX idx_bookings_tracking_number ON bookings(tracking_number) WHERE tracking_number IS NOT NULL;
        RAISE NOTICE 'Created index on tracking_number';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'bookings' AND indexname = 'idx_bookings_delivered_at') THEN
        CREATE INDEX idx_bookings_delivered_at ON bookings(delivered_at) WHERE delivered_at IS NOT NULL;
        RAISE NOTICE 'Created index on delivered_at';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'bookings' AND indexname = 'idx_bookings_scheduled_date') THEN
        CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date) WHERE scheduled_date IS NOT NULL;
        RAISE NOTICE 'Created index on scheduled_date';
    END IF;
END $$;

-- 5. Create trigger to automatically update updated_at
DO $$
BEGIN
    -- Drop trigger if exists
    DROP TRIGGER IF EXISTS bookings_updated_at_trigger ON bookings;
    
    -- Create trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    
    -- Create trigger
    CREATE TRIGGER bookings_updated_at_trigger
        BEFORE UPDATE ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Created updated_at trigger';
END $$;

-- 6. Verify the schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
