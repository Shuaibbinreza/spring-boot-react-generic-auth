'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getCurrentUser, refreshAccessToken } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * On mount: check session via HttpOnly cookies and load user profile
   */
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await getCurrentUser();
        setUser(res.data);
      } catch {
        // Try refreshing token via HttpOnly refresh cookie
        try {
          await refreshAccessToken();
          const userRes = await getCurrentUser();
          setUser(userRes.data);
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (usernameOrEmail, password) => {
    setError(null);
    try {
      const res = await loginUser({ usernameOrEmail, password });
      setUser({
        username: res.data.username,
        email: res.data.email,
        fullName: res.data.fullName,
        roles: res.data.roles,
      });
      return res;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (username, email, password, fullName) => {
    setError(null);
    try {
      const res = await registerUser({ username, email, password, fullName });
      setUser({
        username: res.data.username,
        email: res.data.email,
        fullName: res.data.fullName,
        roles: res.data.roles,
      });
      return res;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Even if server logout fails, clear local React state
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    setError,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
