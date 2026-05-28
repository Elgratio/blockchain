// src/contexts/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { login, loginDev, register, verifyUser, getMe } from '../services/api';
import { connectWallet, getWalletAddress, disconnectWallet } from '../services/wallet';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const fetchingRef = useRef(false);

  // Check wallet connection once on mount
  useEffect(() => {
    const checkWallet = async () => {
      const address = await getWalletAddress();
      if (address) setWalletAddress(address);
    };
    checkWallet();
  }, []);

  // Fetch user when token changes (only once)
  useEffect(() => {
    if (token && !user && !fetchingRef.current) {
      fetchUser();
    } else if (!token && user) {
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUser = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const response = await getMe(token);
      if (response.success) {
        setUser(response.data);
      } else {
        // Token invalid
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      fetchingRef.current = false;
      setInitialized(true);
    }
  }, [token]);

  const connectWalletHandler = useCallback(async () => {
    try {
      setLoading(true);
      const address = await connectWallet();
      setWalletAddress(address);
      toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      return address;
    } catch (error) {
      toast.error('Failed to connect wallet');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithWallet = useCallback(async (signature, message) => {
    if (!walletAddress) {
      toast.error('Please connect wallet first');
      throw new Error('No wallet connected');
    }
    
    try {
      setLoading(true);
      const response = await login(walletAddress, signature, message);
      if (response.success) {
        const newToken = response.data.token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(response.data.user);
        toast.success('Login successful!');
        return response;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const loginDevHandler = useCallback(async (walletAddr) => {
    if (!walletAddr) {
      toast.error('Please select a wallet address');
      return;
    }
    
    try {
      setLoading(true);
      const response = await loginDev(walletAddr);
      if (response.success) {
        const newToken = response.data.token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(response.data.user);
        setWalletAddress(walletAddr);
        toast.success('Login successful (dev mode)!');
        return response;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await register(userData);
      if (response.success) {
        toast.success('Registration successful! Waiting for admin verification.');
        return response;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyUserHandler = useCallback(async (address) => {
    try {
      setLoading(true);
      const response = await verifyUser(address, token);
      if (response.success) {
        toast.success('User verified successfully!');
        if (user?.walletAddress === address) {
          setUser(prev => ({ ...prev, isVerified: true }));
        }
        return response;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [token, user?.walletAddress]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    disconnectWallet();
    setWalletAddress(null);
    toast.success('Logged out');
  }, []);

  // Don't render until initialized to prevent flickering
  if (!initialized && token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const value = {
    user,
    token,
    walletAddress,
    loading,
    initialized,
    connectWallet: connectWalletHandler,
    loginWithWallet,
    loginDev: loginDevHandler,
    registerUser,
    verifyUser: verifyUserHandler,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};