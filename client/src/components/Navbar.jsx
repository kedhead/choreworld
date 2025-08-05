import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Settings, 
  BarChart3, 
  LogOut, 
  User,
  Sparkles 
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', emoji: '🏠' },
    { path: '/summary', icon: BarChart3, label: 'Weekly Summary', emoji: '📊' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Settings, label: 'Admin Panel', emoji: '⚙️' });
  }

  return (
    <nav className="bg-white shadow-lg border-b-4 border-primary-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-3xl animate-pulse">🧹</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              ChoreWorld
            </h1>
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700 shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-800">{user.display_name}</span>
              {isAdmin && (
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-semibold">
                  Admin
                </span>
              )}
            </div>
            
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-200 hover:bg-red-50 px-3 py-2 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex space-x-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700 shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;