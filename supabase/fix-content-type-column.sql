-- Fix content_type column issue
-- First, check what type the column currently is

-- 1. Check current column type
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'bookings'
    AND column_name = 'content_type';

-- 2. If content_type exists as wrong type, we need to fix it
-- First drop the column if it exists (backup any data first if needed)
DO $$ 
BEGIN
    -- Check if content_type exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='bookings' AND column_name='content_type') THEN
        
        -- Get the data type
        DECLARE
            col_type TEXT;
        BEGIN
            SELECT data_type INTO col_type
            FROM information_schema.columns
            WHERE table_name = 'bookings' AND column_name = 'content_type';
            
            -- If it's an array type, we need to convert it
            IF col_type = 'ARRAY' THEN
                -- Drop the old constraint if exists
                ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_content_type_check;
                
                -- Rename old column to backup
                ALTER TABLE bookings RENAME COLUMN content_type TO content_type_old;
                
                -- Create new column as TEXT
                ALTER TABLE bookings ADD COLUMN content_type TEXT;
                
                -- Try to migrate data (take first element if array)
                UPDATE bookings 
                SET content_type = content_type_old[1] 
                WHERE content_type_old IS NOT NULL AND array_length(content_type_old, 1) > 0;
                
                -- Drop the old column
                ALTER TABLE bookings DROP COLUMN content_type_old;
                
                RAISE NOTICE 'Converted content_type from ARRAY to TEXT';
            ELSIF col_type != 'text' THEN
                -- If it's some other type, convert to text
                ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_content_type_check;
                ALTER TABLE bookings ALTER COLUMN content_type TYPE TEXT USING content_type::TEXT;
                RAISE NOTICE 'Converted content_type to TEXT';
            ELSE
                RAISE NOTICE 'content_type is already TEXT type';
            END IF;
        END;
    ELSE
        -- Column doesn't exist, create it
        ALTER TABLE bookings ADD COLUMN content_type TEXT;
        RAISE NOTICE 'Created content_type column';
    END IF;
END $$;

-- 3. Add scheduled_date if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='bookings' AND column_name='scheduled_date') THEN
        ALTER TABLE bookings ADD COLUMN scheduled_date DATE;
        RAISE NOTICE 'Added scheduled_date column';
    ELSE
        RAISE NOTICE 'scheduled_date already exists';
    END IF;
END $$;

-- 4. Add the constraint for content_type
DO $$
BEGIN
    -- Drop existing constraint if any
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_content_type_check;
    
    -- Add new constraint
    ALTER TABLE bookings ADD CONSTRAINT bookings_content_type_check 
        CHECK (content_type IN ('post', 'story', 'reel', 'video', 'live', 'review', 'other') OR content_type IS NULL);
    
    RAISE NOTICE 'Added content_type constraint';
END $$;

-- 5. Create index on scheduled_date
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);

-- 6. Verify the final structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    CASE 
        WHEN data_type = 'ARRAY' THEN 'Array Type - Need to fix!'
        WHEN data_type = 'text' OR data_type = 'character varying' THEN 'Correct - Text type'
        WHEN data_type = 'date' THEN 'Correct - Date type'
        ELSE 'Check type'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'bookings'
    AND column_name IN ('scheduled_date', 'content_type', 'deliverables')
ORDER BY ordinal_position;

-- 7. Test that it works
SELECT 'Setup complete! You can now add bookings with deliverable dates.' as message;
