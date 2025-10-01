import React, { useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const UserStatusChecker = ({ children }) => {
  const { user, signOut } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (user && user.email !== 'admin@gmail.com') {
        try {
          console.log('Checking user status for:', user.email);
          
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('status, full_name')
            .eq('user_id', user.id)
            .single();

          if (profileError) {
            console.warn('Could not fetch user profile for status check:', profileError);
            return;
          }

          if (userProfile?.status === 'suspended') {
            console.log('User account is suspended, signing out...');
            
            // Show notification to user
            alert('Your account has been disabled. Please contact support for assistance.');
            
            // Sign out the user
            await signOut();
            
            // Redirect to login page
            navigate('/auth');
          }
        } catch (statusError) {
          console.warn('Error checking user status:', statusError);
        }
      }
    };

    // Check status when user changes
    checkUserStatus();

    // Set up periodic status check (every 30 seconds)
    const statusCheckInterval = setInterval(checkUserStatus, 30000);

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [user, signOut, navigate]);

  return children;
};

export default UserStatusChecker;





