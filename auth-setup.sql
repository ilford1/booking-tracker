-- Authentication and User Management Schema
-- Run this SQL in your Supabase SQL Editor after the main database-setup.sql

-- Enable RLS on existing tables (if not already enabled)
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create user role enum
CREATE TYPE user_role AS ENUM ('customer', 'service_provider', 'business_admin', 'super_admin');

-- User profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_role user_role DEFAULT 'customer',
  business_id UUID, -- For multi-tenant support (can reference a businesses table later)
  provider_id UUID, -- If user is a service provider, links to their provider record
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    first_name, 
    last_name, 
    phone, 
    user_role,
    email_verified
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'customer')::user_role,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update email verification status
CREATE OR REPLACE FUNCTION handle_user_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.user_profiles 
    SET email_verified = TRUE, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update email verification status
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_email_verified();

-- Create updated_at trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for user_profiles table

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('business_admin', 'super_admin')
    )
  );

-- RLS Policies for existing tables

-- Creators table policies
CREATE POLICY "Anyone can view active creators" ON creators
  FOR SELECT USING (status = 'active');

CREATE POLICY "Service providers can manage their own creator profile" ON creators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND provider_id = creators.id
    )
  );

CREATE POLICY "Admins can manage all creators" ON creators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('business_admin', 'super_admin')
    )
  );

-- Campaigns table policies
CREATE POLICY "Authenticated users can view active campaigns" ON campaigns
  FOR SELECT USING (
    auth.role() = 'authenticated' AND status = 'active'
  );

CREATE POLICY "Admins can manage campaigns" ON campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('business_admin', 'super_admin')
    )
  );

-- Bookings table policies
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (
    -- Customer can see bookings they made
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role = 'customer'
    )
    OR
    -- Service provider can see bookings for their creator profile
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN creators c ON c.id = up.provider_id
      WHERE up.id = auth.uid() 
      AND c.id = bookings.creator_id
      AND up.user_role = 'service_provider'
    )
    OR
    -- Admins can see all bookings
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('business_admin', 'super_admin')
    )
  );

CREATE POLICY "Customers can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('customer', 'business_admin', 'super_admin')
    )
  );

CREATE POLICY "Service providers and admins can update bookings" ON bookings
  FOR UPDATE USING (
    -- Service provider can update their own bookings
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN creators c ON c.id = up.provider_id
      WHERE up.id = auth.uid() 
      AND c.id = bookings.creator_id
      AND up.user_role = 'service_provider'
    )
    OR
    -- Admins can update all bookings
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('business_admin', 'super_admin')
    )
  );

-- Deliverables table policies
CREATE POLICY "Users can view relevant deliverables" ON deliverables
  FOR SELECT USING (
    -- Must be able to see the associated booking
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = deliverables.booking_id
      AND (
        -- Customer can see deliverables for their bookings
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND user_role = 'customer'
        )
        OR
        -- Service provider can see deliverables for their bookings
        EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN creators c ON c.id = up.provider_id
          WHERE up.id = auth.uid() 
          AND c.id = b.creator_id
          AND up.user_role = 'service_provider'
        )
        OR
        -- Admins can see all deliverables
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND user_role IN ('business_admin', 'super_admin')
        )
      )
    )
  );

CREATE POLICY "Service providers can manage their deliverables" ON deliverables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN user_profiles up ON TRUE
      JOIN creators c ON c.id = up.provider_id
      WHERE b.id = deliverables.booking_id
      AND up.id = auth.uid()
      AND c.id = b.creator_id
      AND up.user_role = 'service_provider'
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('business_admin', 'super_admin')
    )
  );

-- Payments table policies
CREATE POLICY "Users can view relevant payments" ON payments
  FOR SELECT USING (
    -- Must be able to see the associated booking
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = payments.booking_id
      AND (
        -- Customer can see payments for their bookings
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND user_role = 'customer'
        )
        OR
        -- Service provider can see payments for their bookings
        EXISTS (
          SELECT 1 FROM user_profiles up
          JOIN creators c ON c.id = up.provider_id
          WHERE up.id = auth.uid() 
          AND c.id = b.creator_id
          AND up.user_role = 'service_provider'
        )
        OR
        -- Admins can see all payments
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND user_role IN ('business_admin', 'super_admin')
        )
      )
    )
  );

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND user_role IN ('business_admin', 'super_admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_role ON user_profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_id ON user_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_provider_id ON user_profiles(provider_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON user_profiles(email_verified);

-- Create a function to get user role (useful for application logic)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS user_role AS $$
DECLARE
  role user_role;
BEGIN
  SELECT user_role INTO role
  FROM user_profiles
  WHERE id = user_id;
  
  RETURN COALESCE(role, 'customer'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has specific permissions
CREATE OR REPLACE FUNCTION user_has_role(required_roles user_role[], user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT user_role INTO user_role_val
  FROM user_profiles
  WHERE id = user_id;
  
  RETURN user_role_val = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert a default super admin user (replace with your actual user ID after first signup)
-- This is commented out - you'll need to manually update a user to super_admin after testing
-- UPDATE user_profiles SET user_role = 'super_admin' WHERE email = 'your-email@example.com';
