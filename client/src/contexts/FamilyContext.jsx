import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const FamilyContext = createContext();

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};

export const FamilyProvider = ({ children }) => {
  const { user } = useAuth();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    if (user) {
      fetchFamilyInfo();
    }
  }, [user]);

  const fetchFamilyInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/families/current');
      
      if (response.data.family) {
        setFamily(response.data.family);
        setMembers(response.data.family.members || []);
        setInvites(response.data.family.invites || []);
      } else {
        setFamily(null);
        setMembers([]);
        setInvites([]);
      }
    } catch (error) {
      console.error('Failed to fetch family info:', error);
      // Don't show error toast - user might not have a family yet
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async (familyName) => {
    try {
      const response = await axios.post('/api/families/create', {
        name: familyName.trim()
      });
      
      toast.success(`Family "${familyName}" created successfully! 🏠`);
      await fetchFamilyInfo();
      
      return {
        success: true,
        family: response.data.family
      };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create family';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const joinFamily = async (inviteCode) => {
    try {
      const response = await axios.post('/api/families/join', {
        inviteCode: inviteCode.trim().toUpperCase()
      });
      
      toast.success(`Successfully joined ${response.data.family.name}! 🎉`);
      await fetchFamilyInfo();
      
      return {
        success: true,
        family: response.data.family
      };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to join family';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const createInvite = async (maxUses = 5, expiryDays = 7) => {
    try {
      const response = await axios.post('/api/families/invite', {
        maxUses,
        expiryDays
      });
      
      toast.success('Invite code created! 📨');
      await fetchFamilyInfo();
      
      return {
        success: true,
        invite: response.data.invite
      };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create invite';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateFamilySettings = async (settings) => {
    try {
      await axios.put('/api/families/settings', settings);
      toast.success('Family settings updated! ⚙️');
      await fetchFamilyInfo();
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update settings';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const removeMember = async (userId) => {
    try {
      const member = members.find(m => m.id === userId);
      await axios.post('/api/families/remove-member', { userId });
      toast.success(`${member?.display_name || 'Member'} removed from family`);
      await fetchFamilyInfo();
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to remove member';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const leaveFamily = async () => {
    try {
      await axios.post('/api/families/leave');
      toast.success('You have left the family');
      setFamily(null);
      setMembers([]);
      setInvites([]);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to leave family';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const deleteFamily = async () => {
    try {
      await axios.delete('/api/families');
      toast.success('Family deleted successfully');
      setFamily(null);
      setMembers([]);
      setInvites([]);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete family';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    family,
    members,
    invites,
    loading,
    hasFamily: !!family,
    isOwner: family && user && family.created_by === user.id,
    
    // Actions
    createFamily,
    joinFamily,
    createInvite,
    updateFamilySettings,
    removeMember,
    leaveFamily,
    deleteFamily,
    refetchFamily: fetchFamilyInfo
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};