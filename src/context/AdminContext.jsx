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
  
  console.log('AdminProvider: Initializing with isAdmin:', isAdmin);

  // Admin credentials
  const ADMIN_EMAIL = 'admin@gmail.com';
  const ADMIN_PASSWORD = 'Admin@expenseai2';

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const adminToken = localStorage.getItem('admin_token');
    const adminUserData = localStorage.getItem('admin_user');
    const adminMode = localStorage.getItem('admin_mode') === 'true';
    
    // If we have admin mode but no valid token/data, clear it
    if (adminMode && (!adminToken || !adminUserData)) {
      console.log('AdminContext: Clearing invalid admin mode state');
      clearAdminData();
      setLoading(false);
      return;
    }
    
    if ((adminToken && adminUserData) || adminMode) {
      try {
        // Only check for conflicting sessions if we're explicitly in admin mode
        // Don't interfere with regular user sessions unless admin mode is explicitly active
        if (adminMode) {
          console.log('AdminContext: Admin mode detected, checking for conflicting sessions...');
          const { data: currentSession } = await supabase.auth.getSession();
          if (currentSession?.session) {
            const sessionEmail = currentSession.session.user.email;
            console.log('AdminContext: Found active session for:', sessionEmail);
            
            // If it's not the admin email, sign out the regular user
            if (sessionEmail !== ADMIN_EMAIL) {
              console.log('AdminContext: Clearing non-admin session...');
              await supabase.auth.signOut();
              console.log('AdminContext: Non-admin session cleared');
            }
          }
        }
        
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
        // Check if there's an existing session and only clear if it's not admin
        console.log('AdminContext: Checking for existing session...');
        try {
          const { data: currentSession } = await supabase.auth.getSession();
          if (currentSession?.session) {
            if (currentSession.session.user.email !== ADMIN_EMAIL) {
              console.log('AdminContext: Found non-admin session, signing out:', currentSession.session.user.email);
              await supabase.auth.signOut();
              console.log('AdminContext: Non-admin session cleared');
            } else {
              console.log('AdminContext: Admin session already exists, using it');
              // Admin is already signed in, just set admin mode
              setAdminMode(true);
              setAdminToken('admin-token');
              setAdminUserData({
                id: currentSession.session.user.id,
                email: currentSession.session.user.email,
                name: 'Admin'
              });
              setLoading(false);
              return { success: true, message: 'Admin signed in successfully' };
            }
          }
        } catch (signOutError) {
          console.warn('AdminContext: Error checking existing session:', signOutError);
        }
        
        // Try to authenticate with Supabase using admin credentials FIRST
        console.log('Attempting Supabase authentication for admin...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        });
        
        if (authError) {
          console.log('Supabase auth failed, falling back to local admin auth:', authError);
          // Fall back to local authentication if Supabase auth fails
        } else {
          console.log('Supabase authentication successful for admin:', authData);
          // Use the actual Supabase user data
          const adminUserData = {
            id: authData.user.id,
            email: authData.user.email,
            role: 'admin',
            name: 'System Administrator',
            created_at: authData.user.created_at,
            supabase_user: authData.user
          };

          // Store admin session
          const adminToken = btoa(JSON.stringify(adminUserData));
          localStorage.setItem('admin_token', adminToken);
          localStorage.setItem('admin_user', JSON.stringify(adminUserData));
          
          // Set a flag to indicate admin mode
          localStorage.setItem('admin_mode', 'true');
          
          setAdminUser(adminUserData);
          setIsAdmin(true);
          
          console.log('Admin authentication successful with Supabase:', adminUserData);
          console.log('Admin mode set to true');
          
          return { success: true, user: adminUserData };
        }
        
        // Fallback to local authentication
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
        
        console.log('Admin authentication successful with local auth:', adminUserData);
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


  // Get auth users with additional details (RLS disabled)
  const getAuthUsers = async () => {
    try {
      console.log('AdminContext: Fetching users directly from database...');
      
      // Check current Supabase session
      console.log('AdminContext: Step 1 - Checking Supabase session...');
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('AdminContext: ❌ Session error:', sessionError);
        }
        console.log('AdminContext: Current Supabase session:', {
          hasSession: !!sessionData?.session,
          user: sessionData?.session?.user?.email || 'No user',
          sessionError: sessionError?.message || 'none'
        });
      } catch (sessionErr) {
        console.error('AdminContext: ❌ Session check failed:', sessionErr);
      }
      
      // Fetch user profiles with timeout protection
      console.log('AdminContext: Step 2 - Querying user_profiles table...');
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000);
      });
      
      // Create the query promise
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('AdminContext: Step 3 - Waiting for query response...');
      
      // Race between query and timeout
      let profilesQuery;
      try {
        profilesQuery = await Promise.race([queryPromise, timeoutPromise]);
      } catch (timeoutError) {
        console.error('AdminContext: ❌ QUERY TIMEOUT:', timeoutError.message);
        return { 
          success: false, 
          error: 'Database query timeout. Please check your internet connection and Supabase configuration.' 
        };
      }

      const { data: profiles, error: profilesError } = profilesQuery;

      console.log('AdminContext: ===== PROFILES QUERY RESULT =====');
      console.log('AdminContext: Profiles count:', profiles?.length || 0);
      console.log('AdminContext: Has error:', !!profilesError);
      if (profilesError) {
        console.error('AdminContext: ❌ ERROR DETAILS:', profilesError);
        console.error('AdminContext: Error message:', profilesError.message);
        console.error('AdminContext: Error code:', profilesError.code);
        console.error('AdminContext: Error hint:', profilesError.hint);
        console.error('AdminContext: Error details:', profilesError.details);
      }
      if (profiles && profiles.length > 0) {
        console.log('AdminContext: ✅ Found profiles:', profiles);
      } else {
        console.warn('AdminContext: ⚠️ No profiles returned from query');
      }
      console.log('AdminContext: =====================================');

      // Fetch expenses to calculate total expenses per user
      console.log('AdminContext: Querying expenses table...');
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('user_id, amount, created_at');

      console.log('AdminContext: Expenses query result:', { 
        count: expenses?.length || 0, 
        error: expensesError?.message || 'none'
      });

      // Calculate total expenses per user
      const expensesByUser = {};
      if (expenses && expenses.length > 0) {
        expenses.forEach(expense => {
          if (!expensesByUser[expense.user_id]) {
            expensesByUser[expense.user_id] = {
              total_expenses: 0,
              expense_count: 0
            };
          }
          expensesByUser[expense.user_id].total_expenses += expense.amount || 0;
          expensesByUser[expense.user_id].expense_count += 1;
        });
      }

      console.log('AdminContext: Calculated expenses by user:', expensesByUser);

      // If we have profile errors but expenses exist, create users from expenses
      if (profilesError && !expensesError && expenses?.length > 0) {
        console.log('AdminContext: No profiles but found expenses, creating user data from expenses...');
        
        const usersFromExpenses = Object.keys(expensesByUser).map((userId, index) => ({
          id: userId,
          email: `user${index + 1}@example.com`,
          display_name: `User ${index + 1}`,
          created_at: new Date(Date.now() - (index * 86400000)).toISOString(),
          last_sign_in: new Date().toISOString(),
          email_confirmed: true,
          phone_confirmed: false,
          is_admin: false,
          profile: {
            full_name: `User ${index + 1}`,
            total_expenses: expensesByUser[userId].total_expenses,
            expense_count: expensesByUser[userId].expense_count
          }
        }));

        return { success: true, users: usersFromExpenses, fromExpenses: true };
      }

      // If profiles query failed completely
      if (profilesError) {
        console.error('AdminContext: Error fetching profiles:', profilesError);
        return { success: false, error: profilesError.message };
      }

      // If no profiles found
      if (!profiles || profiles.length === 0) {
        console.log('AdminContext: No profiles found in database');
        
        // Check if there are any expenses without profiles
        if (expenses && expenses.length > 0) {
          console.log('AdminContext: Found expenses without profiles');
          return { success: true, users: [], noProfiles: true, hasExpenses: expenses.length };
        }
        
        // Truly no data - return empty with flag
        return { success: true, users: [], noData: true };
      }

      // Transform profiles data to match expected structure and merge with expense data
      const usersWithAuthData = profiles.map((profile) => {
        const userExpenses = expensesByUser[profile.user_id] || { total_expenses: 0, expense_count: 0 };
        
        return {
          id: profile.user_id || profile.id,
          email: profile.email || 'No email',
          display_name: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
          created_at: profile.created_at,
          last_sign_in: profile.updated_at || profile.created_at,
          email_confirmed: true, // Assume confirmed if in profiles
          phone_confirmed: false,
          is_admin: profile.email === 'admin@gmail.com',
          profile: {
            ...profile,
            total_expenses: userExpenses.total_expenses,
            expense_count: userExpenses.expense_count
          },
          // Additional fields for compatibility
          phone: profile.phone || null,
          status: 'active' // Default status
        };
      });
      
      console.log('AdminContext: Transformed users for display:', usersWithAuthData);
      return { success: true, users: usersWithAuthData };
    } catch (error) {
      console.error('AdminContext: Error fetching auth users:', error);
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
  
  console.log('AdminProvider: Context value:', { 
    isAdmin, 
    adminUser: adminUser?.email, 
    loading,
    getAuthUsers: typeof getAuthUsers
  });

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
