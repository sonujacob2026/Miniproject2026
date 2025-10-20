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
  const { user, loading: authLoading } = useSupabaseAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Load profile when user changes - use cached data first, then fetch fresh
  useEffect(() => {
    let isMounted = true;
    
    const loadProfile = async () => {
      // Wait for auth to resolve first
      if (authLoading) {
        return;
      }

      if (user?.id) {
        setLoading(true);
        // Check if this is an admin user (only if admin mode is explicitly active)
        const isAdminMode = localStorage.getItem('admin_mode') === 'true';
        const isAdminUser = user.email === 'admin@gmail.com';

        if (isAdminMode && isAdminUser) {
          console.log('ProfileContext: Admin user detected, creating basic profile');
          // Create a basic profile for admin users
          const adminProfile = {
            user_id: user.id,
            full_name: 'System Administrator',
            email: user.email,
            onboarding_completed: true,
            household_members: 1,
            monthly_income: 0,
            has_debt: false,
            debt_amount: 0,
            savings_goal: '',
            primary_expenses: [],
            budgeting_experience: 'expert',
            financial_goals: []
          };
          setProfile(adminProfile);
          setOnboardingCompleted(true);
          setLoading(false);
          return;
        }

        // OPTIMIZATION: Load cached profile immediately for instant display
        const cachedProfile = localStorage.getItem(`profile_${user.id}`);
        let hasCachedProfile = false;
        
        if (cachedProfile) {
          try {
            const parsed = JSON.parse(cachedProfile);
            const cacheAge = Date.now() - (parsed._cached_at || 0);
            
            // Use cache if less than 5 minutes old
            if (cacheAge < 5 * 60 * 1000) {
              console.log('ProfileContext: Using cached profile for instant load');
              setProfile(parsed);
              setOnboardingCompleted(parsed?.onboarding_completed || false);
              setLoading(false);
              hasCachedProfile = true;
            }
          } catch (error) {
            console.error('ProfileContext: Error parsing cached profile:', error);
            localStorage.removeItem(`profile_${user.id}`);
          }
        }

        // Fetch fresh data in background (non-blocking)
        try {
          if (!hasCachedProfile) {
            setLoading(true);
          }
          setRefreshing(hasCachedProfile); // Show refresh indicator if using cache
          
          const result = await ProfileService.getProfile(user.id);
          
          if (result.success && result.data) {
            // Validate data completeness
            const requiredFields = ['user_id', 'full_name', 'email'];
            const isValid = requiredFields.every(field => 
              result.data[field] !== undefined && result.data[field] !== null
            );
            
            if (isValid) {
              setProfile(result.data);
              setOnboardingCompleted(result.data?.onboarding_completed || false);
              
              // Cache the fresh data
              const dataToCache = {
                ...result.data,
                _cached_at: Date.now()
              };
              localStorage.setItem(`profile_${user.id}`, JSON.stringify(dataToCache));
              
              console.log('ProfileContext: Profile loaded and validated successfully');
            } else {
              console.warn('ProfileContext: Profile data missing some required fields, using auto-healed data');
              setProfile(result.data);
              setOnboardingCompleted(result.data?.onboarding_completed || false);
            }
          } else if (result.data) {
            console.warn('ProfileContext: Profile service returned fallback data despite error:', result.error);
            setProfile(result.data);
            setOnboardingCompleted(result.data?.onboarding_completed || false);
          } else {
            console.error('ProfileContext: Failed to load profile:', result.error);
            if (!hasCachedProfile) {
              setProfile(null);
              setOnboardingCompleted(false);
            }
          }
        } catch (error) {
          console.error('ProfileContext: Error during profile loading:', error);
          if (!hasCachedProfile) {
            setProfile(null);
            setOnboardingCompleted(false);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      } else {
        // console.log('ProfileContext: No user ID, clearing profile');
        if (isMounted) {
          setProfile(null);
          setOnboardingCompleted(false);
          setLoading(false);
        }
      }
    };

    loadProfile();
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('ProfileContext: Safety timeout reached, setting loading to false');
        setLoading(false);
        setRefreshing(false);
      }
    }, 15000); // 15 seconds timeout
    
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [user?.id, authLoading]);

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
        
        // Update cache
        const dataToCache = {
          ...result.data,
          _cached_at: Date.now()
        };
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(dataToCache));
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

    setUpdating(true);
    try {
      const result = await ProfileService.updateProfile(user.id, updates);
      if (result.success) {
        setProfile(result.data);
        
        // Update cache
        const dataToCache = {
          ...result.data,
          _cached_at: Date.now()
        };
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(dataToCache));
      }
      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    } finally {
      setUpdating(false);
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
      setUpdating(true);
      try {
        const result = await ProfileService.getProfile(user.id);
        if (result.success) {
          setProfile(result.data);
          setOnboardingCompleted(result.data?.onboarding_completed || false);
          
          // Update cache with fresh data
          const dataToCache = {
            ...result.data,
            _cached_at: Date.now()
          };
          localStorage.setItem(`profile_${user.id}`, JSON.stringify(dataToCache));
          
          // Log if using stale cache due to timeout
          if (result.fromCache && result.stale) {
            console.warn('ProfileContext: refreshProfile using stale cached data due to database timeout');
          }
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      } finally {
        setUpdating(false);
      }
    }
  };

  const value = {
    profile,
    loading,
    refreshing,
    updating,
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
