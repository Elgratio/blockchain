import React, { createContext, useState, useContext, useEffect } from 'react';
import { login, loginDev, register, verifyUser, getMe } from '../services/api';
import { connectWallet, getWalletAddress, disconnectWallet } from '../services/wallet';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
    checkWalletConnection();
  }, [token]);

  const checkWalletConnection = async () => {
    const address = await getWalletAddress();
    if (address) setWalletAddress(address);
  };

  const fetchUser = async () => {
    try {
      const response = await getMe(token);
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    }
  };

  const connectWalletHandler = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      return address;
    } catch (error) {
      toast.error('Failed to connect wallet');
      throw error;
    }
  };

  const loginWithWallet = async (signature, message) => {
    try {
      setLoading(true);
      const response = await login(walletAddress, signature, message);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
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
  };

  const loginDev = async (walletAddr) => {
    try {
      setLoading(true);
      const response = await loginDev(walletAddr);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
        toast.success('Login successful (dev mode)!');
        return response;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (userData) => {
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
  };

  const verifyUserHandler = async (address) => {
    try {
      const response = await verifyUser(address, token);
      if (response.success) {
        toast.success('User verified successfully!');
        if (user?.walletAddress === address) {
          setUser({ ...user, isVerified: true });
        }
        return response;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    disconnectWallet();
    setWalletAddress(null);
    toast.success('Logged out');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      walletAddress,
      loading,
      connectWallet: connectWalletHandler,
      loginWithWallet,
      loginDev,
      registerUser,
      verifyUser: verifyUserHandler,
      logout,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};