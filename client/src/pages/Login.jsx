import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, Sparkles, Home } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(credentials.username, credentials.password);
    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loading) {
    return <LoadingSpinner message="Logging in..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div className="text-6xl animate-bounce">🧹</div>
            <Home className="w-8 h-8 text-primary-500 animate-pulse" />
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent font-fun">
            Welcome to ChoreWorld!
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            Where chores become fun adventures! 🎉
          </p>
        </div>

        {/* Login Form */}
        <div className="card-fun">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                👤 Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input-field pl-11"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                🔒 Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field pl-11"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary text-lg py-3 shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Let's Go!</span>
                  <span className="text-xl">🚀</span>
                </span>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">🎮 Demo Credentials</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Admin/Parent:</strong></p>
              <p>Username: <code className="bg-blue-100 px-1 rounded">admin</code></p>
              <p>Password: <code className="bg-blue-100 px-1 rounded">admin123</code></p>
            </div>
          </div>
        </div>

        {/* Fun Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Ready to make chores fun? Let's turn cleaning into a game! 🎯</p>
          <div className="flex justify-center space-x-2 mt-2 text-2xl">
            <span className="animate-bounce">🧽</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>🧹</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🗑️</span>
            <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>✨</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;