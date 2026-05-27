import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDonations, getMyProducts, getStoreReputation } from '../services/api';
import StatsCards from '../components/Dashboard/StatsCards';
import RecentActivity from '../components/Dashboard/RecentActivity';
import { FiPackage, FiHeart, FiUsers, FiTruck } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDonations: 0,
    activeProducts: 0,
    reputation: null,
    pendingTasks: 0,
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const donationsResp = await getDonations({ limit: 5 });
      setRecentDonations(donationsResp.data?.donations || []);
      setStats(prev => ({ ...prev, totalDonations: donationsResp.data?.total || 0 }));

      if (user?.role === 'STORE') {
        const productsResp = await getMyProducts();
        setStats(prev => ({ ...prev, activeProducts: productsResp.data?.total || 0 }));
        
        const repResp = await getStoreReputation(user.walletAddress);
        setStats(prev => ({ ...prev, reputation: repResp.data?.reputation }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const getStatsCards = () => {
    const commonCards = [
      { title: 'Total Donations', value: stats.totalDonations, icon: FiHeart, color: 'text-green-600' },
    ];

    const roleSpecific = {
      STORE: [
        { title: 'Active Products', value: stats.activeProducts, icon: FiPackage, color: 'text-blue-600' },
        { title: 'Reputation Score', value: stats.reputation?.reputationScore || 100, icon: FiUsers, color: 'text-purple-600' },
      ],
      DONOR: [
        { title: 'Donations Made', value: stats.totalDonations, icon: FiHeart, color: 'text-red-600' },
      ],
      COURIER: [
        { title: 'Deliveries', value: stats.totalDonations, icon: FiTruck, color: 'text-orange-600' },
      ],
    };

    let cards = [...commonCards];
    if (user?.role && roleSpecific[user.role]) {
      cards = [...cards, ...roleSpecific[user.role]];
    }

    return cards;
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good ';
    if (hour < 12) greeting += 'Morning';
    else if (hour < 18) greeting += 'Afternoon';
    else greeting += 'Evening';
    
    return `${greeting}, ${user?.name}! Welcome back to FoodChain.`;
  };

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">{getWelcomeMessage()}</p>
      </div>

      <StatsCards stats={getStatsCards()} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity donations={recentDonations} />
        
        {user?.role === 'STORE' && stats.reputation && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Store Performance</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Reputation Score</span>
                  <span className="font-semibold">{stats.reputation.reputationScore}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${Math.min(stats.reputation.reputationScore, 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.reputation.totalOrders}</p>
                  <p className="text-xs text-gray-500">Total Orders</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.reputation.successfulOrders}</p>
                  <p className="text-xs text-gray-500">Successful</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.reputation.totalDisputes}</p>
                  <p className="text-xs text-gray-500">Disputes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.reputation.disputesLost}</p>
                  <p className="text-xs text-gray-500">Lost</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {user?.role === 'STORE' && stats.activeProducts === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            You haven't listed any products yet. Go to Products page to add your first product!
          </p>
        </div>
      )}

      {user?.role === 'DONOR' && recentDonations.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">
            You haven't made any donations yet. Browse products and start donating!
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;