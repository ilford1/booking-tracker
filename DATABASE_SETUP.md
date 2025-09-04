# Database Setup Instructions

The app is experiencing errors because the required database tables don't exist yet. Here's how to fix this:

## Quick Fix (Manual Setup)

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard/projects
2. Select your project: `ggwktxmufcjnwgeqllev`
3. Navigate to "SQL Editor" in the left sidebar

### Step 2: Run Schema Migration
1. Copy the contents of `supabase/migrations/001_initial_schema.sql`
2. Paste it into the SQL Editor
3. Click "Run" to create all the required tables

### Step 3: Add Sample Data (Optional)
1. Copy the contents of `supabase/migrations/002_sample_data.sql`
2. Paste it into the SQL Editor
3. Click "Run" to add sample data

### Step 4: Verify Setup
1. Go to "Table Editor" in the Supabase dashboard
2. You should see these tables:
   - `creators` (5 sample creators)
   - `campaigns` (5 sample campaigns)  
   - `bookings` (5 sample bookings)
   - `deliverables` (4 sample deliverables)
   - `payments` (4 sample payments)

### Step 5: Test the App
1. Run `npm run dev` in your terminal
2. Visit http://localhost:3000
3. The dashboard should now load without errors and show real data

## What the Tables Do

- **creators**: Influencer profiles with handles, rates, follower counts
- **campaigns**: Marketing campaigns with budgets and dates
- **bookings**: Connections between creators and campaigns
- **deliverables**: Content items that creators need to produce
- **payments**: Payment tracking for completed bookings

## Sample Data Included

After running the migrations, you'll have:
- 5 influencers (@fashionista_jane, @tech_reviewer, etc.)
- 5 campaigns (Summer Sale, Tech Launch, etc.)
- Various booking statuses (pending, confirmed, posted)
- Payment records (some paid, some pending)

This gives you a realistic dataset to test all app features immediately.

## Alternative Setup

If you prefer to use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize local project
supabase init

# Link to remote project
supabase link --project-ref ggwktxmufcjnwgeqllev

# Run migrations
supabase db push
```

The manual SQL Editor approach is simpler and more reliable for this setup.
