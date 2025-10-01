# User Profile Schema Documentation

## Overview
This document describes the updated `user_profiles` table schema that supports comprehensive user profile management including profile pictures, financial information, and authentication data.

## Table Structure

### Table Name: `user_profiles`

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the profile record |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) | Foreign key to Supabase auth users table |
| `username` | VARCHAR(50) | UNIQUE, CHECK constraint | Unique username (3-30 alphanumeric, starts with letter) |
| `full_name` | VARCHAR(100) | - | User's full name |
| `email` | VARCHAR(255) | CHECK constraint | User's email address |
| `profile_picture_url` | TEXT | - | Base64 encoded image or URL to profile picture |
| `provider` | VARCHAR(50) | DEFAULT 'email' | Authentication provider (email, google, etc.) |
| `role` | VARCHAR(20) | DEFAULT 'user' | User role (user, admin, etc.) |
| `is_active` | BOOLEAN | DEFAULT true | Whether the user account is active |
| `email_verified` | BOOLEAN | DEFAULT false | Whether the email has been verified |
| `household_members` | INTEGER | CHECK > 0 | Number of household members |
| `monthly_income` | DECIMAL(12,2) | CHECK >= 0 | Monthly income amount |
| `has_debt` | BOOLEAN | - | Whether the user has debt |
| `debt_amount` | DECIMAL(12,2) | CHECK >= 0 | Total debt amount |
| `savings_goal` | TEXT | - | User savings goal description |
| `primary_expenses` | TEXT[] | DEFAULT '{}' | Array of primary expense categories |
| `budgeting_experience` | VARCHAR(20) | CHECK constraint | Experience level (beginner, intermediate, advanced) |
| `financial_goals` | TEXT[] | DEFAULT '{}' | Array of financial goals |
| `onboarding_completed` | BOOLEAN | DEFAULT false | Whether user has completed onboarding |
| `last_login_at` | TIMESTAMP WITH TIME ZONE | - | Timestamp of last login |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

## Key Features

### 1. Profile Picture Support
- **Column**: `profile_picture_url`
- **Type**: TEXT
- **Storage**: Base64 encoded images or URLs
- **Validation**: Handled in application layer (file type, size limits)
- **Fallback**: Application shows initials when no picture is set

### 2. Financial Profile Data
- **Income Tracking**: Monthly income with decimal precision
- **Debt Management**: Boolean flag and amount tracking
- **Household Information**: Number of household members
- **Goals & Preferences**: Arrays for flexible goal and expense tracking

### 3. Authentication Integration
- **User Reference**: Direct link to Supabase auth.users
- **Provider Tracking**: Support for multiple auth providers
- **Email Verification**: Track verification status
- **Activity Tracking**: Last login timestamps

### 4. Data Validation
- **Username**: Must start with letter, 3-30 alphanumeric characters
- **Email**: Valid email format validation
- **Numeric Fields**: Positive number constraints
- **Enum Values**: Budgeting experience limited to predefined values

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_onboarding ON user_profiles(onboarding_completed);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);
```

## Row Level Security (RLS)

The table uses Supabase RLS to ensure users can only access their own profile data:

```sql
-- Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE USING (auth.uid() = user_id);
```

## Triggers

### Auto-update Timestamp
```sql
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Usage Examples

### Creating a New Profile
```sql
INSERT INTO user_profiles (
    user_id, username, full_name, email, 
    household_members, monthly_income, 
    budgeting_experience, onboarding_completed
) VALUES (
    'user-uuid', 'johndoe', 'John Doe', 'john@example.com',
    2, 5000.00, 'beginner', true
);
```

### Updating Profile Picture
```sql
UPDATE user_profiles 
SET profile_picture_url = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
WHERE user_id = 'user-uuid';
```

### Querying User Profile
```sql
SELECT 
    username, full_name, email, profile_picture_url,
    household_members, monthly_income, budgeting_experience,
    financial_goals, primary_expenses
FROM user_profiles 
WHERE user_id = 'user-uuid';
```

## Migration Instructions

### For New Installations
Run the complete schema file:
```bash
psql -d your_database -f create_user_profiles_table.sql
```

### For Existing Installations
Run the migration script:
```bash
psql -d your_database -f add_profile_picture_migration.sql
```

## Application Integration

### Frontend Components
- **UserProfile.jsx**: Handles profile editing and picture upload
- **ProfileDropdown.jsx**: Displays profile picture in navigation
- **ProfileService.js**: Manages database operations

### Key Functions
- **Profile Picture Upload**: Converts images to base64 for storage
- **Data Validation**: Client-side validation before database operations
- **Error Handling**: Comprehensive error messages for user feedback

## Security Considerations

1. **File Upload Validation**: 
   - File type restrictions (images only)
   - File size limits (5MB maximum)
   - Client and server-side validation

2. **Data Privacy**:
   - RLS policies ensure data isolation
   - Users can only access their own data
   - Sensitive financial data is protected

3. **Input Sanitization**:
   - Username format validation
   - Email format validation
   - Numeric field constraints

## Performance Considerations

1. **Indexing**: Strategic indexes on frequently queried columns
2. **Image Storage**: Base64 encoding for simplicity (consider cloud storage for production)
3. **Array Fields**: PostgreSQL arrays for flexible goal and expense tracking
4. **Caching**: Consider application-level caching for frequently accessed profiles

## Future Enhancements

1. **Cloud Storage**: Move profile pictures to cloud storage (AWS S3, Cloudinary)
2. **Image Processing**: Add image resizing and optimization
3. **Audit Trail**: Track profile changes for compliance
4. **Advanced Validation**: Server-side validation functions
5. **Search Functionality**: Full-text search on profile data







