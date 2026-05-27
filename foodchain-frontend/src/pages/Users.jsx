import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, verifyUser } from '../services/api';
import { FiUserCheck, FiUserX, FiShield, FiMail, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Users = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (address) => {
    try {
      await verifyUser(address, token);
      toast.success('User verified successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      DONOR: 'bg-green-100 text-green-800',
      STORE: 'bg-blue-100 text-blue-800',
      RECIPIENT: 'bg-yellow-100 text-yellow-800',
      COURIER: 'bg-orange-100 text-orange-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'all') return true;
    if (filter === 'verified') return u.isVerified;
    if (filter === 'unverified') return !u.isVerified;
    if (filter === 'active') return u.isActive;
    return u.role === filter;
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="card text-center py-12">
        <FiShield className="text-5xl text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Access denied. Admin only.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <p className="text-gray-500 mt-1">Manage and verify users on the platform</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          All ({users.length})
        </button>
        <button
          onClick={() => setFilter('verified')}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === 'verified' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Verified ({users.filter(u => u.isVerified).length})
        </button>
        <button
          onClick={() => setFilter('unverified')}
          className={`px-3 py-1 rounded-full text-sm ${
            filter === 'unverified' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Unverified ({users.filter(u => !u.isVerified).length})
        </button>
        {['DONOR', 'STORE', 'RECIPIENT', 'COURIER'].map(role => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === role ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {role} ({users.filter(u => u.role === role).length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Registered</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((u) => (
              <tr key={u.walletAddress} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{u.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500 font-mono">{u.walletAddress?.slice(0, 15)}...</p>
                    {u.email && (
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <FiMail className="mr-1" size={10} />
                        {u.email}
                      </div>
                    )}
                    {u.phone && (
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <FiPhone className="mr-1" size={10} />
                        {u.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(u.role)}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      u.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {u.isVerified ? 'Verified' : 'Pending'}
                    </span>
                    <span className={`inline-block ml-2 px-2 py-1 text-xs rounded-full ${
                      u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(u.createdAt).toLocaleDateString('id-ID')}
                </td>
                <td className="px-4 py-3">
                  {!u.isVerified && u.role !== 'ADMIN' ? (
                    <button
                      onClick={() => handleVerifyUser(u.walletAddress)}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                    >
                      <FiUserCheck />
                      <span>Verify</span>
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">Verified</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  );
};

export default Users;