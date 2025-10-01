import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';

const ProtectedRoute = ({ children }) => {
  const { user, loading, signOut } = useSupabaseAuth();
  const [statusCheckLoading, setStatusCheckLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (user && user.email !== 'admin@gmail.com') {
        try {
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('status')
            .eq('user_id', user.id)
            .single();

          if (profileError) {
            console.warn('Could not fetch user profile in ProtectedRoute:', profileError);
          } else if (userProfile?.status === 'suspended') {
            console.log('User is suspended, blocking access to protected route');
            setIsSuspended(true);
            // Sign out the user
            await signOut();
            return;
          }
        } catch (statusError) {
          console.warn('Error checking user status in ProtectedRoute:', statusError);
        }
      }
      setStatusCheckLoading(false);
    };

    if (!loading) {
      checkUserStatus();
    }
  }, [user, loading, signOut]);

  if (loading || statusCheckLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isSuspended) {
    return <Navigate to="/auth" replace />;
  }

  // If user is authenticated and not suspended, render the children components
  return children;
};

export default ProtectedRoute;
