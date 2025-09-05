# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands for Development

### Essential Commands
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# TypeScript type checking
npx tsc --noEmit
```

### Database Operations
```bash
# Run database migrations
# Navigate to Supabase Dashboard → SQL Editor
# First run: database-setup.sql
# Then run: auth-setup.sql

# Generate TypeScript types from Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Testing Specific Features
```bash
# Test authentication flows (manual testing required)
# 1. Start dev server: npm run dev
# 2. Visit http://localhost:3000 (redirects to /landing if not authenticated)
# 3. Test sign up/sign in flows
# 4. Test admin panel access with admin accounts

# Test specific authentication scripts
node debug-auth.mjs
node test-vercel-auth.mjs
```

## High-Level Architecture

### Authentication & Authorization System
This is a **production-grade authentication system** with comprehensive role-based access control:

- **Auth Context** (`src/lib/auth-context.tsx`): Centralized authentication state management with user profiles and roles
- **User Roles**: customer, service_provider, business_admin, super_admin with escalating permissions
- **Route Protection**: Middleware-based protection (`middleware.ts`) with automatic redirects
- **Database Security**: Row Level Security (RLS) policies protecting data at the database level
- **Service Role Client**: Admin operations use elevated permissions via service role key

### Data Architecture Pattern
The application follows a **structured relational model** with clear entity relationships:

```
Auth Layer (Supabase Auth + user_profiles)
├── Core Entities: creators ↔ bookings ↔ campaigns
├── Supporting Entities: deliverables, payments, sendouts
└── Analytics: metrics, files
```

### Server Actions Architecture
Uses **Next.js 15 Server Actions** for all data operations:

- **Actions Directory**: `src/lib/actions/` contains server-side business logic
- **Admin Client Pattern**: All actions use `createAdminClient()` for database operations
- **Automatic Revalidation**: Uses `revalidatePath()` to update UI after mutations
- **Error Handling**: Comprehensive error catching and logging

### Component Architecture
**Three-tier component structure**:

1. **Page Components**: Route-level components with ProtectedRoute wrappers
2. **Feature Components**: Business logic components (dialogs, forms, tables)  
3. **UI Components**: Reusable shadcn/ui components in `src/components/ui/`

### State Management Pattern
**Server-first state management**:

- **Server Actions**: Primary data fetching and mutations
- **Auth Context**: Client-side authentication state only
- **URL State**: Search params for filters and pagination
- **Local State**: Component-level state for UI interactions

## Key Implementation Details

### Authentication Flow
1. **Middleware** (`middleware.ts`) handles route protection and redirects
2. **Auth Context** manages client-side user state with profile data
3. **Protected Routes** use `ProtectedRoute` component with role checking
4. **Database Triggers** automatically create user profiles on signup

### Database Security Model
- **RLS Policies**: Every table has comprehensive row-level security
- **Security Definer Functions**: Prevent infinite recursion in policies
- **Service Role Operations**: Admin functions bypass RLS using service role
- **User Profile Integration**: RLS policies check `user_profiles` table for permissions

### UI/UX Patterns
- **App Shell**: Consistent navigation and layout (`src/components/app-shell.tsx`)
- **Modal System**: Centralized dialogs for CRUD operations
- **Command Palette**: Global search and quick actions
- **Toast Notifications**: Real-time feedback using Sonner
- **Loading States**: Comprehensive loading and error states

### Data Flow Architecture
```
User Interaction → Server Action → Supabase (RLS Check) → UI Revalidation
                ↓
       Toast Notification + Path Revalidation
```

### Critical Environment Variables
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Service Role (Required for Admin Features)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App URLs (Auto-configured for Vercel)
NEXT_PUBLIC_APP_URL=your_app_url
NEXTAUTH_URL=your_app_url
```

## Development Workflows

### Adding New Features
1. **Database**: Add tables/columns to appropriate SQL migration files
2. **Types**: Update `src/types/database.ts` with new type definitions
3. **Server Actions**: Create actions in `src/lib/actions/` for data operations
4. **Components**: Build UI components following existing patterns
5. **RLS Policies**: Add appropriate security policies in SQL

### Working with Authentication
- **User Roles**: Modify roles in `auth-setup.sql` enum and TypeScript types
- **Permissions**: Use `useUserPermissions()` hook for role-based UI
- **Admin Features**: Protect with `canAccessAdminFeatures()` permission check
- **Profile Updates**: Use `updateProfile()` from auth context

### Database Schema Changes
1. **Modify** existing `.sql` files (don't create new migrations)
2. **Test** changes in Supabase SQL Editor first
3. **Update** TypeScript types to match schema changes
4. **Verify** RLS policies still function correctly

### Debugging Common Issues
- **RLS Permission Errors**: Check user role assignments and policy conditions
- **Auth State Issues**: Verify middleware configuration and cookie handling
- **Service Role Errors**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is configured
- **Type Errors**: Regenerate database types after schema changes

## Production Considerations

### Security Checklist
- ✅ RLS enabled on all tables
- ✅ Service role key secured in environment variables
- ✅ User input validation in server actions
- ✅ HTTPS enforced in production
- ✅ Email verification required for new users

### Performance Optimizations
- **Database Indexes**: Key indexes already configured in schema
- **Query Optimization**: Server actions use selective queries with relations
- **Caching**: Next.js automatic caching with strategic revalidation
- **Image Optimization**: Next.js Image component for avatars and media

### Deployment Requirements
1. **Supabase Project**: Configured with database schema and RLS policies
2. **Environment Variables**: All required variables set in deployment platform
3. **Domain Configuration**: Auth redirects configured for production domain
4. **Email Setup**: SMTP configured for production email sending

This application is architected for **enterprise-scale deployment** with comprehensive security, authentication, and data management systems.
