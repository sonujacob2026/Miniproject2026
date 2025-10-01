import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';

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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailForm, setEmailForm] = useState({
    currentEmail: '',
    newEmail: '',
    confirmEmail: ''
  });

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
        alert('Failed to save settings: ' + error.message);
        return false;
      }

      console.log('Settings saved successfully:', data);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings: ' + error.message);
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
      alert('Settings updated successfully!');
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
        alert('Setting updated successfully!');
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      alert('Error saving setting: ' + error.message);
    }
  };

  const handleCancel = (field) => {
    setEditing({ ...editing, [field]: false });
    setFormData({ ...formData, [field]: settings[field] });
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
      alert('Error updating 2FA setting: ' + error.message);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        alert('New passwords do not match!');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
      }

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) {
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        await Swal.fire({ icon: 'error', title: 'Error', text: 'Error updating password: ' + updateError.message });
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
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        await Swal.fire({ icon: 'success', title: 'Success', text: 'Password changed successfully!' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const { getSwal } = await import('../lib/swal');
      const Swal = await getSwal();
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Error changing password: ' + error.message });
    }
  };

  const handleEmailChange = async () => {
    try {
      if (emailForm.newEmail !== emailForm.confirmEmail) {
        alert('New emails do not match!');
        return;
      }

      // Update email in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        email: emailForm.newEmail
      });

      if (updateError) {
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        await Swal.fire({ icon: 'error', title: 'Error', text: 'Error updating email: ' + updateError.message });
        return;
      }

      // Save email change record
      const success = await saveSettings({
        ...settings,
        email_change_required: false,
        last_email_change: new Date().toISOString()
      });

      if (success) {
        setShowEmailModal(false);
        setEmailForm({ currentEmail: '', newEmail: '', confirmEmail: '' });
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        await Swal.fire({ icon: 'success', title: 'Success', text: 'Email changed successfully! Please verify your new email.' });
      }
    } catch (error) {
      console.error('Error changing email:', error);
      const { getSwal } = await import('../lib/swal');
      const Swal = await getSwal();
      await Swal.fire({ icon: 'error', title: 'Error', text: 'Error changing email: ' + error.message });
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">Manage application and security preferences</p>
          </div>
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
        </div>

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
          <button
            onClick={() => setShowEmailModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Change Email
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Change Email</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email
                </label>
                <input
                  type="email"
                  value={emailForm.currentEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, currentEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email
                </label>
                <input
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Email
                </label>
                <input
                  type="email"
                  value={emailForm.confirmEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, confirmEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailChange}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Change Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
