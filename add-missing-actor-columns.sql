-- Migration: Add missing 'actor' columns to all tables
-- This fixes the "Could not find the 'actor' column" error

-- Add actor column to creators table (if not exists)
ALTER TABLE creators 
ADD COLUMN IF NOT EXISTS actor TEXT DEFAULT 'system';

-- Add actor column to campaigns table (if not exists)  
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS actor TEXT DEFAULT 'system';

-- Add actor column to bookings table (if not exists)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS actor TEXT DEFAULT 'system';

-- Add actor column to deliverables table (if not exists)
ALTER TABLE deliverables
ADD COLUMN IF NOT EXISTS actor TEXT DEFAULT 'system';

-- Add actor column to payments table (if not exists) - This is the main fix
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS actor TEXT DEFAULT 'system';

-- Update existing records to have actor = 'system' where NULL
UPDATE creators SET actor = 'system' WHERE actor IS NULL;
UPDATE campaigns SET actor = 'system' WHERE actor IS NULL;  
UPDATE bookings SET actor = 'system' WHERE actor IS NULL;
UPDATE deliverables SET actor = 'system' WHERE actor IS NULL;
UPDATE payments SET actor = 'system' WHERE actor IS NULL;

-- Create indexes on actor columns for better performance
CREATE INDEX IF NOT EXISTS idx_creators_actor ON creators(actor);
CREATE INDEX IF NOT EXISTS idx_campaigns_actor ON campaigns(actor);
CREATE INDEX IF NOT EXISTS idx_bookings_actor ON bookings(actor);
CREATE INDEX IF NOT EXISTS idx_deliverables_actor ON deliverables(actor);
CREATE INDEX IF NOT EXISTS idx_payments_actor ON payments(actor);

-- Refresh PostgREST schema cache to recognize new columns
NOTIFY pgrst, 'reload schema';

-- Verification: Check that actor columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'actor'
AND table_name IN ('creators', 'campaigns', 'bookings', 'deliverables', 'payments')
ORDER BY table_name;

SELECT 'Actor columns added successfully to all tables!' as status;
