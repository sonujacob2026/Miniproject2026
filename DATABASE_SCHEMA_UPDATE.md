# Database Schema Update Guide

## 🔧 **Required Database Columns**

To ensure the admin user management works properly, your `user_profiles` table needs these columns:

### **Current Columns (from your screenshot):**
- `id` (uuid) ✅
- `user_id` (uuid) ✅  
- `full_name` (varchar) ✅
- `email` (varchar) ✅

### **Additional Columns Needed:**

```sql
-- Add these columns to your user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

## 📋 **Complete Table Schema**

Your `user_profiles` table should have:

```sql
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    email_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🛠️ **How to Add Missing Columns**

### **Method 1: Using Supabase SQL Editor**

1. **Go to Supabase Dashboard**
2. **Click "SQL Editor"**
3. **Run this SQL:**

```sql
-- Add missing columns
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records with default values
UPDATE public.user_profiles 
SET 
    status = 'active',
    email_confirmed = true,
    created_at = NOW(),
    updated_at = NOW()
WHERE status IS NULL OR email_confirmed IS NULL;
```

### **Method 2: Using Table Editor**

1. **Go to Table Editor → user_profiles**
2. **Click "Add Column" for each missing field:**
   - `phone` (text, optional)
   - `status` (text, default: 'active')
   - `email_confirmed` (boolean, default: false)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

## 🔍 **Verify Your Schema**

After adding columns, verify with:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## 🧪 **Test Database Updates**

1. **Refresh your admin dashboard**
2. **Try editing a user:**
   - Change display name
   - Update phone number
   - Change status
3. **Check console logs** for:
   - `Updating user profile:` (should show the data)
   - `Clean updates to apply:` (should show filtered data)
   - `Successfully updated user profile:` (should show result)

## 🚨 **Common Issues & Solutions**

### **Issue: "Column does not exist"**
- **Solution**: Add the missing column using the SQL above

### **Issue: "Permission denied"**
- **Solution**: Make sure RLS is disabled for user_profiles table

### **Issue: "Update returns empty array"**
- **Solution**: Check that the user ID exists and matches

### **Issue: "Status not updating"**
- **Solution**: Verify the status column exists and has correct data type

## 📊 **Expected Behavior After Schema Update**

1. **Edit User Modal** should save changes to database
2. **Disable/Enable** should update status in database
3. **Status badges** should reflect database values
4. **Console logs** should show successful updates
5. **Changes persist** after page refresh

## 🔄 **Update Triggers (Optional)**

To automatically update `updated_at` timestamp:

```sql
-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

This ensures the `updated_at` field is automatically updated whenever a record is modified.




