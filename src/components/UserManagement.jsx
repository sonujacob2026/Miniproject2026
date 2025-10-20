import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import CreateUserModal from './CreateUserModal';

const UserManagement = () => {
  const { getAuthUsers, updateUserProfile, deleteUser } = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('UserManagement: Loading users...');
      
      const result = await getAuthUsers();
      console.log('UserManagement: getAuthUsers result:', result);
      
      if (result.success) {
        setUsers(result.users);
        console.log('UserManagement: Loaded', result.users.length, 'users');
      } else {
        console.error('UserManagement: Failed to load users:', result.error);
        setUsers([]); // Clear users on error
      }
    } catch (error) {
      console.error('UserManagement: Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };


  const handleDisableUser = async (user) => {
    const action = user.status === 'active' ? 'disable' : 'enable';
    if (await import('../lib/swal').then(async ({ getSwal }) => (await getSwal()).fire({
      title: action === 'disable' ? 'Disable User?' : 'Enable User?',
      text: `${user.display_name || user.email}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: action === 'disable' ? 'Yes, disable' : 'Yes, enable',
      cancelButtonText: 'Cancel',
      confirmButtonColor: action === 'disable' ? '#ef4444' : '#22c55e'
    }).then(r => r.isConfirmed))) {
      try {
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        console.log(`Changing user ${user.id} status from ${user.status} to ${newStatus}`);
        
        const updateData = {
          status: newStatus,
          updated_at: new Date().toISOString()
        };
        
        const result = await updateUserProfile(user.id, updateData);
        if (result.success) {
          setUsers(users.map(u => 
            u.id === user.id ? { ...u, status: newStatus } : u
          ));
          const { getSwal } = await import('../lib/swal');
          const Swal = await getSwal();
          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: `User ${action}d successfully!`
          });
        } else {
          const { getSwal } = await import('../lib/swal');
          const Swal = await getSwal();
          await Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: `Failed to ${action} user: ${result.error}`
          });
        }
      } catch (error) {
        console.error('Error updating user status:', error);
        const { getSwal } = await import('../lib/swal');
        const Swal = await getSwal();
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error updating user status: ' + error.message
        });
      }
    }
  };


  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && user.status === 'active') ||
      (filterStatus === 'suspended' && user.status === 'suspended') ||
      (filterStatus === 'pending' && user.status === 'pending') ||
      (filterStatus === 'admin' && user.is_admin);

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      suspended: { color: 'bg-red-100 text-red-800', text: 'Suspended' },
      pending: { color: 'bg-blue-100 text-blue-800', text: 'Pending' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="mt-6 text-center text-gray-500 text-sm">
          Loading user management... Check browser console if this persists.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600 mt-1">Manage and monitor user accounts</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex space-x-2">
              <button
                onClick={loadUsers}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Refresh Users
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="active">Active Users</option>
              <option value="suspended">Suspended Users</option>
              <option value="pending">Pending Users</option>
              <option value="admin">Admin Users</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Sign In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Control
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.display_name ? user.display_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.display_name || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    {user.phone && (
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {getStatusBadge(user.email_confirmed ? 'active' : 'pending')}
                      {user.is_admin && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleDisableUser(user)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          user.status === 'active' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No users found</div>
            <div className="text-gray-400 text-sm mt-1">
              Try adjusting your search or filter criteria
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={() => {
          setShowCreateModal(false);
          loadUsers(); // Refresh the user list
        }}
      />

    </div>
  );
};

export default UserManagement;



