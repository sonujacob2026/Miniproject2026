import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AdminContext = createContext({});

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin credentials
  const ADMIN_EMAIL = 'admin@gmail.com';
  const ADMIN_PASSWORD = 'Admin@expenseai2';

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    const adminToken = localStorage.getItem('admin_token');
    const adminUserData = localStorage.getItem('admin_user');
    const adminMode = localStorage.getItem('admin_mode') === 'true';
    
    if ((adminToken && adminUserData) || adminMode) {
      try {
        if (adminUserData) {
          const user = JSON.parse(adminUserData);
          setAdminUser(user);
        } else if (adminMode) {
          // Create a basic admin user object if only admin_mode is set
          const basicAdminUser = {
            id: 'admin-001',
            email: ADMIN_EMAIL,
            role: 'admin',
            name: 'System Administrator',
            created_at: new Date().toISOString()
          };
          setAdminUser(basicAdminUser);
        }
        setIsAdmin(true);
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        clearAdminData();
      }
    }
    setLoading(false);
  };

  const adminSignIn = async (email, password) => {
    try {
      setLoading(true);
      
      // Check admin credentials
      console.log('Checking credentials - Email:', email, 'Password:', password);
      console.log('Expected - Email:', ADMIN_EMAIL, 'Password:', ADMIN_PASSWORD);
      
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // First, try to authenticate with Supabase using admin credentials
        console.log('Attempting Supabase authentication for admin...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        });
        
        if (authError) {
          console.log('Supabase auth failed, but continuing with custom admin auth:', authError);
        } else {
          console.log('Supabase authentication successful for admin:', authData);
        }
        
        const adminUserData = {
          id: 'admin-001',
          email: ADMIN_EMAIL,
          role: 'admin',
          name: 'System Administrator',
          created_at: new Date().toISOString()
        };

        // Store admin session
        const adminToken = btoa(JSON.stringify(adminUserData));
        localStorage.setItem('admin_token', adminToken);
        localStorage.setItem('admin_user', JSON.stringify(adminUserData));
        
        // Set a flag to indicate admin mode
        localStorage.setItem('admin_mode', 'true');
        
        setAdminUser(adminUserData);
        setIsAdmin(true);
        
        console.log('Admin authentication successful:', adminUserData);
        console.log('Admin mode set to true');
        
        return { success: true, user: adminUserData };
      } else {
        console.log('Admin authentication failed - credentials mismatch');
        if (email !== ADMIN_EMAIL) {
          return { success: false, error: 'Invalid email address' };
        } else if (password !== ADMIN_PASSWORD) {
          return { success: false, error: 'Invalid password' };
        } else {
          return { success: false, error: 'Invalid admin credentials' };
        }
      }
    } catch (error) {
      console.error('Admin sign in error:', error);
      return { success: false, error: 'Authentication failed' };
    } finally {
      setLoading(false);
    }
  };

  const adminSignOut = () => {
    clearAdminData();
    setIsAdmin(false);
    setAdminUser(null);
  };

  const clearAdminData = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_mode');
  };

  // Get all users from Supabase auth.users table
  const getAllUsers = async () => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      
      return { success: true, users: data.users };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, error: error.message };
    }
  };

  // Helper function to create test data in user_profiles table
  const createTestData = async () => {
    try {
      const testUsers = [
        {
          id: 'admin-user-1',
          email: 'admin@gmail.com',
          full_name: 'Admin User',
          phone: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'user-1',
          email: 'user1@example.com',
          full_name: 'Test User 1',
          phone: '+1234567890',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          full_name: 'Test User 2',
          phone: null,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      const { error } = await supabase
        .from('user_profiles')
        .insert(testUsers);

      if (error) {
        console.log('Error creating test data:', error);
        return false;
      }
      
      console.log('Test data created successfully');
      return true;
    } catch (error) {
      console.log('Error creating test data:', error);
      return false;
    }
  };


  // Get auth users with additional details
  const getAuthUsers = async () => {
    try {
      console.log('Fetching users from user_profiles table (RLS disabled)...');
      
      // Get users from user_profiles table - should work now that RLS is disabled
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return { success: false, error: profilesError.message };
      }

      console.log('Successfully fetched profiles from database:', profiles);

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found in database');
        return { success: true, users: [] };
      }

      // Transform profiles data to match expected structure
      const usersWithAuthData = profiles.map((profile) => {
        return {
          id: profile.id,
          email: profile.email || 'No email',
          display_name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
          created_at: profile.created_at,
          last_sign_in: profile.updated_at || profile.created_at,
          email_confirmed: true, // Assume confirmed if in profiles
          phone_confirmed: false,
          is_admin: profile.email === 'admin@gmail.com',
          profile: profile,
          // Additional fields for compatibility
          phone: profile.phone || null,
          status: 'active' // Default status
        };
      });
      
      console.log('Transformed users for display:', usersWithAuthData);
      return { success: true, users: usersWithAuthData };
    } catch (error) {
      console.error('Error fetching auth users:', error);
      return { success: false, error: error.message };
    }
  };

  // Get user profiles from user_profiles table
  const getUserProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, profiles: data };
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      return { success: false, error: error.message };
    }
  };

  // Update user profile
  const updateUserProfile = async (userId, updates) => {
    try {
      console.log('Updating user profile:', { userId, updates });
      
      // Filter out any undefined or null values
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined && value !== null)
      );
      
      console.log('Clean updates to apply:', cleanUpdates);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(cleanUpdates)
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
      
      console.log('Successfully updated user profile:', data[0]);
      return { success: true, profile: data[0] };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete user (soft delete by updating status)
  const deleteUser = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ status: 'deleted', deleted_at: new Date().toISOString() })
        .eq('id', userId)
        .select();
      
      if (error) throw error;
      
      return { success: true, profile: data[0] };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    isAdmin,
    adminUser,
    loading,
    adminSignIn,
    adminSignOut,
    getAllUsers,
    getAuthUsers,
    getUserProfiles,
    updateUserProfile,
    deleteUser
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
