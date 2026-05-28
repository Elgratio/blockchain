import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DonationDemo from '../components/Demo/DonationDemo';
import { FiHeart, FiPackage, FiUsers, FiTruck, FiActivity } from 'react-icons/fi';

const Dashboard = () => {
  const { user, balance } = useAuth();
  const [activeTab, setActiveTab] = useState('demo');

  const tabs = [
    { id: 'demo', label: 'Demo Donation', icon: FiActivity },
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
        {balance && (
          <div className="text-right">
            <p className="text-sm text-gray-500">MATIC Balance</p>
            <p className="text-xl font-bold text-primary-600">{parseFloat(balance).toFixed(4)} MATIC</p>
          </div>
        )}
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
        {activeTab === 'demo' && <DonationDemo />}
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