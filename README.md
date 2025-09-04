# KOL Booking Tracker

A comprehensive KOL/KOC booking and campaign management system built with Next.js 15 and Supabase.

## 🚀 Live Demo

This application is deployed on Vercel and ready for use by fashion brands to manage their influencer collaborations.

## ✨ Features

- **Dashboard**: Real-time KPIs and activity tracking
- **Creator Management**: Directory with 10+ Vietnamese influencers
- **Campaign Tracking**: Budget management and timeline monitoring  
- **Kanban Workflow**: Visual booking status management
- **Payment Processing**: Track payments and invoices
- **Performance Analytics**: Monitor content metrics and ROI
- **File Management**: Secure asset storage with Supabase Storage

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL + Storage)
- **Deployment**: Vercel
- **Design**: Swiss-functionalism aesthetic

## 🎯 Workflow Support

Complete status tracking for:
- **Bookings**: Prospect → Outreaching → Negotiating → Booked → Content Due → Submitted → Approved → Posted → Reported → Paid → Archived
- **Deliverables**: Planned → Due → Submitted → Revision → Approved → Scheduled → Posted
- **Payments**: Unconfirmed → Pending Invoice → Waiting Payment → Paid → Failed

## 📊 Demo Data

The application includes realistic demo data:
- 10 Vietnamese creators across Instagram, TikTok, and YouTube
- 3 fashion campaigns (Low-Rise Logic Drop, Polka-Dot Swim, Sustainable Beauty)
- Multiple bookings in various workflow stages
- Performance metrics for completed content

## 🔒 Security

- Row Level Security (RLS) enabled
- Public read access, server-only writes
- Environment variables securely managed
- Private file storage with signed URLs

## 💼 Perfect for Fashion Brands

Designed specifically for Vietnamese fashion brands managing KOL collaborations with features like:
- VND currency support
- Local creator profiles
- Campaign budget tracking
- Content deliverable management
- Payment processing workflow

## 🚀 Recent Updates (January 2025)

### ✅ Fixed Issues:
- **Resolved Supabase SSR Integration**: Fixed "TypeError: fetch failed" errors across all pages
- **Next.js 15 Compatibility**: Implemented proper server-side rendering with `@supabase/ssr`
- **Database Schema**: Completed full migration with 8 production-ready tables
- **Action Files**: Updated all server actions to use proper SSR clients

### 🗄️ Database Schema:
- **campaigns** - Marketing campaign management
- **creators** - KOL/influencer profiles
- **bookings** - Campaign-creator relationships
- **deliverables** - Content submissions and tracking
- **payments** - Payment processing and status
- **sendouts** - Product shipment management
- **metrics** - Performance analytics
- **files** - Asset storage and management

### 🔧 Technical Improvements:
- Added proper cookie-based session management
- Implemented Row Level Security (RLS) policies
- Created auto-updating timestamps with triggers
- Added database indexes for optimal performance
- Included sample data for immediate testing

## 🚀 Getting Started

### For Development:
```bash
git clone https://github.com/ilford1/booking-tracker.git
cd booking-tracker
npm install
npm run dev
```

### Database Setup:
1. Create a Supabase project
2. Run the migration script from `database_migration.sql`
3. Update your `.env` file with Supabase credentials
4. Application is ready with sample data!

### Live Demo:
1. Visit the live application
2. Explore the creator directory
3. View campaign progress
4. Check out the Kanban board for booking workflow
5. Review the dashboard for real-time insights

This is a production-ready system that can handle real KOL booking operations from day one.
