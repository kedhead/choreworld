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
    
    // Add request interceptor for better error handling
    axios.interceptors.request.use(
      (config) => {
        // Add timeout for Railway cold starts
        config.timeout = 30000; // 30 seconds
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for Railway connection issues
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.code === 'ERR_NETWORK' || error.code === 'ERR_FAILED') {
          console.log('🔄 Railway may be cold starting, retrying...');
          // Wait a moment and retry once
          await new Promise(resolve => setTimeout(resolve, 2000));
          return axios.request(error.config);
        }
        return Promise.reject(error);
      }
    );
    
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
      const userData = response.data.user;
      setUser({
        ...userData,
        family_id: userData.family_id || null
      });
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
      setUser({
        ...user,
        family_id: user.family_id || null
      });
      
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

  const updateToken = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser({
      ...newUser,
      family_id: newUser.family_id || null
    });
  };

  const value = {
    user,
    login,
    logout,
    register,
    updateToken,
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