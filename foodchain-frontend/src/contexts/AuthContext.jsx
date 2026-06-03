import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  login,
  loginDev as loginDevApi,    // ✅ FIX: rename import untuk hindari konflik
  register,
  verifyUser as verifyUserApi, // ✅ konsisten, hindari konflik
  getMe
} from '../services/api';
import { connectWallet, getWalletAddress, disconnectWallet, getBalance } from '../services/wallet';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(null);
  const [token,         setToken]         = useState(localStorage.getItem('token'));
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance,       setBalance]       = useState(null);
  const [loading,       setLoading]       = useState(false);

  useEffect(() => {
    if (token) fetchUser();
    checkWalletConnection();
  }, []);  // eslint-disable-line

  useEffect(() => {
    if (walletAddress) fetchBalance();
  }, [walletAddress]);

  const checkWalletConnection = async () => {
    const address = await getWalletAddress();
    if (address) setWalletAddress(address);
  };

  const fetchBalance = async () => {
    const bal = await getBalance();
    setBalance(bal);
  };

  const fetchUser = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return;
      const response = await getMe(storedToken);
      if (response.success) setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    }
  };

  const connectWalletHandler = async () => {
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      await fetchBalance();
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
        toast.success('Login berhasil!');
        return response;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login gagal');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: panggil loginDevApi (renamed import), bukan loginDev (diri sendiri)
  const loginDev = async (walletAddr) => {
    try {
      setLoading(true);
      const response = await loginDevApi(walletAddr);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
        setWalletAddress(walletAddr);
        await fetchBalance();
        toast.success('Login berhasil (dev mode)!');
        return response;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login gagal');
      throw error;
    } finally {
      setLoading(false);
    }
  };

// Update the registerUser function in AuthContext

  const registerUser = async (userData) => {
    try {
      setLoading(true);
      console.log('Registering user with data:', userData);
      
      const response = await register(userData);
      console.log('Registration response:', response);
      
      if (response.success) {
        toast.success('Registration successful! Waiting for admin verification.');
        return response;
      } else {
        toast.error(response.message || 'Registration failed');
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Registration error details:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // FIX: panggil verifyUserApi (renamed import)
  const verifyUserHandler = async (address) => {
    try {
      const response = await verifyUserApi(address);
      if (response.success) {
        toast.success('Pengguna berhasil diverifikasi!');
        if (user?.walletAddress === address) {
          setUser({ ...user, isVerified: true });
        }
        return response;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verifikasi gagal');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    disconnectWallet();
    setWalletAddress(null);
    setBalance(null);
    toast.success('Logged out');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      walletAddress,
      balance,
      loading,
      connectWallet:   connectWalletHandler,
      loginWithWallet,
      loginDev,           // ✅ method context (bukan import)
      registerUser,
      verifyUser:      verifyUserHandler,
      logout,
      refreshBalance:  fetchBalance,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};