import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor for auth token
  useEffect(() => {
    // Configure axios base URL
    axios.defaults.baseURL = API_BASE_URL;
    
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token is still valid
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success(`Welcome back, ${user.display_name}! 🎉`);
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully!');
  };

  const register = async (userData) => {
    try {
      await axios.post('/api/auth/register', userData);
      toast.success(`New user ${userData.display_name} created successfully! 🎊`);
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return false;
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    loading,
    isAdmin: user?.role === 'admin',
    isKid: user?.role === 'kid'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};