import React, { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Copy, 
  Plus, 
  Settings, 
  Trash2, 
  UserMinus,
  Calendar,
  Shield,
  Crown,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const FamilyManagement = () => {
  const { family, members, invites, isOwner, createInvite, updateFamilySettings, removeMember, deleteFamily } = useFamily();
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [familyName, setFamilyName] = useState(family?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard! 📋');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCreateInvite = async () => {
    const result = await createInvite(5, 7);
    if (result.success) {
      // Family context will update automatically
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!familyName.trim()) return;

    setIsUpdating(true);
    const result = await updateFamilySettings({ name: familyName.trim() });
    setIsUpdating(false);

    if (result.success) {
      setShowSettings(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.display_name} from the family? They will lose access to all family chores and data.`
    );

    if (confirmed) {
      await removeMember(memberId);
    }
  };

  const handleDeleteFamily = async () => {
    const confirmed = window.confirm(
      'Are you ABSOLUTELY sure you want to delete this family? This will:\n\n' +
      '• Remove all family members\n' +
      '• Delete all chores and assignments\n' +
      '• Erase all progress and history\n' +
      '• Cannot be undone\n\n' +
      'Type "DELETE" to confirm this action.'
    );

    if (confirmed) {
      const deleteConfirm = prompt('Type DELETE to confirm:');
      if (deleteConfirm === 'DELETE') {
        const result = await deleteFamily();
        if (result.success) {
          setShowDeleteConfirm(false);
        }
      } else {
        toast.error('Deletion cancelled');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isInviteExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  if (!family) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Family Found</h3>
        <p className="text-gray-500">You need to be part of a family to access this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Family Info */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{family.name}</h2>
              {isOwner && (
                <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                  <Crown className="w-3 h-3" />
                  <span>Owner</span>
                </div>
              )}
            </div>
            <p className="text-gray-600">Family Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{family.family_code}</span></p>
            <p className="text-sm text-gray-500 mt-1">Created on {formatDate(family.created_at)}</p>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Settings</h3>
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Name
                </label>
                <input
                  type="text"
                  required
                  className="input-field max-w-md"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isUpdating || !familyName.trim()}
                  className="btn-success flex items-center space-x-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="spinner"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4" />
                      <span>Update Settings</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Family Members */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary-500" />
            Family Members ({members.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {member.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{member.display_name}</h4>
                    <p className="text-sm text-gray-600">@{member.username}</p>
                  </div>
                </div>
                {member.id === family.created_by && (
                  <Crown className="w-4 h-4 text-yellow-500" title="Family Owner" />
                )}
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  member.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {member.role === 'admin' ? (
                    <span className="flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>Admin</span>
                    </span>
                  ) : (
                    '👶 Kid'
                  )}
                </span>
                <span className="text-xs text-gray-500">
                  Joined {formatDate(member.created_at)}
                </span>
              </div>

              {isOwner && member.id !== user.id && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <UserMinus className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite Management */}
      {isOwner && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2 text-primary-500" />
              Invite Codes
            </h3>
            <button
              onClick={handleCreateInvite}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invite</span>
            </button>
          </div>

          {invites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📨</div>
              <p>No active invite codes</p>
              <p className="text-sm">Create one to invite new family members</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-4 ${
                    isInviteExpired(invite.expires_at) 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono bg-white px-3 py-1 rounded border font-semibold text-lg">
                          {invite.invite_code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(invite.invite_code)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Copy invite code"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-600">
                            Uses: {invite.used_count}/{invite.max_uses}
                          </span>
                          <span className="text-gray-600 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Expires: {formatDate(invite.expires_at)}
                          </span>
                        </div>
                        {isInviteExpired(invite.expires_at) && (
                          <div className="flex items-center space-x-1 text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-xs font-semibold">Expired</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Danger Zone */}
      {isOwner && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-center space-x-2 text-red-800 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-lg font-bold">Danger Zone</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-red-800 mb-2">Delete Family</h4>
              <p className="text-sm text-red-700 mb-3">
                Permanently delete this family and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteFamily}
                className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Family</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyManagement;