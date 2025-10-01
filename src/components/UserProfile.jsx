import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useProfile } from '../context/ProfileContext';
import { useNavigate } from 'react-router-dom';
import UnifiedNavbar from './UnifiedNavbar';

const UserProfile = () => {
  const { user, updatePassword } = useSupabaseAuth();
  const { profile, updateProfile, loading, isEnhancing } = useProfile();
  const navigate = useNavigate();

  // Debug logging
  console.log('UserProfile: user:', user?.id, 'profile:', profile?.id, 'loading:', loading);

  // Form states
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    monthly_income: '',
    household_members: '',
    savings_goal: '',
    budgeting_experience: '',
    financial_goals: [],
    profile_picture_url: '',
    debt_amount: ''
  });
  // Validation errors for fields
  const [fieldErrors, setFieldErrors] = useState({});

  // UI states
  const [isEditing, setIsEditing] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    profile: false
  });
  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Load profile data when component mounts - OPTIMIZED
  // Only set form state from profile context when profile is loaded and not loading
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
        profile_picture_url: profile.profile_picture_url || '',
        debt_amount: profile.debt_amount || ''
      });
    }
  }, [profile, loading]);

  // No messages in validation-only version

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
      } else if (num <= 0) {
        error = 'Value must be greater than zero';
      }
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleProfileSave = async () => {
    // Validate all fields before saving
    const errors = {};
    if (!/^[A-Za-z\s]+$/.test(profileData.full_name) || profileData.full_name.trim().length < 2) {
      errors.full_name = 'Full name must contain only letters and be at least 2 characters';
    }
    ['monthly_income', 'debt_amount', 'household_members'].forEach(field => {
      const num = Number(profileData[field]);
      if (profileData[field] === '' || isNaN(num)) {
        errors[field] = 'This field is required and must be a number';
      } else if (num <= 0) {
        errors[field] = 'Value must be greater than zero';
      }
    });
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setLoadingStates(prev => ({ ...prev, profile: true }));
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
        setToast({ show: true, message: 'Profile updated successfully!', type: 'success' });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
      } else {
        setToast({ show: true, message: result.error || 'Failed to update profile', type: 'error' });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
      }
    } catch (error) {
      setToast({ show: true, message: 'An error occurred while updating profile', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    } finally {
      setLoadingStates(prev => ({ ...prev, profile: false }));
    }
  };

  // Removed leftover renderMessage and advanced UI code for validation-only version
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
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        <div className="bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-8 text-gray-800">User Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={e => handleProfileChange('full_name', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${fieldErrors.full_name && isEditing ? 'border-red-500' : 'border-gray-300'}`}
              />
              {fieldErrors.full_name && isEditing && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income</label>
              <input
                type="number"
                min="1"
                value={profileData.monthly_income}
                onChange={e => handleProfileChange('monthly_income', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${fieldErrors.monthly_income && isEditing ? 'border-red-500' : 'border-gray-300'}`}
              />
              {fieldErrors.monthly_income && isEditing && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.monthly_income}</p>
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${fieldErrors.household_members && isEditing ? 'border-red-500' : 'border-gray-300'}`}
              />
              {fieldErrors.household_members && isEditing && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.household_members}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Savings Goal</label>
              <input
                type="text"
                value={profileData.savings_goal}
                onChange={e => handleProfileChange('savings_goal', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budgeting Experience</label>
              <select
                value={profileData.budgeting_experience}
                onChange={e => handleProfileChange('budgeting_experience', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
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
                min="1"
                value={profileData.debt_amount}
                onChange={e => handleProfileChange('debt_amount', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 ${fieldErrors.debt_amount && isEditing ? 'border-red-500' : 'border-gray-300'}`}
              />
              {fieldErrors.debt_amount && isEditing && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.debt_amount}</p>
              )}
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleProfileSave}
                  disabled={loadingStates.profile}
                  className={`px-6 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition-colors${loadingStates.profile ? ' opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingStates.profile ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (profile) {
                      setProfileData({
                        full_name: profile.full_name || user?.user_metadata?.full_name || '',
                        email: profile.email || user?.email || '',
                        monthly_income: profile.monthly_income || '',
                        household_members: profile.household_members || '',
                        savings_goal: profile.savings_goal || '',
                        budgeting_experience: profile.budgeting_experience || '',
                        financial_goals: profile.financial_goals || [],
                        profile_picture_url: profile.profile_picture_url || '',
                        debt_amount: profile.debt_amount || ''
                      });
                    }
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded shadow-lg z-50 text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default UserProfile;
