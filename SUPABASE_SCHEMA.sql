-- ============================================
-- 0. FIX: Drop enum types if they exist (conflict resolution)
-- ============================================
DROP TABLE IF EXISTS tokens CASCADE;
DROP TYPE IF EXISTS priority_enum CASCADE;
DROP TYPE IF EXISTS status_enum CASCADE;

-- ============================================
-- 1. Create profiles table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  university_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('Student', 'Staff', 'Admin')),
  assigned_office_ids UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 2. Create offices table
-- ============================================
CREATE TABLE IF NOT EXISTS offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  operating_hours TEXT NOT NULL,
  token_limit INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  prefix TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- 3. Create tokens table - MAIN FIX
-- ============================================
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  token_number TEXT,
  purpose TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Normal', 'Urgent', 'Medical')),
  status TEXT NOT NULL CHECK (status IN ('Waiting', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Waiting',
  is_checked_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  called_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tokens_student_id ON tokens(student_id);
CREATE INDEX IF NOT EXISTS idx_tokens_office_id ON tokens(office_id);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_created_at ON tokens(created_at DESC);

-- ============================================
-- 4. Create notifications table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can read offices" ON offices;
DROP POLICY IF EXISTS "Only admin can insert offices" ON offices;
DROP POLICY IF EXISTS "Only admin can update offices" ON offices;
DROP POLICY IF EXISTS "Only admin can delete offices" ON offices;
DROP POLICY IF EXISTS "Students can read their own tokens" ON tokens;
DROP POLICY IF EXISTS "Staff and Admin can read all tokens" ON tokens;
DROP POLICY IF EXISTS "Students can insert tokens" ON tokens;
DROP POLICY IF EXISTS "Staff and Admin can update tokens in their offices" ON tokens;
DROP POLICY IF EXISTS "Admin can delete tokens" ON tokens;
DROP POLICY IF EXISTS "Any authenticated user can update tokens" ON tokens;
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Profiles RLS - Simplified to avoid recursion
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Offices RLS - Everyone can read
CREATE POLICY "Anyone can read offices"
  ON offices FOR SELECT USING (true);

-- Tokens RLS - SINGLE POLICY: Allow all authenticated users to read all tokens
CREATE POLICY "Authenticated users can read all tokens"
  ON tokens FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tokens"
  ON tokens FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tokens"
  ON tokens FOR UPDATE USING (auth.role() = 'authenticated');

-- Notifications RLS
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT WITH CHECK (true);

-- ============================================
-- 6. Grant access to anon key
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offices TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tokens TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated;

-- ============================================
-- 7. Sample data (optional - for testing)
-- ============================================

-- Delete existing offices first to avoid conflicts
DELETE FROM offices WHERE name IN ('Admin Office', 'Student Services', 'Fee Counter', 'Academic Department');

-- Insert sample offices
INSERT INTO offices (name, operating_hours, token_limit, prefix, is_active) VALUES
  ('Admin Office', '9 AM - 5 PM', 100, 'ADMIN', true),
  ('Student Services', '8 AM - 6 PM', 50, 'STU', true),
  ('Fee Counter', '10 AM - 4 PM', 80, 'FEE', true),
  ('Academic Department', '9 AM - 5 PM', 60, 'ACAD', true);

-- ============================================
-- 8. IMPORTANT: Assign staff to offices
-- ============================================
-- NOTE: You must manually run this after identifying staff user IDs:
-- UPDATE profiles SET assigned_office_ids = ARRAY['<office_id_1>', '<office_id_2>'] 
-- WHERE id = '<staff_user_id>' AND role = 'Staff';

-- Example:
-- Step 1: Get all office IDs
-- SELECT id, name FROM offices;
-- 
-- Step 2: Get staff user IDs
-- SELECT id, full_name, role FROM profiles WHERE role = 'Staff';
--
-- Step 3: Update staff with assigned offices (copy office IDs from step 1)
-- UPDATE profiles 
-- SET assigned_office_ids = ARRAY['<office_id_for_dean>']
-- WHERE id = '<staff_user_id>' AND role = 'Staff';
