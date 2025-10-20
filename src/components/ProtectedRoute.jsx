import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, signOut } = useSupabaseAuth();
  const [statusCheckLoading, setStatusCheckLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      // Status column not present; skip remote checks and allow route
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
