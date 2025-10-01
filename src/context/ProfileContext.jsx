import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSupabaseAuth } from './SupabaseAuthContext';
import ProfileService from '../services/profileService';

const ProfileContext = createContext({});

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const { user } = useSupabaseAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Load profile when user changes
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        // Check if this is an admin user
        const isAdminMode = localStorage.getItem('admin_mode') === 'true';
        const isAdminUser = user.email === 'admin@gmail.com';
        
        if (isAdminMode || isAdminUser) {
          console.log('ProfileContext: Admin user detected, skipping profile load');
          setLoading(false);
          return;
        }
        
        // console.log('ProfileContext: Loading profile for user:', user.id);
        setLoading(true);
        
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('ProfileContext: Profile load timeout, setting loading to false');
          setLoading(false);
        }, 3000); // 3 second timeout
        
        try {
          const result = await ProfileService.getProfile(user.id);
          clearTimeout(timeoutId);
          // console.log('ProfileContext: Profile load result:', result);
          if (result.success) {
            if (result.data) {
              setProfile(result.data);
              setOnboardingCompleted(result.data?.onboarding_completed || false);
              console.log('ProfileContext: Profile loaded successfully, onboarding_completed:', result.data?.onboarding_completed);
            } else {
              // Profile doesn't exist yet, create a basic one for new users
              console.log('ProfileContext: No profile found, creating basic profile for new user');
              const basicProfile = {
                user_id: user.id,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
                email: user.email,
                onboarding_completed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              setProfile(basicProfile);
              setOnboardingCompleted(false);
            }
          } else {
            console.log('ProfileContext: Profile load failed:', result.error);
            setProfile(null);
            setOnboardingCompleted(false);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('ProfileContext: Error loading profile:', error);
          setProfile(null);
          setOnboardingCompleted(false);
        } finally {
          setLoading(false);
        }
      } else {
        // console.log('ProfileContext: No user ID, clearing profile');
        setProfile(null);
        setOnboardingCompleted(false);
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  // Save profile data
  const saveProfile = async (profileData) => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    setLoading(true);
    try {
      const result = await ProfileService.saveProfile(profileData, user.id);
      if (result.success) {
        setProfile(result.data);
        setOnboardingCompleted(true);
      }
      return result;
    } catch (error) {
      console.error('Error saving profile:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update specific profile fields
  const updateProfile = async (updates) => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    setLoading(true);
    try {
      const result = await ProfileService.updateProfile(user.id, updates);
      if (result.success) {
        setProfile(result.data);
      }
      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Get formatted profile data for questionnaire
  const getFormattedProfile = async () => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    try {
      return await ProfileService.getFormattedProfile(user.id);
    } catch (error) {
      console.error('Error getting formatted profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Check onboarding status
  const checkOnboardingStatus = async () => {
    if (!user?.id) {
      return { success: false, error: 'No user ID available' };
    }

    try {
      const result = await ProfileService.getOnboardingStatus(user.id);
      if (result.success) {
        setOnboardingCompleted(result.completed);
      }
      return result;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return { success: false, error: error.message };
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user?.id) {
      setLoading(true);
      try {
        const result = await ProfileService.getProfile(user.id);
        if (result.success) {
          setProfile(result.data);
          setOnboardingCompleted(result.data?.onboarding_completed || false);
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const value = {
    profile,
    loading,
    onboardingCompleted,
    saveProfile,
    updateProfile,
    getFormattedProfile,
    checkOnboardingStatus,
    refreshProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileContext;