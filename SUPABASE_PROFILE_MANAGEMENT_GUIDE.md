# Supabase Profile Management Guide

## Overview
This guide provides comprehensive SQL queries and JavaScript examples for managing user profiles in Supabase, including profile picture functionality.

## Files Created

### 1. `supabase_profile_operations.sql`
Contains all the PostgreSQL SQL queries for profile management operations.

### 2. `supabase_profile_examples.js`
Contains JavaScript functions for interacting with Supabase profiles.

### 3. Updated `ProfileService.js`
Enhanced your existing ProfileService with profile picture functionality.

## Key SQL Operations

### Update Profile Picture
```sql
UPDATE user_profiles 
SET 
    profile_picture_url = $1,  -- Base64 string
    updated_at = NOW()
WHERE user_id = $2;
```

### Update Basic Profile Information
```sql
UPDATE user_profiles 
SET 
    full_name = $1,
    username = $2,
    monthly_income = $3,
    household_members = $4,
    savings_goal = $5,
    budgeting_experience = $6,
    updated_at = NOW()
WHERE user_id = $7;
```

### Update Financial Goals (Array)
```sql
UPDATE user_profiles 
SET 
    financial_goals = $1,  -- Array: ['Buy house', 'Save for retirement']
    updated_at = NOW()
WHERE user_id = $2;
```

### Comprehensive Profile Update
```sql
UPDATE user_profiles 
SET 
    full_name = $1,
    username = $2,
    profile_picture_url = $3,
    monthly_income = $4,
    household_members = $5,
    has_debt = $6,
    debt_amount = $7,
    savings_goal = $8,
    primary_expenses = $9,
    budgeting_experience = $10,
    financial_goals = $11,
    updated_at = NOW()
WHERE user_id = $12;
```

## JavaScript Functions

### Update Profile Picture
```javascript
import { supabase } from './lib/supabase';

export const updateProfilePicture = async (userId, base64Image) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        profile_picture_url: base64Image,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Update Complete Profile
```javascript
export const updateCompleteProfile = async (userId, profileData) => {
  try {
    const updateData = {
      full_name: profileData.full_name,
      username: profileData.username,
      profile_picture_url: profileData.profile_picture_url,
      monthly_income: profileData.monthly_income,
      household_members: profileData.household_members,
      has_debt: profileData.has_debt,
      debt_amount: profileData.debt_amount,
      savings_goal: profileData.savings_goal,
      primary_expenses: profileData.primary_expenses,
      budgeting_experience: profileData.budgeting_experience,
      financial_goals: profileData.financial_goals,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## Usage in Your React Components

### In UserProfile.jsx
```javascript
import ProfileService from '../services/profileService';

// Update profile picture
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64String = e.target.result;
    const result = await ProfileService.updateProfilePicture(user.id, base64String);
    
    if (result.success) {
      // Update local state
      setProfileData(prev => ({
        ...prev,
        profile_picture_url: base64String
      }));
    }
  };
  reader.readAsDataURL(file);
};

// Update profile information
const handleProfileSave = async () => {
  const updates = {
    full_name: profileData.full_name,
    username: profileData.username,
    monthly_income: profileData.monthly_income ? parseFloat(profileData.monthly_income) : null,
    household_members: profileData.household_members ? parseInt(profileData.household_members) : null,
    savings_goal: profileData.savings_goal,
    budgeting_experience: profileData.budgeting_experience,
    financial_goals: profileData.financial_goals
  };

  const result = await ProfileService.updateProfile(user.id, updates);
  
  if (result.success) {
    // Handle success
    console.log('Profile updated successfully');
  }
};
```

## Database Schema Requirements

Make sure your `user_profiles` table has these columns:

```sql
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(100),
    email VARCHAR(255),
    profile_picture_url TEXT,  -- For base64 images or URLs
    monthly_income DECIMAL(12,2),
    household_members INTEGER,
    has_debt BOOLEAN,
    debt_amount DECIMAL(12,2),
    savings_goal TEXT,
    primary_expenses TEXT[],
    budgeting_experience VARCHAR(20),
    financial_goals TEXT[],
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS)

Enable RLS and create policies:

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Common Operations

### 1. Upload Profile Picture
```javascript
// Convert file to base64 and upload
const file = event.target.files[0];
const reader = new FileReader();
reader.onload = async (e) => {
  const base64String = e.target.result;
  await ProfileService.updateProfilePicture(user.id, base64String);
};
reader.readAsDataURL(file);
```

### 2. Remove Profile Picture
```javascript
await ProfileService.removeProfilePicture(user.id);
```

### 3. Check Username Availability
```javascript
const result = await ProfileService.checkUsernameAvailability(username);
if (result.success && result.available) {
  // Username is available
}
```

### 4. Update Financial Goals
```javascript
const goals = ['Buy a house', 'Save for retirement', 'Emergency fund'];
await ProfileService.updateProfile(user.id, { financial_goals: goals });
```

## Error Handling

All functions return a consistent response format:

```javascript
{
  success: boolean,
  data?: any,        // Present on success
  error?: string     // Present on failure
}
```

## Best Practices

1. **Always validate input** before sending to database
2. **Use transactions** for multiple related updates
3. **Implement proper error handling** in your UI
4. **Use RLS policies** for security
5. **Optimize image sizes** before storing as base64
6. **Consider using Supabase Storage** for large images instead of base64

## Testing

You can test these operations in the Supabase SQL Editor:

```sql
-- Test profile picture update
UPDATE user_profiles 
SET profile_picture_url = 'data:image/jpeg;base64,test'
WHERE user_id = 'your-user-id';

-- Test profile information update
UPDATE user_profiles 
SET 
    full_name = 'Test User',
    monthly_income = 5000.00
WHERE user_id = 'your-user-id';
```

This guide provides everything you need to implement comprehensive profile management with profile pictures in your Supabase application!







