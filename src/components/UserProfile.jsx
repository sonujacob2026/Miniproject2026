import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useProfile } from '../context/ProfileContext';
import { useNavigate } from 'react-router-dom';
import UnifiedNavbar from './UnifiedNavbar';
import { 
  User, 
  Lock, 
  Shield, 
  Bell, 
  Settings, 
  Eye, 
  EyeOff,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

const UserProfile = () => {
  const { user, updatePassword } = useSupabaseAuth();
  const { profile, updateProfile, loading, updating } = useProfile();
  const navigate = useNavigate();

  // Active section state
  const [activeSection, setActiveSection] = useState('profile');

  // Profile form states
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    monthly_income: '',
    household_members: '',
    savings_goal: '',
    budgeting_experience: '',
    financial_goals: [],
    debt_amount: ''
  });

  // Password form states
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });

  // Security settings states
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: '30'
  });

  // Notification settings states
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    budgetAlerts: true,
    expenseReminders: true,
    weeklyReports: true
  });

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // UI states
  const [isEditing, setIsEditing] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    profile: false,
    password: false,
    security: false,
    notifications: false
  });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Load profile data
  useEffect(() => {
    if (!loading && profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        monthly_income: profile.monthly_income || '',
        household_members: profile.household_members || '',
        savings_goal: profile.savings_goal || '',
        budgeting_experience: profile.budgeting_experience || '',
        financial_goals: profile.financial_goals || [],
        debt_amount: profile.debt_amount || ''
      });
    }
  }, [profile, loading]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSecurity = localStorage.getItem('security_settings');
    const savedNotifications = localStorage.getItem('notification_settings');
    
    if (savedSecurity) {
      try {
        setSecuritySettings(JSON.parse(savedSecurity));
      } catch (e) {
        console.error('Error loading security settings:', e);
      }
    }
    
    if (savedNotifications) {
      try {
        setNotificationSettings(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Error loading notification settings:', e);
      }
    }
  }, []);

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    if (!checks.length) errors.push('At least 8 characters');
    if (!checks.uppercase) errors.push('One uppercase letter');
    if (!checks.lowercase) errors.push('One lowercase letter');
    if (!checks.number) errors.push('One number');
    if (!checks.special) errors.push('One special character');

    return { isValid: errors.length === 0, errors, checks };
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Handle profile field changes
  const handleProfileChange = (field, value) => {
    let error = '';
    if (field === 'full_name') {
      if (!/^[A-Za-z\s]+$/.test(value)) {
        error = 'Full name must contain only letters and spaces';
      } else if (value.trim().length < 2) {
        error = 'Full name must be at least 2 characters';
      }
    }
    if (['monthly_income', 'debt_amount', 'household_members'].includes(field)) {
      const num = Number(value);
      if (value === '' || isNaN(num)) {
        error = 'This field is required and must be a number';
      } else if (num < 0) {
        error = 'Value cannot be negative';
      }
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  // Handle password field changes
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'newPassword') {
      const validation = validatePassword(value);
      setPasswordErrors(prev => ({ 
        ...prev, 
        newPassword: validation.isValid ? '' : validation.errors.join(', ')
      }));
    }
    
    if (field === 'confirmPassword') {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: value !== passwordData.newPassword ? 'Passwords do not match' : ''
      }));
    }
  };

  // Save profile
  const handleProfileSave = async () => {
    const errors = {};
    if (!/^[A-Za-z\s]+$/.test(profileData.full_name) || profileData.full_name.trim().length < 2) {
      errors.full_name = 'Full name must contain only letters and be at least 2 characters';
    }
    ['monthly_income', 'debt_amount', 'household_members'].forEach(field => {
      const num = Number(profileData[field]);
      if (profileData[field] === '' || isNaN(num)) {
        errors[field] = 'This field is required and must be a number';
      } else if (num < 0) {
        errors[field] = 'Value cannot be negative';
      }
    });
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    try {
      const updates = {
        full_name: profileData.full_name,
        monthly_income: profileData.monthly_income ? parseFloat(profileData.monthly_income) : null,
        household_members: profileData.household_members ? parseInt(profileData.household_members) : null,
        savings_goal: profileData.savings_goal,
        budgeting_experience: profileData.budgeting_experience,
        financial_goals: profileData.financial_goals,
        debt_amount: profileData.debt_amount ? parseFloat(profileData.debt_amount) : null
      };
      const result = await updateProfile(updates);
      if (result.success) {
        setIsEditing(false);
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast(result.error || 'Failed to update profile', 'error');
      }
    } catch (error) {
      showToast('An error occurred while updating profile', 'error');
    }
  };

  // Change password
  const handlePasswordChange_Submit = async () => {
    const errors = {};
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const validation = validatePassword(passwordData.newPassword);
      if (!validation.isValid) {
        errors.newPassword = 'Password does not meet requirements';
      }
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setLoadingStates(prev => ({ ...prev, password: true }));
    try {
      const result = await updatePassword(passwordData.newPassword);
      if (result.success) {
        setPasswordData({ newPassword: '', confirmPassword: '' });
        showToast('Password changed successfully!', 'success');
      } else {
        showToast(result.error || 'Failed to change password', 'error');
      }
    } catch (error) {
      showToast('An error occurred while changing password', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, password: false }));
    }
  };

  // Save security settings
  const handleSecuritySave = async () => {
    setLoadingStates(prev => ({ ...prev, security: true }));
    try {
      localStorage.setItem('security_settings', JSON.stringify(securitySettings));
      showToast('Security settings updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to save security settings', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, security: false }));
    }
  };

  // Save notification settings
  const handleNotificationSave = async () => {
    setLoadingStates(prev => ({ ...prev, notifications: true }));
    try {
      localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
      showToast('Notification settings updated successfully!', 'success');
    } catch (error) {
      showToast('Failed to save notification settings', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, notifications: false }));
    }
  };

  // Render password strength indicator
  const renderPasswordStrength = () => {
    if (!passwordData.newPassword) return null;
    
    const validation = validatePassword(passwordData.newPassword);
    const { checks } = validation;
    
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
        <div className="space-y-1">
          {[
            { key: 'length', label: 'At least 8 characters' },
            { key: 'uppercase', label: 'One uppercase letter (A-Z)' },
            { key: 'lowercase', label: 'One lowercase letter (a-z)' },
            { key: 'number', label: 'One number (0-9)' },
            { key: 'special', label: 'One special character (!@#$...)' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              {checks[key] ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs ${checks[key] ? 'text-green-600' : 'text-gray-600'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Navigation items
  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <UnifiedNavbar 
        showBackButton={true}
        backButtonText="Back to Dashboard"
        backButtonPath="/dashboard"
        backButtonStyle="gradient"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Side Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sticky top-24">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeSection === item.id
                          ? 'bg-green-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12">
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold mb-8 text-gray-800">User Profile</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileData.full_name}
                        onChange={e => handleProfileChange('full_name', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors ${
                          fieldErrors.full_name && isEditing ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {fieldErrors.full_name && isEditing && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.full_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income</label>
                      <input
                        type="number"
                        min="0"
                        value={profileData.monthly_income}
                        onChange={e => handleProfileChange('monthly_income', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors ${
                          fieldErrors.monthly_income && isEditing ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {fieldErrors.monthly_income && isEditing && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.monthly_income}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Household Members</label>
                      <input
                        type="number"
                        min="1"
                        value={profileData.household_members}
                        onChange={e => handleProfileChange('household_members', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors ${
                          fieldErrors.household_members && isEditing ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {fieldErrors.household_members && isEditing && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.household_members}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Savings Goal</label>
                      <input
                        type="text"
                        value={profileData.savings_goal}
                        onChange={e => handleProfileChange('savings_goal', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Budgeting Experience</label>
                      <select
                        value={profileData.budgeting_experience}
                        onChange={e => handleProfileChange('budgeting_experience', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                      >
                        <option value="">Select experience level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Debt Amount</label>
                      <input
                        type="number"
                        min="0"
                        value={profileData.debt_amount}
                        onChange={e => handleProfileChange('debt_amount', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors ${
                          fieldErrors.debt_amount && isEditing ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {fieldErrors.debt_amount && isEditing && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.debt_amount}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex gap-4">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all hover:shadow-lg"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleProfileSave}
                          disabled={updating}
                          className={`px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all hover:shadow-lg ${
                            updating ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {updating ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setFieldErrors({});
                            if (profile) {
                              setProfileData({
                                full_name: profile.full_name || '',
                                email: profile.email || '',
                                monthly_income: profile.monthly_income || '',
                                household_members: profile.household_members || '',
                                savings_goal: profile.savings_goal || '',
                                budgeting_experience: profile.budgeting_experience || '',
                                financial_goals: profile.financial_goals || [],
                                debt_amount: profile.debt_amount || ''
                              });
                            }
                          }}
                          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-md"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Password Section */}
              {activeSection === 'password' && (
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">Change Password</h2>
                  <p className="text-sm text-gray-600 mb-8">Update your password to keep your account secure</p>
                  
                  <div className="max-w-xl space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={e => handlePasswordChange('newPassword', e.target.value)}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12 ${
                            passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {renderPasswordStrength()}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12 ${
                            passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handlePasswordChange_Submit}
                      disabled={loadingStates.password}
                      className={`px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all hover:shadow-lg ${
                        loadingStates.password ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loadingStates.password ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">Security Settings</h2>
                  <p className="text-sm text-gray-600 mb-8">Manage your account security preferences</p>
                  
                  <div className="max-w-xl space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h3 className="font-semibold text-gray-800">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securitySettings.twoFactorEnabled}
                          onChange={e => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h3 className="font-semibold text-gray-800">Login Alerts</h3>
                        <p className="text-sm text-gray-600 mt-1">Get notified of new login attempts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securitySettings.loginAlerts}
                          onChange={e => setSecuritySettings(prev => ({ ...prev, loginAlerts: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-3">Session Timeout</h3>
                      <p className="text-sm text-gray-600 mb-4">Automatically log out after period of inactivity</p>
                      <select
                        value={securitySettings.sessionTimeout}
                        onChange={e => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="never">Never</option>
                      </select>
                    </div>

                    <button
                      onClick={handleSecuritySave}
                      disabled={loadingStates.security}
                      className={`px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all hover:shadow-lg ${
                        loadingStates.security ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loadingStates.security ? 'Saving...' : 'Save Security Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">Notification Settings</h2>
                  <p className="text-sm text-gray-600 mb-8">Choose what notifications you want to receive</p>
                  
                  <div className="max-w-xl space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h3 className="font-semibold text-gray-800">Email Notifications</h3>
                        <p className="text-sm text-gray-600 mt-1">Receive updates via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={e => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h3 className="font-semibold text-gray-800">Push Notifications</h3>
                        <p className="text-sm text-gray-600 mt-1">Receive push notifications on your device</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.pushNotifications}
                          onChange={e => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h3 className="font-semibold text-gray-800">Budget Alerts</h3>
                        <p className="text-sm text-gray-600 mt-1">Get notified when you exceed your budget</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.budgetAlerts}
                          onChange={e => setNotificationSettings(prev => ({ ...prev, budgetAlerts: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h3 className="font-semibold text-gray-800">Expense Reminders</h3>
                        <p className="text-sm text-gray-600 mt-1">Reminders to log your daily expenses</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.expenseReminders}
                          onChange={e => setNotificationSettings(prev => ({ ...prev, expenseReminders: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h3 className="font-semibold text-gray-800">Weekly Reports</h3>
                        <p className="text-sm text-gray-600 mt-1">Receive weekly spending summaries</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.weeklyReports}
                          onChange={e => setNotificationSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <button
                      onClick={handleNotificationSave}
                      disabled={loadingStates.notifications}
                      className={`px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all hover:shadow-lg ${
                        loadingStates.notifications ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {loadingStates.notifications ? 'Saving...' : 'Save Notification Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* Settings Section */}
              {activeSection === 'settings' && (
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">General Settings</h2>
                  <p className="text-sm text-gray-600 mb-8">Manage your application preferences</p>
                  
                  <div className="max-w-xl space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-3">Language</h3>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-3">Currency</h3>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="usd">USD ($)</option>
                        <option value="eur">EUR (€)</option>
                        <option value="gbp">GBP (£)</option>
                        <option value="inr">INR (₹)</option>
                      </select>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-3">Date Format</h3>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                        <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                        <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <button className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all hover:shadow-lg">
                      Save Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-2xl z-50 text-white flex items-center gap-3 animate-slide-up ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
