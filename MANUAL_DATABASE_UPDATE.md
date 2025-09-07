# Manual Database Schema Update

## Required Database Changes

Since the MCP tools aren't responding, you'll need to apply these changes manually in your Supabase SQL Editor:

### 1. Update Bookings Table Schema

```sql
-- Add deadline column
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deadline DATE;

-- Add actor column for staff ownership  
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actor UUID REFERENCES auth.users(id);

-- Remove brief column (optional - for simplified workflow)
ALTER TABLE bookings DROP COLUMN IF EXISTS brief;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_deadline ON bookings(deadline);
CREATE INDEX IF NOT EXISTS idx_bookings_actor ON bookings(actor);
```

### 2. Migrate Existing Data (if needed)

```sql
-- If you have existing data with scheduled_date, copy it to deadline
UPDATE bookings 
SET deadline = scheduled_date 
WHERE deadline IS NULL AND scheduled_date IS NOT NULL;

-- If you have existing created_by data, copy it to actor
UPDATE bookings 
SET actor = created_by 
WHERE actor IS NULL AND created_by IS NOT NULL;
```

### 3. Update RLS Policies (if needed)

```sql
-- Allow users to see bookings they're assigned to
CREATE POLICY "Users can view assigned bookings" ON bookings
    FOR SELECT USING (auth.uid() = actor OR auth.uid() = created_by);

-- Allow users to update bookings they're assigned to  
CREATE POLICY "Users can update assigned bookings" ON bookings
    FOR UPDATE USING (auth.uid() = actor OR auth.uid() = created_by);
```

### 4. Ensure User Profiles Table Exists

```sql
-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_role TEXT NOT NULL DEFAULT 'customer' CHECK (user_role IN ('customer', 'service_provider', 'business_admin', 'super_admin')),
    business_id UUID NULL,
    provider_id UUID NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_role ON user_profiles(user_role);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

## What Each Column Does

- **`deadline`**: Optional date when the booking should be completed (replaces `scheduled_date`)
- **`actor`**: UUID reference to the user who owns/is responsible for the booking
- **`brief`**: Removed to simplify the workflow (you can skip dropping this if you want to keep it)

## UI Changes Made

1. ✅ **Table View**: Updated to show "Deadline" instead of "Brief"
2. ✅ **Kanban Cards**: Now show deadline information and pull rates from creator data
3. ✅ **Rate Display**: Prioritizes booking data, falls back to creator rate_card data
4. ✅ **Staff Filtering**: Added dropdown to filter bookings by staff member  
5. ✅ **Admin Controls**: Added section in booking form for admins to reassign ownership
6. ✅ **Staff Workload Widget**: Dashboard widget showing distribution per staff member

## How to Apply

1. Copy the SQL commands above
2. Go to your Supabase Dashboard
3. Navigate to SQL Editor
4. Paste and run each section
5. Refresh your booking tracker application

## After Database Update

Once you apply the database changes:

1. **Staff Responsibility Tracking** will work fully
2. **Booking ownership** can be assigned and reassigned by admins
3. **Staff filtering** will show bookings by staff member
4. **Workload dashboard** will display team performance metrics
5. **Deadline tracking** will replace the old scheduled_date field

Your application should then show the updated table structure with deadline columns and staff information.
