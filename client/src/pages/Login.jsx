import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, Sparkles, Home, UserPlus, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '', 
    display_name: '',
    role: 'kid' // Default to kid, but allow selection
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(credentials.username, credentials.password);
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const success = await register({
      username: registerData.username.trim(),
      password: registerData.password,
      display_name: registerData.display_name.trim(),
      role: registerData.role
    });
    
    if (success) {
      // Auto-login after successful registration
      await login(registerData.username, registerData.password);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    if (mode === 'login') {
      setCredentials(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    } else {
      setRegisterData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    }
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
            {mode === 'login' ? 'Welcome to ChoreWorld!' : 'Join ChoreWorld!'}
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            {mode === 'login' 
              ? 'Where chores become fun adventures! 🎉'
              : 'Create your account and start your journey! ✨'
            }
          </p>
        </div>

        {/* Forms */}
        <div className="card-fun">
          {mode === 'login' ? (
            <form className="space-y-6" onSubmit={handleLogin}>
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

              {/* Switch to Register */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">New to ChoreWorld?</p>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="btn-secondary flex items-center justify-center space-x-2 w-full"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create New Account</span>
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleRegister}>
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                  ✨ Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    id="display_name"
                    name="display_name"
                    type="text"
                    required
                    className="input-field pl-11"
                    placeholder="What should we call you?"
                    value={registerData.display_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg_username" className="block text-sm font-medium text-gray-700 mb-2">
                  👤 Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    id="reg_username"
                    name="username"
                    type="text"
                    required
                    className="input-field pl-11"
                    placeholder="Choose a unique username"
                    value={registerData.username}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg_password" className="block text-sm font-medium text-gray-700 mb-2">
                  🔒 Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    id="reg_password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="input-field pl-11"
                    placeholder="At least 6 characters"
                    value={registerData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  🔐 Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    className="input-field pl-11"
                    placeholder="Confirm your password"
                    value={registerData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  👤 I am a...
                </label>
                <select
                  id="role"
                  name="role"
                  className="input-field"
                  value={registerData.role}
                  onChange={handleChange}
                >
                  <option value="kid">Kid/Child 👶</option>
                  <option value="admin">Parent/Admin 👨‍💼</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Parents can create families and manage chores. Kids can complete chores and earn points.
                </p>
              </div>

              <button
                type="submit"
                className="w-full btn-success text-lg py-3 shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="spinner"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Join the Fun!</span>
                    <span className="text-xl">🎉</span>
                  </span>
                )}
              </button>

              {/* Switch to Login */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">Already have an account?</p>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="btn-secondary flex items-center justify-center space-x-2 w-full"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* Demo Credentials - only show on login */}
          {mode === 'login' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">🎮 Demo Credentials</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Admin/Parent:</strong></p>
                <p>Username: <code className="bg-blue-100 px-1 rounded">admin</code></p>
                <p>Password: <code className="bg-blue-100 px-1 rounded">admin123</code></p>
              </div>
            </div>
          )}
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