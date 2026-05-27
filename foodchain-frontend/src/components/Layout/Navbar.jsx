import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiPackage, FiHeart, FiUsers, FiLogOut, FiUser, FiAlertCircle } from 'react-icons/fi';
import { BiDonateHeart } from 'react-icons/bi';

const Navbar = () => {
  const { user, logout, isAuthenticated, walletAddress, connectWallet } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome, roles: ['DONOR', 'STORE', 'RECIPIENT', 'COURIER', 'ADMIN'] },
    { path: '/products', label: 'Products', icon: FiPackage, roles: ['DONOR', 'STORE', 'ADMIN'] },
    { path: '/donations', label: 'Donations', icon: BiDonateHeart, roles: ['DONOR', 'STORE', 'RECIPIENT', 'COURIER', 'ADMIN'] },
    { path: '/disputes', label: 'Disputes', icon: FiAlertCircle, roles: ['RECIPIENT', 'ADMIN'] },
    { path: '/users', label: 'Users', icon: FiUsers, roles: ['ADMIN'] },
  ];

  const getRoleBadge = () => {
    if (!user) return null;
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      DONOR: 'bg-green-100 text-green-800',
      STORE: 'bg-blue-100 text-blue-800',
      RECIPIENT: 'bg-yellow-100 text-yellow-800',
      COURIER: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[user.role]}`}>
        {user.role}
      </span>
    );
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <BiDonateHeart className="text-white text-xl" />
            </div>
            <span className="font-bold text-xl text-gray-800">FoodChain</span>
          </Link>

          <div className="flex items-center space-x-6">
            {isAuthenticated && (
              <div className="hidden md:flex space-x-4">
                {navItems.map((item) => {
                  if (item.roles.includes(user?.role)) {
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                      >
                        <item.icon className="text-lg" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="hidden md:block">
                      <div className="flex items-center space-x-2">
                        <FiUser className="text-gray-400" />
                        <span className="text-sm text-gray-600">{user?.name}</span>
                        {getRoleBadge()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : user?.walletAddress?.slice(0, 10)}
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <FiLogOut />
                      <span className="hidden md:inline">Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={connectWallet}
                  className="btn-primary"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;