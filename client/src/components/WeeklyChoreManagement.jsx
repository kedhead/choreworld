import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Settings, 
  RotateCcw, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  GripVertical,
  Users
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const WeeklyChoreManagement = () => {
  const [choreTypes, setChoreTypes] = useState([]);
  const [weeklyAssignments, setWeeklyAssignments] = useState([]);
  const [familyKids, setFamilyKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChoreForm, setShowNewChoreForm] = useState(false);
  const [editingChore, setEditingChore] = useState(null);
  const [managingRotation, setManagingRotation] = useState(null);
  const [newChore, setNewChore] = useState({ name: '', description: '', icon: '🏠' });
  const [rotationOrder, setRotationOrder] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typesRes, assignmentsRes, usersRes] = await Promise.all([
        axios.get('/api/weekly-chores/types'),
        axios.get('/api/weekly-chores/assignments'),
        axios.get('/api/auth/users')
      ]);
      
      setChoreTypes(typesRes.data.choreTypes || []);
      setWeeklyAssignments(assignmentsRes.data.assignments || []);
      setFamilyKids(usersRes.data.users?.filter(u => u.role === 'kid') || []);
    } catch (error) {
      console.error('Error fetching weekly chore data:', error);
      toast.error('Failed to load weekly chore data');
    } finally {
      setLoading(false);
    }
  };

  const createChoreType = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/weekly-chores/types', newChore);
      toast.success('Weekly chore type created! 🎉');
      setNewChore({ name: '', description: '', icon: '🏠' });
      setShowNewChoreForm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create chore type');
    }
  };

  const updateChoreType = async (choreType) => {
    try {
      await axios.put(`/api/weekly-chores/types/${choreType.id}`, choreType);
      toast.success('Chore type updated! ✏️');
      setEditingChore(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update chore type');
    }
  };

  const deleteChoreType = async (choreTypeId) => {
    if (!confirm('Are you sure? This will delete the weekly chore type and all its settings.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/weekly-chores/types/${choreTypeId}`);
      toast.success('Chore type deleted! 🗑️');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete chore type');
    }
  };

  const rotateWeeklyChores = async (choreTypeId = null) => {
    try {
      const endpoint = choreTypeId ? 
        `/api/weekly-chores/rotate/${choreTypeId}` : 
        '/api/weekly-chores/rotate';
      
      await axios.post(endpoint);
      toast.success('Weekly chores rotated! 🔄');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to rotate weekly chores');
    }
  };

  const openRotationManager = async (choreType) => {
    try {
      const response = await axios.get(`/api/weekly-chores/types/${choreType.id}/rotation`);
      const currentOrder = response.data.rotationOrder || [];
      
      // Create rotation order with all kids, filling in missing ones
      const orderedKids = [];
      
      // Add kids in current rotation order
      currentOrder.forEach(orderItem => {
        const kid = familyKids.find(k => k.id === orderItem.user_id);
        if (kid) orderedKids.push(kid);
      });
      
      // Add any kids not in rotation order
      familyKids.forEach(kid => {
        if (!orderedKids.find(k => k.id === kid.id)) {
          orderedKids.push(kid);
        }
      });
      
      setRotationOrder(orderedKids);
      setManagingRotation(choreType);
    } catch (error) {
      console.error('Error loading rotation order:', error);
      toast.error('Failed to load rotation order');
    }
  };

  const saveRotationOrder = async () => {
    try {
      const userIds = rotationOrder.map(kid => kid.id);
      await axios.put(`/api/weekly-chores/types/${managingRotation.id}/rotation`, { userIds });
      
      // Ask user if they want to rotate immediately to apply the new order
      const rotateNow = confirm('Rotation order updated! Do you want to rotate this chore now to apply the new order?');
      
      if (rotateNow) {
        await axios.post(`/api/weekly-chores/rotate/${managingRotation.id}`);
        toast.success('Rotation order updated and chore rotated! 🔄');
      } else {
        toast.success('Rotation order updated! The new order will apply on the next rotation. 🔄');
      }
      
      setManagingRotation(null);
      setRotationOrder([]);
      fetchData(); // Refresh to show updated assignments
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update rotation order');
    }
  };

  const moveKidInOrder = (fromIndex, toIndex) => {
    const newOrder = [...rotationOrder];
    const [movedKid] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedKid);
    setRotationOrder(newOrder);
  };

  if (loading) {
    return <LoadingSpinner message="Loading weekly chores..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Weekly Chore Management</h2>
          <p className="text-gray-600">Configure weekly rotating chores for your family</p>
        </div>
        <button
          onClick={() => setShowNewChoreForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Weekly Chore</span>
        </button>
      </div>

      {/* Current Weekly Assignments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">This Week's Assignments</h3>
          <button
            onClick={() => rotateWeeklyChores()}
            className="btn-secondary flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rotate All</span>
          </button>
        </div>
        
        {weeklyAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No weekly chores assigned yet</p>
            <p className="text-sm">Create chore types and click "Rotate All" to assign</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyAssignments.map((assignment) => (
              <div key={assignment.id} className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{assignment.icon}</span>
                    <h4 className="font-semibold text-blue-800">{assignment.chore_type_name}</h4>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        const choreType = choreTypes.find(ct => ct.id === assignment.weekly_chore_type_id);
                        if (choreType) openRotationManager(choreType);
                      }}
                      className="text-purple-600 hover:text-purple-800"
                      title="Change rotation order"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => rotateWeeklyChores(assignment.weekly_chore_type_id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Rotate this chore now"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-lg font-bold text-blue-900">{assignment.display_name}</p>
                <p className="text-sm text-blue-600">{assignment.chore_type_description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Chore Types Management */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Chore Types</h3>
        
        {choreTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No weekly chore types defined yet</p>
            <p className="text-sm">Create your first weekly chore type to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {choreTypes.map((choreType) => (
              <div key={choreType.id} className="border rounded-lg p-4 flex items-center justify-between">
                {editingChore?.id === choreType.id ? (
                  <div className="flex-1 flex items-center space-x-4">
                    <input
                      type="text"
                      value={editingChore.name}
                      onChange={(e) => setEditingChore({ ...editingChore, name: e.target.value })}
                      className="input flex-1"
                      placeholder="Chore name"
                    />
                    <input
                      type="text"
                      value={editingChore.description}
                      onChange={(e) => setEditingChore({ ...editingChore, description: e.target.value })}
                      className="input flex-1"
                      placeholder="Description"
                    />
                    <input
                      type="text"
                      value={editingChore.icon}
                      onChange={(e) => setEditingChore({ ...editingChore, icon: e.target.value })}
                      className="input w-16 text-center"
                      placeholder="🏠"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateChoreType(editingChore)}
                        className="btn-success btn-sm"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingChore(null)}
                        className="btn-secondary btn-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{choreType.icon}</span>
                      <div>
                        <h4 className="font-semibold">{choreType.name}</h4>
                        <p className="text-sm text-gray-600">{choreType.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openRotationManager(choreType)}
                        className="btn-secondary btn-sm flex items-center space-x-1"
                      >
                        <Users className="w-4 h-4" />
                        <span>Order</span>
                      </button>
                      <button
                        onClick={() => setEditingChore(choreType)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteChoreType(choreType.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Chore Type Form */}
      {showNewChoreForm && (
        <div className="card bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Weekly Chore Type</h3>
          <form onSubmit={createChoreType} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newChore.name}
                  onChange={(e) => setNewChore({ ...newChore, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Dish Duty, Trash Duty"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newChore.description}
                  onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
                  className="input"
                  placeholder="Brief description of responsibilities"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input
                  type="text"
                  value={newChore.icon}
                  onChange={(e) => setNewChore({ ...newChore, icon: e.target.value })}
                  className="input text-center"
                  placeholder="🍽️"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowNewChoreForm(false);
                  setNewChore({ name: '', description: '', icon: '🏠' });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Chore Type
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rotation Order Management Modal */}
      {managingRotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {managingRotation.icon} {managingRotation.name} - Rotation Order
              </h3>
              <button
                onClick={() => {
                  setManagingRotation(null);
                  setRotationOrder([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Drag to reorder. The person at the top will be assigned next.
            </p>
            
            <div className="space-y-2 mb-6">
              {rotationOrder.map((kid, index) => (
                <div
                  key={kid.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
                >
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                  <div className="flex-1">
                    <span className="font-medium">{kid.display_name}</span>
                    <span className="text-sm text-gray-500 ml-2">#{index + 1}</span>
                  </div>
                  <div className="flex space-x-1">
                    {index > 0 && (
                      <button
                        onClick={() => moveKidInOrder(index, index - 1)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ↑
                      </button>
                    )}
                    {index < rotationOrder.length - 1 && (
                      <button
                        onClick={() => moveKidInOrder(index, index + 1)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ↓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setManagingRotation(null);
                  setRotationOrder([]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveRotationOrder}
                className="btn-primary"
              >
                Save Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyChoreManagement;