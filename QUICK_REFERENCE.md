# User Profile - Quick Reference Guide

## 🚀 Quick Start

1. **Navigate to Profile**: Click profile icon or go to `/profile`
2. **Choose Section**: Click any item in the sidebar
3. **Make Changes**: Edit fields or toggle settings
4. **Save**: Click the save button
5. **Done**: See success notification

## 📋 Sections Overview

### 1. 👤 Profile
**What it does**: Edit your personal information

**Fields:**
- Full Name (letters only, min 2 chars)
- Email (read-only)
- Monthly Income (positive number)
- Household Members (positive number)
- Savings Goal (text)
- Budgeting Experience (dropdown)
- Debt Amount (non-negative number)

**Actions:**
- Click "Edit Profile" to enable editing
- Click "Save Changes" to save
- Click "Cancel" to discard changes

---

### 2. 🔒 Change Password
**What it does**: Update your account password securely

**Requirements:**
- ✅ 8+ characters
- ✅ 1 uppercase letter
- ✅ 1 lowercase letter
- ✅ 1 number
- ✅ 1 special character

**Features:**
- 👁️ Show/hide password buttons
- ✅ Real-time strength indicator
- 🔄 Password match validation

**Steps:**
1. Enter current password
2. Enter new password (watch checklist)
3. Confirm new password
4. Click "Change Password"

---

### 3. 🛡️ Security
**What it does**: Manage account security settings

**Options:**
- **2FA**: Two-factor authentication (toggle)
- **Login Alerts**: Get notified of new logins (toggle)
- **Session Timeout**: Auto-logout timer (dropdown)
  - 15 minutes
  - 30 minutes
  - 1 hour
  - 2 hours
  - Never

**Note**: Settings save to localStorage

---

### 4. 🔔 Notifications
**What it does**: Control what notifications you receive

**Options:**
- **Email Notifications**: Updates via email
- **Push Notifications**: Browser notifications
- **Budget Alerts**: When you exceed budget
- **Expense Reminders**: Daily expense logging reminders
- **Weekly Reports**: Weekly spending summaries

**All toggles**: ON/OFF switches

---

### 5. ⚙️ Settings
**What it does**: Configure app preferences

**Options:**
- **Language**: English, Spanish, French, German
- **Currency**: USD, EUR, GBP, INR
- **Date Format**: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD

---

## 🎯 Common Tasks

### Change Your Name
1. Go to Profile section
2. Click "Edit Profile"
3. Update "Full Name" field
4. Click "Save Changes"

### Update Password
1. Go to "Change Password" section
2. Fill in all three fields
3. Ensure all checkmarks are green
4. Click "Change Password"

### Enable 2FA
1. Go to "Security" section
2. Toggle "Two-Factor Authentication" to ON
3. Click "Save Security Settings"

### Turn Off Email Notifications
1. Go to "Notifications" section
2. Toggle "Email Notifications" to OFF
3. Click "Save Notification Settings"

---

## ⚠️ Validation Rules

### Full Name
- ✅ Letters and spaces only
- ✅ Minimum 2 characters
- ❌ No numbers or special characters

### Monthly Income
- ✅ Positive numbers only
- ❌ No negative values
- ❌ No text

### Household Members
- ✅ Positive integers only
- ❌ No decimals
- ❌ No negative values

### Debt Amount
- ✅ Non-negative numbers
- ✅ Can be zero
- ❌ No negative values

### Password
- ✅ 8+ characters
- ✅ Mix of upper/lowercase
- ✅ At least 1 number
- ✅ At least 1 special char
- ❌ Cannot be too simple

---

## 🎨 Visual Indicators

### Colors
- 🟢 **Green**: Success, valid, active
- 🔴 **Red**: Error, invalid
- ⚪ **Gray**: Inactive, disabled
- 🔵 **Blue**: Info (if used)

### Icons
- ✅ **Checkmark**: Requirement met
- ❌ **X Mark**: Requirement not met
- 👁️ **Eye**: Show password
- 👁️‍🗨️ **Eye Slash**: Hide password
- ⚠️ **Alert**: Error message

### Borders
- **Green**: Valid input (on focus)
- **Red**: Invalid input
- **Gray**: Normal state

---

## 💡 Tips & Tricks

### Password Creation
- Use a passphrase: "MyDog@Home2024!"
- Mix words with numbers and symbols
- Avoid common patterns (123, abc, etc.)
- Don't use personal info

### Form Editing
- Watch for red borders (errors)
- Read error messages carefully
- All required fields must be filled
- Cancel button discards changes

### Settings Management
- Settings save automatically to browser
- Refresh page to verify persistence
- Clear browser data will reset settings
- Export settings before clearing cache

### Mobile Usage
- Sidebar becomes horizontal menu
- Scroll to see all options
- Touch-friendly toggle switches
- Optimized for small screens

---

## 🔧 Troubleshooting

### "Cannot save profile"
- Check all fields are valid (no red borders)
- Ensure you're logged in
- Check internet connection
- Try refreshing the page

### "Password change failed"
- Verify current password is correct
- Ensure new password meets all requirements
- Check that passwords match
- Try logging out and back in

### "Settings not saving"
- Check browser allows localStorage
- Disable private/incognito mode
- Clear browser cache and try again
- Check browser console for errors

### "Page not loading"
- Refresh the page (F5)
- Clear browser cache
- Check internet connection
- Try different browser

---

## ⌨️ Keyboard Shortcuts

- **Tab**: Move to next field
- **Shift+Tab**: Move to previous field
- **Enter**: Submit form (when focused on button)
- **Esc**: Cancel editing (if implemented)
- **F5**: Refresh page

---

## 📱 Mobile Gestures

- **Tap**: Select/toggle
- **Swipe**: Scroll content
- **Pinch**: Zoom (if enabled)
- **Long press**: Context menu (browser default)

---

## 🔐 Security Best Practices

1. **Use Strong Passwords**
   - 12+ characters recommended
   - Mix of all character types
   - Unique for each account

2. **Enable 2FA**
   - Extra layer of security
   - Protects against password theft

3. **Regular Updates**
   - Change password every 3-6 months
   - Review security settings monthly

4. **Monitor Activity**
   - Enable login alerts
   - Check for suspicious activity
   - Report unauthorized access

5. **Secure Your Device**
   - Use device lock screen
   - Keep software updated
   - Use antivirus software

---

## 📊 Data Storage

### What's Stored Where

**Database (Supabase):**
- Profile information
- User credentials
- Account data

**localStorage (Browser):**
- Security settings
- Notification preferences
- UI preferences
- Session data

**Not Stored:**
- Current passwords (never stored in plain text)
- Temporary form data
- Validation states

---

## 🆘 Need Help?

### Common Questions

**Q: Can I change my email?**
A: No, email is tied to your account and cannot be changed for security reasons.

**Q: How do I delete my account?**
A: Contact support (feature coming soon).

**Q: Are my settings synced across devices?**
A: Currently, settings are stored locally. Cross-device sync coming soon.

**Q: What happens if I forget my password?**
A: Use the "Forgot Password" link on the login page.

**Q: Is 2FA really enabled?**
A: The toggle is UI-only. Full 2FA implementation requires backend setup.

---

## 📞 Support Contacts

- **Email**: support@expenseai.com (if available)
- **Documentation**: Check USER_PROFILE_FEATURES.md
- **Issues**: Report bugs via GitHub (if applicable)
- **Community**: Join our Discord/Slack (if available)

---

## 🎓 Learning Resources

1. **USER_PROFILE_FEATURES.md**: Comprehensive feature documentation
2. **PROFILE_LAYOUT_GUIDE.md**: Visual layout and design guide
3. **VISUAL_COMPARISON.md**: Before/after comparison
4. **PROFILE_UPDATE_SUMMARY.md**: Technical implementation details

---

**Last Updated**: 2025-01-07  
**Version**: 1.0.0  
**Status**: ✅ Production Ready