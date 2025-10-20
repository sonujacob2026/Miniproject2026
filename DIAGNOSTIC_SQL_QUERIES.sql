-- ============================================
-- DIAGNOSTIC SQL QUERIES FOR ADMIN STATS ISSUE
-- Run these in Supabase SQL Editor
-- ============================================

-- 1. Check if user_profiles table has data
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as new_users_today
FROM user_profiles;

-- 2. View all user profiles
SELECT 
    user_id,
    email,
    full_name,
    created_at,
    updated_at,
    onboarding_completed
FROM user_profiles
ORDER BY created_at DESC;

-- 3. Check RLS status on user_profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_profiles';

-- 4. Check RLS policies on user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

-- 5. Check if admin user exists in auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'admin@gmail.com';

-- 6. Check expenses table
SELECT 
    COUNT(*) as total_expenses,
    COUNT(DISTINCT user_id) as users_with_expenses,
    SUM(amount) as total_amount
FROM expenses;

-- 7. Check user_profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ============================================
-- QUICK FIXES (if needed)
-- ============================================

-- Fix 1: Disable RLS temporarily (for testing only)
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Fix 2: Create admin policy (if RLS is enabled)
-- CREATE POLICY "Admin can read all profiles"
-- ON user_profiles
-- FOR SELECT
-- TO authenticated
-- USING (
--   (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@gmail.com'
-- );

-- Fix 3: Allow public read access (for testing only - NOT SECURE)
-- CREATE POLICY "Public read access"
-- ON user_profiles
-- FOR SELECT
-- TO anon
-- USING (true);

-- Fix 4: Create admin user in auth (if doesn't exist)
-- This must be done through Supabase Dashboard:
-- Authentication → Users → Add User
-- Email: admin@gmail.com
-- Password: Admin@expenseai2
-- Confirm email: Yes