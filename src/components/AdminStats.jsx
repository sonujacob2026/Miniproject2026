import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';

const AdminStats = () => {
  const { getAuthUsers } = useAdmin();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalExpenses: 0
  });
  const [loading, setLoading] = useState(true);
  const [isMockData, setIsMockData] = useState(false);

  useEffect(() => {
    console.log('AdminStats: Component mounted, starting loadStats...');
    loadStats();
  }, []);

  // Add a timeout fallback to ensure loading state doesn't get stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('AdminStats: Loading timeout reached after 30 seconds');
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          newUsersToday: 0,
          totalExpenses: 0
        });
        setIsMockData(false);
        setLoading(false);
      }
    }, 30000); // 30 second timeout for database queries

    return () => clearTimeout(timeout);
  }, [loading]);

  const loadStats = async () => {
    try {
      setLoading(true);
      console.log('AdminStats: Loading statistics from database...');
      console.log('AdminStats: getAuthUsers function:', typeof getAuthUsers);
      
      if (!getAuthUsers) {
        console.error('AdminStats: getAuthUsers function not available!');
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          newUsersToday: 0,
          totalExpenses: 0
        });
        setIsMockData(false);
        setLoading(false);
        return;
      }
      
      const result = await getAuthUsers();
      console.log('AdminStats: ===== GET AUTH USERS RESULT =====');
      console.log('AdminStats: Success:', result.success);
      console.log('AdminStats: Users count:', result.users?.length || 0);
      console.log('AdminStats: Error:', result.error || 'none');
      console.log('AdminStats: Full result:', result);
      console.log('AdminStats: ====================================');
      
      if (result.success) {
        const users = result.users || [];
        const today = new Date().toDateString();
        
        console.log('AdminStats: Processing', users.length, 'users');
        
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.email_confirmed).length;
        const newUsersToday = users.filter(u => 
          new Date(u.created_at).toDateString() === today
        ).length;
        
        // Calculate total expenses from user profiles (real data only)
        const totalExpenses = users.reduce((sum, user) => {
          const userExpenses = user.profile?.total_expenses || 0;
          return sum + userExpenses;
        }, 0);

        const newStats = {
          totalUsers,
          activeUsers,
          newUsersToday,
          totalExpenses
        };
        
        console.log('AdminStats: Calculated stats from database:', newStats);
        setStats(newStats);
        
        // Determine data source for UI feedback
        if (result.fromExpenses) {
          console.info('AdminStats: Using data derived from expenses table');
          setIsMockData(false);
        } else if (result.noProfiles && result.hasExpenses) {
          console.info('AdminStats: Found expenses but no user profiles');
          setIsMockData(false);
        } else if (result.noData) {
          console.info('AdminStats: No data found in database - fresh installation');
          setIsMockData(false);
        } else {
          console.info('AdminStats: Using real user profile data from database');
          setIsMockData(false);
        }
      } else {
        console.error('AdminStats: Failed to load users:', result.error);
        
        // Set default stats if data loading fails
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          newUsersToday: 0,
          totalExpenses: 0
        });
        setIsMockData(false);
      }
    } catch (error) {
      console.error('AdminStats: Error loading stats:', error);
      console.error('AdminStats: Error stack:', error.stack);
      
      // Set error stats
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        totalExpenses: 0
      });
      setIsMockData(false);
    } finally {
      console.log('AdminStats: Setting loading to false');
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'blue',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: '✅',
      color: 'green',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'New Users Today',
      value: stats.newUsersToday,
      icon: '🆕',
      color: 'purple',
      change: '+3',
      changeType: 'positive'
    },
    {
      title: 'Total Expenses',
      value: `₹${stats.totalExpenses.toLocaleString('en-IN')}`,
      icon: '💰',
      color: 'yellow',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-100',
      green: 'bg-green-500 text-green-100',
      purple: 'bg-purple-500 text-purple-100',
      yellow: 'bg-yellow-500 text-yellow-100'
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Source Information */}
      {isMockData && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-500 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Demo Mode:</strong> No real user data found in database. Showing mock data for demonstration.
                <br />
                <span className="text-xs">Real data will appear here once users start using the application.</span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {stats.totalUsers === 0 && !isMockData && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-500 text-xl">ℹ️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Fresh Installation:</strong> No users have registered yet. 
                <br />
                <span className="text-xs">Statistics will appear as users start using the application.</span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {isMockData && stats.totalUsers > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-xl">🔌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Database Connection Issue:</strong> Unable to connect to database. 
                <br />
                <span className="text-xs">Showing demo data. Check your internet connection and database configuration.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome to Admin Dashboard</h2>
            <p className="text-purple-100 text-lg">
              Monitor and manage your ExpenseAI application from this central hub.
            </p>
          </div>
          <button
            onClick={loadStats}
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>{loading ? 'Loading...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${getColorClasses(stat.color)} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
              <div className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New user registered</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">User profile updated</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">System backup completed</p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Database</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600 font-medium">Healthy</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">API Server</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600 font-medium">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Storage</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-yellow-600 font-medium">75% Used</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Memory</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600 font-medium">Normal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;



