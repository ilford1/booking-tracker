# Booking Tracker

A booking management system built with Supabase.

## Setup

1. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update the environment variables with your actual Supabase credentials

2. **Required Environment Variables**
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous/public API key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)
   - `DATABASE_URL`: PostgreSQL connection string

3. **Getting Supabase Credentials**
   - Visit your [Supabase Dashboard](https://app.supabase.com)
   - Go to Settings > API
   - Copy your Project URL and API keys

## Project Structure

```
booking-tracker/
├── .env                 # Environment variables (not committed)
├── .env.example         # Environment template
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Next Steps

- Install your preferred framework (Next.js, React, etc.)
- Set up Supabase client configuration
- Create database schema for bookings
- Implement authentication if needed
