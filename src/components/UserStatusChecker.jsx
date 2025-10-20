import React, { useEffect, useState } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

const UserStatusChecker = ({ children }) => {
  const { user, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Status column does not exist in user_profiles; disable remote status checks
    const checkUserStatus = async () => {
      return;
    };

    // Background fetch function (non-blocking)
    const fetchStatusInBackground = async () => { return; };

    // Handle suspended user
    const handleSuspendedUser = async () => {
      console.log('User account is suspended, signing out...');
      
      // Show notification to user
      const { getSwal } = await import('../lib/swal');
      const Swal = await getSwal();
      await Swal.fire({
        icon: 'error',
        title: 'Account Disabled',
        text: 'Your account has been disabled. Please contact support for assistance.',
        confirmButtonText: 'OK'
      });
      
      // Sign out the user
      await signOut();
      
      // Redirect to login page
      navigate('/auth');
    };

    // Check status when user changes (non-blocking)
    checkUserStatus();

    // Set up periodic status check (every 2 minutes instead of 30 seconds)
    const statusCheckInterval = setInterval(checkUserStatus, 60 * 60 * 1000);

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [user, signOut, navigate, isChecking]);

  return children;
};

export default UserStatusChecker;









