import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

const AdminDebug = () => {
  const { isAdmin, adminUser, loading } = useAdmin();
  const { user } = useSupabaseAuth();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const adminMode = localStorage.getItem('admin_mode');
    const adminToken = localStorage.getItem('admin_token');
    const adminUserData = localStorage.getItem('admin_user');

    setDebugInfo({
      isAdmin,
      adminUser,
      loading,
      supabaseUser: user,
      adminMode,
      adminToken: adminToken ? 'Present' : 'Missing',
      adminUserData: adminUserData ? 'Present' : 'Missing'
    });
  }, [isAdmin, adminUser, loading, user]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Current State</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                localStorage.setItem('admin_mode', 'true');
                localStorage.setItem('admin_user', JSON.stringify({
                  id: 'admin-001',
                  email: 'admin@gmail.com',
                  role: 'admin',
                  name: 'System Administrator'
                }));
                window.location.reload();
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Set Admin Mode
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('admin_mode');
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
                window.location.reload();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-2"
            >
              Clear Admin Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDebug;


