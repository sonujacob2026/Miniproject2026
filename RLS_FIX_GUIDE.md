# RLS (Row Level Security) Fix Guide

## 🔍 **Problem Identified**
Your Supabase database has **7 RLS policies** enabled that are blocking the frontend from accessing the `user_profiles` table data. This is why you see empty arrays in the console despite having 4 users in your database.

## 🛠️ **Solution Options**

### **Option 1: Quick Fix - Disable RLS for user_profiles (Recommended for Testing)**

1. **Go to your Supabase Dashboard**
2. **Navigate to Table Editor → user_profiles**
3. **Click on the "7 RLS policies" button**
4. **Find the user_profiles table in the list**
5. **Toggle OFF the RLS for user_profiles table**
6. **Save the changes**

### **Option 2: Create Proper RLS Policy (Production Ready)**

If you want to keep RLS enabled, create a policy that allows admin access:

1. **Go to Supabase Dashboard → Authentication → Policies**
2. **Find the user_profiles table**
3. **Add a new policy with this SQL:**

```sql
-- Allow admin users to read all user profiles
CREATE POLICY "Admin can read all user profiles" ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@gmail.com'
  )
);
```

### **Option 3: Use Service Role Key (Advanced)**

If you have a service role key, you can use it for admin operations:

1. **Get your service role key from Supabase Dashboard → Settings → API**
2. **Add it to your environment variables**
3. **Use it for admin operations only**

## 🧪 **Testing the Fix**

After applying any of the above solutions:

1. **Refresh your admin dashboard**
2. **Click "Test DB Access" button**
3. **Check console logs for:**
   - `Success with session approach:` (should show your 4 users)
   - `Fetched profiles from database:` (should show real data)
   - `Transformed users for display:` (should show formatted data)

## 📊 **Expected Results**

After fixing RLS, you should see:
- **eli** (elizabethchacko81@gmail.com)
- **System Admin** (admin@gmail.com) - with Admin badge
- **Sonu Jacob** (sonulittle5@gmail.com)
- **Sonu Jacob** (sonujacob2026@mca.aice.in)

## 🔒 **Security Note**

- **Option 1** (disable RLS) is good for development/testing
- **Option 2** (proper RLS policy) is recommended for production
- **Option 3** (service role) is most secure but requires backend implementation

## 🚨 **If Still Not Working**

If you still get empty results after trying the above:

1. **Check the console logs** from the "Test DB Access" button
2. **Verify the RLS policies** are actually disabled/modified
3. **Try refreshing the page** after making changes
4. **Check if there are any other policies** affecting the table

The issue is definitely RLS-related since your data exists in the database but the frontend can't access it.




