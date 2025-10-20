import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import ExpenseCategoriesManager from './ExpenseCategoriesManager';

const SystemSettings = () => {
  const { adminUser } = useAdmin();
  const [settings, setSettings] = useState({
    application_name: 'ExpenseAI',
    version: '1.0.0',
    two_factor_enabled: false,
    session_timeout: 30,
    password_change_required: false,
    email_change_required: false
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load settings from admin_change table
      const { data: adminSettings, error } = await supabase
        .from('admin_change')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading settings:', error);
        // Use default settings if no data found
        setSettings({
          application_name: 'ExpenseAI',
          version: '1.0.0',
          two_factor_enabled: false,
          session_timeout: 30,
          password_change_required: false,
          email_change_required: false
        });
      } else if (adminSettings && adminSettings.length > 0) {
        setSettings(adminSettings[0]);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updatedSettings) => {
    try {
      const { data, error } = await supabase
        .from('admin_change')
        .upsert({
          ...updatedSettings,
          updated_at: new Date().toISOString(),
          updated_by: adminUser?.email || 'admin@gmail.com'
        });

      if (error) {
        console.error('Error saving settings:', error);
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to save settings: ' + error.message,
          confirmButtonText: 'OK'
        });
        return false;
      }

      console.log('Settings saved successfully:', data);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      const { getSwal } = await import('../lib/swal');
      const Swal = await getSwal();
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error saving settings: ' + error.message,
        confirmButtonText: 'OK'
      });
      return false;
    }
  };

  const startEditAll = () => {
    setIsEditing(true);
    setFormData({
      application_name: settings.application_name,
      version: settings.version,
      two_factor_enabled: settings.two_factor_enabled,
      session_timeout: settings.session_timeout
    });
  };

  const cancelEditAll = () => {
    setIsEditing(false);
    setFormData({});
  };

  const saveAll = async () => {
    const updated = { ...settings, ...formData };
    const ok = await saveSettings(updated);
    if (ok) {
      setSettings(updated);
      setIsEditing(false);
      const { getSwal } = await import('../lib/swal');
      const Swal = await getSwal();
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Settings updated successfully!',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleEdit = (field) => {
    setEditing({ ...editing, [field]: true });
    setFormData({ ...formData, [field]: settings[field] });
  };

  const handleSave = async (field) => {
    try {
      const updatedSettings = { ...settings, [field]: formData[field] };
      const success = await saveSettings(updatedSettings);
      
      if (success) {
        setSettings(updatedSettings);
        setEditing({ ...editing, [field]: false });
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Setting updated successfully!',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      const { getSwal } = await import('../lib/swal');
      const Swal = await getSwal();
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error saving setting: ' + error.message,
        confirmButtonText: 'OK'
      });
    }
  };

  const handleCancel = (field) => {
    setEditing({ ...editing, [field]: false });
    setFormData({ ...formData, [field]: settings[field] });
  };

  // Password validation functions
  const validatePassword = (password) => {
    const errors = {};
    
    if (!password) {
      errors.password = 'Password is required';
      return errors;
    }

    if (password.length < 8) {
      errors.length = 'Password must be at least 8 characters long';
    }

    if (!/[A-Z]/.test(password)) {
      errors.uppercase = 'Password must contain at least one uppercase letter';
    }

    if (!/[a-z]/.test(password)) {
      errors.lowercase = 'Password must contain at least one lowercase letter';
    }

    if (!/\d/.test(password)) {
      errors.number = 'Password must contain at least one number';
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.special = 'Password must contain at least one special character';
    }

    return errors;
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    // Validate new password
    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (Object.keys(passwordValidation).length > 0) {
      errors.newPassword = passwordValidation;
    }

    // Validate password confirmation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordForm({ ...passwordForm, [field]: value });
    
    // Clear errors when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors({ ...passwordErrors, [field]: null });
    }

    // Real-time validation for new password
    if (field === 'newPassword') {
      const validation = validatePassword(value);
      if (Object.keys(validation).length > 0) {
        setPasswordErrors({ ...passwordErrors, newPassword: validation });
      } else {
        setPasswordErrors({ ...passwordErrors, newPassword: null });
      }
    }
  };

  const handleToggle2FA = async () => {
    try {
      const newValue = !settings.two_factor_enabled;
      const updatedSettings = { ...settings, two_factor_enabled: newValue };
      const success = await saveSettings(updatedSettings);
      
      if (success) {
        setSettings(updatedSettings);
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        await Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: `Two-Factor Authentication ${newValue ? 'enabled' : 'disabled'} successfully!`
        });
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      const { getSwal } = await import('../lib/swal');
      const Swal = await getSwal();
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error updating 2FA setting: ' + error.message,
        confirmButtonText: 'OK'
      });
    }
  };

  const handlePasswordChange = async () => {
    try {
      // Validate the form
      const validationErrors = validatePasswordForm();
      
      if (Object.keys(validationErrors).length > 0) {
        setPasswordErrors(validationErrors);
        
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        
        // Create error message from validation errors
        let errorMessage = 'Please fix the following errors:\n';
        if (validationErrors.newPassword) {
          const passwordErrors = validationErrors.newPassword;
          Object.values(passwordErrors).forEach(error => {
            errorMessage += `• ${error}\n`;
          });
        }
        if (validationErrors.confirmPassword) {
          errorMessage += `• ${validationErrors.confirmPassword}\n`;
        }
        
        await Swal.fire({
          icon: 'error',
          title: 'Validation Error',
          text: errorMessage.trim(),
          confirmButtonText: 'OK'
        });
        return;
      }

      // Show confirmation dialog
      const { getSwal } = await import('../lib/swal');
      const Swal = await getSwal();
      
      const result = await Swal.fire({
        title: 'Change Password?',
        text: 'Are you sure you want to change your password?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#7c3aed',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, change it!',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) {
        return;
      }

      // Show loading
      Swal.fire({
        title: 'Changing Password...',
        text: 'Please wait while we update your password',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update password: ' + updateError.message,
          confirmButtonText: 'OK'
        });
        return;
      }

      // Save password change record
      const success = await saveSettings({
        ...settings,
        password_change_required: false,
        last_password_change: new Date().toISOString()
      });

      if (success) {
        setShowPasswordModal(false);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
        setPasswordErrors({});
        
        await Swal.fire({
          icon: 'success',
          title: 'Password Changed!',
          text: 'Your password has been updated successfully.',
          confirmButtonText: 'OK'
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to save password change record.',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const { getSwal } = await import('../lib/swal');
      const Swal = await getSwal();
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred: ' + error.message,
        confirmButtonText: 'OK'
      });
    }
  };

  

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'general', name: 'General Settings', icon: '⚙️' },
    { id: 'categories', name: 'Expense Categories', icon: '📂' },
    { id: 'security', name: 'Security', icon: '🔒' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">Manage application and security preferences</p>
          </div>
          {activeSection === 'general' && (
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button onClick={startEditAll} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Edit</button>
              ) : (
                <>
                  <button onClick={saveAll} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save</button>
                  <button onClick={cancelEditAll} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Cancel</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Section Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeSection === section.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active section */}
        {activeSection === 'general' && (
          <>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Application Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Application Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.application_name}
                onChange={(e) => setFormData({ ...formData, application_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="px-3 py-2 rounded-lg bg-gray-50 text-gray-900">{settings.application_name}</div>
            )}
          </div>

          {/* Version */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Version</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <div className="px-3 py-2 rounded-lg bg-gray-50 text-gray-900">{settings.version}</div>
            )}
          </div>

          {/* Two Factor */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Two-Factor Authentication</label>
            {isEditing ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, two_factor_enabled: !formData.two_factor_enabled })}
                  className={`px-4 py-2 rounded-lg text-white ${formData.two_factor_enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {formData.two_factor_enabled ? 'Disable' : 'Enable'}
                </button>
                <span className={`text-sm ${formData.two_factor_enabled ? 'text-red-600' : 'text-green-600'}`}>
                  {formData.two_factor_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ) : (
              <div className={`px-3 py-2 rounded-lg w-fit ${settings.two_factor_enabled ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {settings.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </div>
            )}
          </div>

          {/* Session Timeout */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Session Timeout</label>
            {isEditing ? (
              <select
                value={formData.session_timeout}
                onChange={(e) => setFormData({ ...formData, session_timeout: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={480}>8 hours</option>
              </select>
            ) : (
              <div className="px-3 py-2 rounded-lg bg-gray-50 text-gray-900">{settings.session_timeout} minutes</div>
            )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-8 border-t pt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Change Password
            </button>
            
          </div>
          </>
        )}

        {/* Expense Categories Section */}
        {activeSection === 'categories' && (
          <div className="mt-6">
            <ExpenseCategoriesManager />
          </div>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (
          <div className="mt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Security Settings
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Security settings are managed through the General Settings tab above.</p>
                    <p className="mt-1">You can configure Two-Factor Authentication, session timeouts, and password policies there.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                />
                
                {/* Password validation feedback */}
                {passwordForm.newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs flex items-center ${
                      passwordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className="mr-1">{passwordForm.newPassword.length >= 8 ? '✓' : '✗'}</span>
                      At least 8 characters
                    </div>
                    <div className={`text-xs flex items-center ${
                      /[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className="mr-1">{/[A-Z]/.test(passwordForm.newPassword) ? '✓' : '✗'}</span>
                      One uppercase letter
                    </div>
                    <div className={`text-xs flex items-center ${
                      /[a-z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className="mr-1">{/[a-z]/.test(passwordForm.newPassword) ? '✓' : '✗'}</span>
                      One lowercase letter
                    </div>
                    <div className={`text-xs flex items-center ${
                      /\d/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className="mr-1">{/\d/.test(passwordForm.newPassword) ? '✓' : '✗'}</span>
                      One number
                    </div>
                    <div className={`text-xs flex items-center ${
                      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className="mr-1">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword) ? '✓' : '✗'}</span>
                      One special character
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm new password"
                />
                
                {/* Password match feedback */}
                {passwordForm.confirmPassword && (
                  <div className={`text-xs mt-1 flex items-center ${
                    passwordForm.newPassword === passwordForm.confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="mr-1">{passwordForm.newPassword === passwordForm.confirmPassword ? '✓' : '✗'}</span>
                    {passwordForm.newPassword === passwordForm.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ newPassword: '', confirmPassword: '' });
                  setPasswordErrors({});
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!passwordForm.newPassword || !passwordForm.confirmPassword || Object.keys(passwordErrors).length > 0}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default SystemSettings;
