import React, { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  UserPlus, 
  Users, 
  ArrowRight, 
  Sparkles,
  Heart,
  Star
} from 'lucide-react';

const FamilySetup = () => {
  const { createFamily, joinFamily, loading } = useFamily();
  const { user } = useAuth();
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    if (!familyName.trim()) return;

    setIsSubmitting(true);
    const result = await createFamily(familyName);
    setIsSubmitting(false);

    if (result.success) {
      // Family context will automatically update
      setMode(null);
      setFamilyName('');
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    const result = await joinFamily(inviteCode);
    setIsSubmitting(false);

    if (result.success) {
      // Family context will automatically update
      setMode(null);
      setInviteCode('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading family information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {!mode ? (
          // Welcome screen
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Welcome to ChoreWorld! 
                <span className="ml-2">🏠</span>
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                Hi {user?.display_name}! 👋
              </p>
              <p className="text-gray-600">
                Let's get you set up with a family to start managing chores together.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setMode('create')}
                className="w-full card hover:shadow-lg transition-all duration-200 p-6 border-2 border-transparent hover:border-primary-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900">Create New Family</h3>
                      <p className="text-gray-600">Start fresh with your own family</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
              </button>

              <button
                onClick={() => setMode('join')}
                className="w-full card hover:shadow-lg transition-all duration-200 p-6 border-2 border-transparent hover:border-primary-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900">Join Existing Family</h3>
                      <p className="text-gray-600">Use an invite code to join</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
              </button>
            </div>

            <div className="mt-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                <Star className="w-4 h-4" />
                <span className="font-semibold text-sm">What you'll get:</span>
              </div>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Track chores and earn points</li>
                <li>• Level up and compete with family</li>
                <li>• Manage dish duty rotations</li>
                <li>• View weekly progress reports</li>
              </ul>
            </div>
          </div>
        ) : mode === 'create' ? (
          // Create family form
          <div className="card">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Family</h2>
              <p className="text-gray-600">Choose a name that represents your household</p>
            </div>

            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g., The Smith Family, Johnson Household"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be visible to all family members
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="flex-1 btn-secondary"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-success flex items-center justify-center space-x-2"
                  disabled={isSubmitting || !familyName.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4" />
                      <span>Create Family</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          // Join family form
          <div className="card">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Join a Family</h2>
              <p className="text-gray-600">Enter the invite code from your family admin</p>
            </div>

            <form onSubmit={handleJoinFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code *
                </label>
                <input
                  type="text"
                  required
                  className="input-field text-center font-mono text-lg tracking-wider"
                  placeholder="ABCD1234"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={16}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask a parent or admin for the family invite code
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="flex-1 btn-secondary"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                  disabled={isSubmitting || !inviteCode.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Join Family</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilySetup;