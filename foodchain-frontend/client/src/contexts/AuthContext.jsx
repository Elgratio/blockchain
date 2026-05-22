import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('foodchain_token');
    if (savedToken) {
      api.setToken(savedToken);
      setToken(savedToken);
      // Try to fetch user data
      api
        .getMe()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
          }
        })
        .catch(() => {
          // Token might be invalid
          localStorage.removeItem('foodchain_token');
          api.clearToken();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken, newUser) => {
    api.setToken(newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    api.clearToken();
    setToken(null);
    setUser(null);
    localStorage.removeItem('foodchain_token');
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
