import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiHeart, FiPackage, FiUsers, FiTruck, FiActivity, FiDollarSign } from 'react-icons/fi';

const Dashboard = () => {
  const { user, balance } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiActivity },
    { id: 'stats', label: 'Statistics', icon: FiHeart },
  ];

  const stats = {
    DONOR: { icon: FiHeart, label: 'Total Donated', value: 'Rp 0' },
    STORE: { icon: FiPackage, label: 'Products Sold', value: '0' },
    RECIPIENT: { icon: FiUsers, label: 'Donations Received', value: '0' },
    COURIER: { icon: FiTruck, label: 'Deliveries Made', value: '0' },
  };

  const userStat = stats[user?.role] || { icon: FiHeart, label: 'Donations', value: '0' };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-500 mt-1">
            Role: <span className="font-semibold text-primary-600">{user?.role}</span>
            {user?.isVerified ? ' ✓ Verified' : ' ⏳ Pending Verification'}
          </p>
        </div>
      </div>

      {/* Balance Card - Tetap di Dashboard */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-primary-100 text-sm">Your Wallet Balance</p>
            <p className="text-3xl font-bold mt-1">
              {balance ? `${parseFloat(balance).toFixed(4)} MATIC` : '0 MATIC'}
            </p>
            <p className="text-primary-100 text-xs mt-1">
              {user?.walletAddress?.slice(0, 15)}...{user?.walletAddress?.slice(-4)}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <FiDollarSign className="text-2xl" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{userStat.label}</p>
            <p className="text-2xl font-bold text-gray-800">{userStat.value}</p>
          </div>
          <div className="p-3 bg-primary-100 rounded-full">
            <userStat.icon className="text-primary-600 text-xl" />
          </div>
        </div>
        
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Verification Status</p>
            <p className={`text-lg font-semibold ${user?.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
              {user?.isVerified ? 'Verified' : 'Pending'}
            </p>
          </div>
          <div className="p-3 bg-gray-100 rounded-full">
            <FiUsers className="text-gray-600 text-xl" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Welcome to FoodChain</h3>
            <p className="text-gray-600">
              FoodChain connects donors with stores, couriers, and recipients in a transparent,
              secure, and efficient ecosystem powered by blockchain technology.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-blue-800">Quick Links</p>
                <ul className="text-sm text-blue-600 mt-2 space-y-1">
                  <li>• View available products in Products page</li>
                  <li>• Create new donation in Donations page</li>
                  <li>• Track your donation history</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-800">How it Works</p>
                <ul className="text-sm text-green-600 mt-2 space-y-1">
                  <li>1. Select product and recipient</li>
                  <li>2. Create donation (funds locked)</li>
                  <li>3. Store confirms packing</li>
                  <li>4. Courier picks up</li>
                  <li>5. Recipient confirms + rating</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Coming Soon</h3>
            <p className="text-gray-500">Detailed statistics and analytics will be available soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;