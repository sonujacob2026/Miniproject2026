import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useNavigate } from 'react-router-dom';

const AdminTest = () => {
  const { adminSignIn, isAdmin, adminUser } = useAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDirectAdminAccess = async () => {
    setLoading(true);
    try {
      const result = await adminSignIn('admin@gmail.com', 'Admin@expenseai2');
      console.log('Direct admin access result:', result);
      
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        await Swal.fire({
          icon: 'error',
          title: 'Admin Access Failed',
          text: result.error,
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      const { getSwal } = await import('../lib/swal');
      const Swal = await getSwal();
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestInvalidCredentials = async () => {
    setLoading(true);
    try {
      const result = await adminSignIn('wrong@email.com', 'wrongpassword');
      console.log('Invalid credentials test result:', result);
      
      if (result.success) {
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        await Swal.fire({
          icon: 'warning',
          title: 'Unexpected Result',
          text: 'Invalid credentials were accepted!',
          confirmButtonText: 'OK'
        });
      } else {
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        await Swal.fire({
          icon: 'info',
          title: 'Expected Error',
          text: result.error,
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      const { getSwal } = await import('../lib/swal');
      const Swal = await getSwal();
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Admin Test Page</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Current Status:</h3>
            <p className="text-sm text-gray-600">Admin Status: {isAdmin ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
            {adminUser && (
              <p className="text-sm text-gray-600">Admin User: {adminUser.email}</p>
            )}
          </div>
          
          <button
            onClick={handleDirectAdminAccess}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? 'Accessing Admin...' : 'Direct Admin Access'}
          </button>
          
          <button
            onClick={handleTestInvalidCredentials}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Invalid Credentials'}
          </button>
          
          <button
            onClick={() => navigate('/admin/login')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Go to Admin Login
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Back to Main App
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Admin Credentials:<br/>
            Email: admin@gmail.com<br/>
            Password: Admin@expenseai2
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminTest;
