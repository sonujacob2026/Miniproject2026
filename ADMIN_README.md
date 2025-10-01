# Admin Portal - ExpenseAI

## Overview
The Admin Portal provides a comprehensive dashboard for managing the ExpenseAI application, including user management, system monitoring, and administrative controls.

## Access Information

### Admin Credentials
- **Email**: `admin@gmail.com`
- **Password**: `Admin@expenseai2`

### Access URL
- **Admin Login**: `http://localhost:5173/admin/login`
- **Admin Dashboard**: `http://localhost:5173/admin/dashboard`

## Features

### 1. Admin Authentication
- Secure login system with predefined admin credentials
- Session management with localStorage
- Automatic redirect to login if not authenticated

### 2. Dashboard Overview
- **User Statistics**: Total users, active users, new users today
- **System Health**: Database status, API server status, storage usage
- **Recent Activity**: Real-time activity feed
- **Quick Actions**: Easy access to common admin tasks

### 3. User Management
- **View All Users**: Complete list of registered users
- **Search & Filter**: Find users by name, email, or status
- **Edit User Profiles**: Update user information and status
- **User Status Management**: Active, Inactive, Pending, Deleted
- **Soft Delete**: Mark users as deleted without permanent removal

### 4. System Settings
- Application configuration
- Security settings
- Session timeout management
- Two-factor authentication options

## Navigation

### From Main App
1. Click on your profile dropdown (top right)
2. Select "Admin Portal" from the dropdown menu
3. Enter admin credentials when prompted

### Direct Access
- Navigate directly to `/admin/login`
- Enter credentials: `admin@gmail.com` / `Admin@expenseai2`

## Security Features

- **Secure Authentication**: Admin credentials are hardcoded for security
- **Session Management**: Automatic logout on browser close
- **Access Control**: Only authenticated admins can access dashboard
- **Activity Logging**: All admin actions are logged (ready for implementation)

## Technical Implementation

### Components Created
- `AdminContext.jsx` - Admin authentication and state management
- `AdminLogin.jsx` - Admin login page with beautiful UI
- `AdminDashboard.jsx` - Main admin dashboard with navigation
- `AdminStats.jsx` - Statistics and overview cards
- `UserManagement.jsx` - Complete user management interface

### Styling
- Matches existing ExpenseAI design aesthetic
- Uses Tailwind CSS for consistent styling
- Responsive design for all screen sizes
- Beautiful gradient backgrounds and modern UI elements

### Integration
- Seamlessly integrated with existing React Router
- Uses existing Supabase connection for user data
- Maintains consistent navigation with main app

## Usage Instructions

### Managing Users
1. Navigate to "User Management" tab
2. Use search bar to find specific users
3. Filter by status (Active, Inactive, etc.)
4. Click "Edit" to modify user information
5. Click "Delete" to soft-delete users

### Viewing Statistics
1. Dashboard overview shows key metrics
2. Real-time user counts and activity
3. System health monitoring
4. Recent activity feed

### System Configuration
1. Go to "Settings" tab
2. Modify application settings
3. Configure security options
4. Set session timeouts

## Development Notes

### Adding New Features
- Extend `AdminContext.jsx` for new functionality
- Add new components in `/components/` directory
- Update routing in `App.jsx` for new admin pages
- Maintain consistent styling with existing design

### Database Integration
- Uses Supabase for user data retrieval
- Implements proper error handling
- Ready for additional database operations

### Security Considerations
- Admin credentials should be moved to environment variables in production
- Implement proper logging for audit trails
- Add role-based access control for multiple admin levels
- Consider implementing 2FA for enhanced security

## Future Enhancements

- [ ] User activity logs and analytics
- [ ] Bulk user operations
- [ ] Email management and notifications
- [ ] System backup and restore
- [ ] Advanced reporting and insights
- [ ] Multi-admin support with role management
- [ ] API rate limiting and monitoring
- [ ] Database maintenance tools

## Support

For technical support or questions about the admin portal, please refer to the main application documentation or contact the development team.
