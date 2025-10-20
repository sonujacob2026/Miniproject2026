import React from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useProfile } from '../context/ProfileContext';

const LoadingDebugger = () => {
  const { user, session, loading: authLoading } = useSupabaseAuth();
  const { profile, loading: profileLoading } = useProfile();

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs font-mono z-50">
      <div className="mb-2 font-bold">Loading Debug Info:</div>
      <div>Auth Loading: {authLoading ? 'TRUE' : 'FALSE'}</div>
      <div>Profile Loading: {profileLoading ? 'TRUE' : 'FALSE'}</div>
      <div>User: {user ? 'EXISTS' : 'NULL'}</div>
      <div>Session: {session ? 'EXISTS' : 'NULL'}</div>
      <div>Profile: {profile ? 'EXISTS' : 'NULL'}</div>
      <div>User ID: {user?.id || 'N/A'}</div>
      <div>User Email: {user?.email || 'N/A'}</div>
      <div>Session Expires: {session?.expires_at ? new Date(session.expires_at).toLocaleTimeString() : 'N/A'}</div>
      <div>Profile Onboarding: {profile?.onboarding_completed ? 'COMPLETED' : 'NOT COMPLETED'}</div>
    </div>
  );
};

export default LoadingDebugger;



