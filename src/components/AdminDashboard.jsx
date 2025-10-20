import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from './UserManagement';
import AdminStats from './AdminStats';
import SystemSettings from './SystemSettings';
import ExpenseCategoriesManager from './ExpenseCategoriesManager';
import IncomeCategoriesManager from './IncomeCategoriesManager';
// CategoryTypes page removed

const AdminDashboard = () => {
  const { isAdmin, adminUser, adminSignOut } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check if we're in admin mode or if user is admin
    const adminMode = localStorage.getItem('admin_mode') === 'true';
    const adminUser = localStorage.getItem('admin_user');
    
    console.log('AdminDashboard: isAdmin:', isAdmin);
    console.log('AdminDashboard: adminMode:', adminMode);
    console.log('AdminDashboard: adminUser:', adminUser);
    
    if (!isAdmin && !adminMode && !adminUser) {
      console.log('AdminDashboard: No admin access, redirecting to homepage');
      navigate('/');
    } else {
      console.log('AdminDashboard: Admin access confirmed');
    }
  }, [isAdmin, navigate]);

  

  const handleSignOut = () => {
    adminSignOut();
    navigate('/');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'categories', name: 'Expense Categories', icon: '📂' },
    { id: 'income-categories', name: 'Income Categories', icon: '💰' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header - Made sticky */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">ExpenseAI Management Portal</p>
              </div>
            </div>

            {/* Admin Info and Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{adminUser?.name}</p>
                <p className="text-xs text-gray-500">{adminUser?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Made sticky */}
      <nav className="sticky top-16 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            <AdminStats />
          </>
        )}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'settings' && <SystemSettings />}
        
        {activeTab === 'categories' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Expense Categories Management</h2>
              <p className="text-gray-600">Manage expense categories and subcategories for your application</p>
            </div>
            <ExpenseCategoriesManager />
          </div>
        )}
        {activeTab === 'income-categories' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Income Categories Management</h2>
              <p className="text-gray-600">Manage income categories and subcategories for your application</p>
            </div>
            <IncomeCategoriesManager />
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
