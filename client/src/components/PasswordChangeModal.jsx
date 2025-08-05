import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PasswordChangeModal = ({ 
  isOpen, 
  onClose, 
  targetUser = null, // If provided, admin is changing another user's password
  isAdmin = false 
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);

  const isChangingOtherUser = targetUser && isAdmin;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        newPassword: formData.newPassword
      };

      // Add current password if user is changing their own password
      if (!isChangingOtherUser) {
        payload.currentPassword = formData.currentPassword;
      }

      // Add target user ID if admin is changing another user's password
      if (isChangingOtherUser) {
        payload.targetUserId = targetUser.id;
      }

      await axios.put('/api/auth/change-password', payload);
      
      toast.success(
        isChangingOtherUser 
          ? `Password updated for ${targetUser.display_name}! 🔐`
          : 'Password updated successfully! 🔐'
      );
      
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Lock className="w-6 h-6 mr-2 text-primary-500" />
                Change Password
              </h2>
              <p className="text-gray-600 mt-1">
                {isChangingOtherUser 
                  ? `Update password for ${targetUser.display_name}`
                  : 'Update your account password'
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password (only for own password change) */}
            {!isChangingOtherUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔒 Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    required
                    className="input-field pr-12"
                    placeholder="Enter your current password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      currentPassword: e.target.value 
                    }))}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🆕 New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  required
                  className="input-field pr-12"
                  placeholder="Enter new password (min 6 characters)"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    newPassword: e.target.value 
                  }))}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ✅ Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  required
                  className="input-field pr-12"
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    confirmPassword: e.target.value 
                  }))}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium mb-2">Password Requirements:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-center">
                  <span className={`mr-2 ${formData.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                    {formData.newPassword.length >= 6 ? '✅' : '⭕'}
                  </span>
                  At least 6 characters
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'text-green-600' : 'text-gray-400'}`}>
                    {formData.newPassword === formData.confirmPassword && formData.confirmPassword ? '✅' : '⭕'}
                  </span>
                  Passwords match
                </li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Update Password</span>
                    <span>🔐</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeModal;