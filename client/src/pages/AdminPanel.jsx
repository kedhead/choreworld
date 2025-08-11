import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  ListTodo,
  Save,
  X,
  UserPlus,
  Settings,
  BarChart3,
  Lock,
  Calendar,
  DollarSign
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import PasswordChangeModal from '../components/PasswordChangeModal';
import FamilyManagement from '../components/FamilyManagement';
import PaymentTracking from '../components/PaymentTracking';

const AdminPanel = () => {
  const { register } = useAuth();
  const [activeTab, setActiveTab] = useState('chores');
  const [chores, setChores] = useState([]);
  const [users, setUsers] = useState([]);
  const [dishDutyOrder, setDishDutyOrder] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [editingChore, setEditingChore] = useState(null);
  const [showNewChoreForm, setShowNewChoreForm] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeUser, setPasswordChangeUser] = useState(null);
  
  const [newChore, setNewChore] = useState({
    name: '',
    description: '',
    points: 1,
    is_bonus_available: false
  });
  
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    display_name: '',
    role: 'kid'
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch assignments when switching to assign tab
  useEffect(() => {
    if (activeTab === 'assign') {
      fetchAssignmentsForDate(selectedDate);
    }
  }, [activeTab]);

  // Re-fetch data when component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [choresRes, usersRes, dishDutyOrderRes] = await Promise.all([
        axios.get('/api/chores'),
        axios.get('/api/auth/users'),
        axios.get('/api/assignments/dish-duty/order')
      ]);
      
      console.log('Fetched users:', usersRes.data.users);
      
      setChores(choresRes.data.chores || []);
      setUsers(usersRes.data.users || []);
      setDishDutyOrder(dishDutyOrderRes.data.order || []);
      
      // Fetch assignments for current selected date
      await fetchAssignmentsForDate(selectedDate);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentsForDate = async (date) => {
    try {
      const assignmentsRes = await axios.get(`/api/assignments/daily?date=${date}`);
      setAssignments(assignmentsRes.data.assignments || []);
      console.log('Fetched assignments for', date, ':', assignmentsRes.data.assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    }
  };

  // Chore Management
  const handleCreateChore = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/chores', newChore);
      toast.success('Chore created successfully! 🎉');
      setNewChore({ name: '', description: '', points: 1, is_bonus_available: false });
      setShowNewChoreForm(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create chore');
    }
  };

  const handleUpdateChore = async (id, updatedChore) => {
    try {
      await axios.put(`/api/chores/${id}`, updatedChore);
      toast.success('Chore updated successfully! ✏️');
      setEditingChore(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update chore');
    }
  };

  const handleDeleteChore = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await axios.delete(`/api/chores/${id}`);
        toast.success('Chore deleted successfully! 🗑️');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete chore');
      }
    }
  };

  // User Management
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating family member:', newUser);
      const response = await axios.post('/api/auth/create-family-member', newUser);
      toast.success(`Family member ${newUser.display_name} created successfully! 🎆`);
      setNewUser({ username: '', password: '', display_name: '', role: 'kid' });
      setShowNewUserForm(false);
      // Wait a moment before fetching to ensure the user is created
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (error) {
      console.error('User creation error:', error);
      const message = error.response?.data?.error || 'Failed to create family member';
      toast.error(message);
    }
  };

  // Dish Duty Order Management
  const handleUpdateDishDutyOrder = async (newOrder) => {
    try {
      await axios.put('/api/assignments/dish-duty/order', { order: newOrder });
      toast.success('Dish duty order updated! 🍽️');
      setDishDutyOrder(newOrder);
    } catch (error) {
      toast.error('Failed to update dish duty order');
    }
  };

  const moveDishDutyUser = (fromIndex, toIndex) => {
    const newOrder = [...dishDutyOrder];
    const [movedUser] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedUser);
    handleUpdateDishDutyOrder(newOrder);
  };

  // Manual Assignment Management
  const handleManualAssignment = async (userId, choreId, assignedDate) => {
    try {
      await axios.post('/api/assignments/daily/assign-manual', {
        userId,
        choreId,
        assignedDate
      });
      toast.success('Chore assigned successfully! 📅');
      await fetchAssignmentsForDate(assignedDate);
    } catch (error) {
      toast.error('Failed to assign chore');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await axios.delete(`/api/assignments/daily/${assignmentId}`);
      toast.success('Assignment removed! 🗑️');
      await fetchAssignmentsForDate(selectedDate);
    } catch (error) {
      toast.error('Failed to remove assignment');
    }
  };

  const handleDateChange = async (newDate) => {
    setSelectedDate(newDate);
    await fetchAssignmentsForDate(newDate);
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin panel..." />;
  }

  const tabs = [
    { id: 'chores', label: 'Manage Chores', icon: ListTodo, emoji: '📋' },
    { id: 'users', label: 'Manage Users', icon: Users, emoji: '👥' },
    { id: 'assign', label: 'Assign Chores', icon: Calendar, emoji: '📅' },
    { id: 'dishes', label: 'Dish Duty Order', icon: Settings, emoji: '🍽️' },
    { id: 'payments', label: 'Payment Tracking', icon: DollarSign, emoji: '💰' },
    { id: 'family', label: 'Family Settings', icon: Users, emoji: '🏠' },
    { id: 'stats', label: 'Statistics', icon: BarChart3, emoji: '📊' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Settings className="w-8 h-8 mr-3 text-primary-500" />
          Admin Panel
          <span className="ml-2 text-3xl">⚙️</span>
        </h1>
        <p className="text-xl text-gray-600">Manage chores, users, and view statistics</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center mb-8 bg-white rounded-2xl shadow-lg p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{tab.emoji}</span>
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chores Tab */}
      {activeTab === 'chores' && (
        <div className="space-y-6">
          {/* New Chore Button */}
          <div className="card">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Chore Management</h2>
              <button
                onClick={() => setShowNewChoreForm(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Chore</span>
                <span>🆕</span>
              </button>
            </div>
          </div>

          {/* New Chore Form */}
          {showNewChoreForm && (
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-green-800">Create New Chore</h3>
                <button
                  onClick={() => {
                    setShowNewChoreForm(false);
                    setNewChore({ name: '', description: '', points: 1, is_bonus_available: false });
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateChore} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Chore Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="e.g., Take out trash"
                      value={newChore.name}
                      onChange={(e) => setNewChore(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="input-field"
                      value={newChore.points}
                      onChange={(e) => setNewChore(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-green-700">
                      <input
                        type="checkbox"
                        className="rounded border-green-300 text-green-600 focus:ring-green-500"
                        checked={newChore.is_bonus_available}
                        onChange={(e) => setNewChore(prev => ({ ...prev, is_bonus_available: e.target.checked }))}
                      />
                      <span>Bonus Chore (2x XP) 🌟</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="input-field resize-none"
                    rows="3"
                    placeholder="Describe what needs to be done..."
                    value={newChore.description}
                    onChange={(e) => setNewChore(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button type="submit" className="btn-success flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Create Chore</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewChoreForm(false);
                      setNewChore({ name: '', description: '', points: 1, is_bonus_available: false });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Chores List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chores.map((chore) => (
              <div key={chore.id} className="card hover:shadow-lg transition-shadow">
                {editingChore === chore.id ? (
                  <ChoreEditForm
                    chore={chore}
                    onSave={(updatedChore) => handleUpdateChore(chore.id, updatedChore)}
                    onCancel={() => setEditingChore(null)}
                  />
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center">
                        {chore.name}
                        {chore.is_bonus_available && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            🌟 Bonus
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                        <span>⭐</span>
                        <span>{chore.points}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 min-h-[3rem]">
                      {chore.description || 'No description provided'}
                    </p>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingChore(chore.id)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteChore(chore.id, chore.name)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {chores.length === 0 && (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No chores yet!</h3>
              <p className="text-gray-500">Create your first chore to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* New User Button */}
          <div className="card">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <button
                onClick={() => setShowNewUserForm(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add New User</span>
                <span>👤</span>
              </button>
            </div>
          </div>

          {/* New User Form */}
          {showNewUserForm && (
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-blue-800">Create New User</h3>
                <button
                  onClick={() => setShowNewUserForm(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="e.g., sarah123"
                      value={newUser.username}
                      onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="e.g., Sarah"
                      value={newUser.display_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, display_name: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      className="input-field"
                      placeholder="Enter password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Role
                    </label>
                    <select
                      className="input-field"
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="kid">Kid</option>
                      <option value="admin">Admin/Parent</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button type="submit" className="btn-success flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Create User</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewUserForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {console.log('Current users in state:', users)}
            {users.map((user) => (
              <div key={user.id} className="card">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{user.display_name}</h3>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'admin' ? '👨‍💼 Admin' : '👶 Kid'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setPasswordChangeUser(user);
                    setShowPasswordModal(true);
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Lock className="w-3 h-3" />
                  <span>Change Password</span>
                  <span>🔐</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Chores Tab */}
      {activeTab === 'assign' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Assign Daily Chores</h2>
                <p className="text-gray-600 mt-2">Manually assign specific chores to kids for any date</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
            
            {/* Date Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                className="input-field max-w-xs"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>

            {/* Assignment Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Kids Column */}
              <div>
                <h3 className="font-bold text-gray-800 mb-4">Kids</h3>
                <div className="space-y-4">
                  {users.filter(u => u.role === 'kid').map((kid) => {
                    const kidAssignment = assignments.find(a => a.user_id === kid.id);
                    return (
                      <div key={kid.id} className="card bg-blue-50 border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {kid.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">{kid.display_name}</h4>
                              <p className="text-sm text-gray-600">@{kid.username}</p>
                            </div>
                          </div>
                        </div>

                        {/* Current Assignment */}
                        {kidAssignment ? (
                          <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-green-800">{kidAssignment.chore_name}</p>
                                <p className="text-sm text-green-600">{kidAssignment.chore_description}</p>
                                <p className="text-xs text-green-600 mt-1">⭐ {kidAssignment.points_earned} points</p>
                              </div>
                              <button
                                onClick={() => handleDeleteAssignment(kidAssignment.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Remove assignment"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {kidAssignment.is_completed && (
                              <p className="text-green-700 text-sm mt-2 flex items-center">
                                ✅ Completed at {new Date(kidAssignment.completed_at).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-3 text-center text-gray-500">
                            No chore assigned for this date
                          </div>
                        )}

                        {/* Assign Chore Dropdown */}
                        <select
                          className="input-field text-sm"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleManualAssignment(kid.id, parseInt(e.target.value), selectedDate);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="">Assign a chore...</option>
                          {chores.filter(c => c.is_active).map((chore) => (
                            <option key={chore.id} value={chore.id}>
                              {chore.name} (⭐ {chore.points} pts)
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                  
                  {users.filter(u => u.role === 'kid').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">👶</div>
                      <p>No kids found. Create kid users first!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Chores Column */}
              <div>
                <h3 className="font-bold text-gray-800 mb-4">Available Chores</h3>
                <div className="space-y-3">
                  {chores.filter(c => c.is_active).map((chore) => (
                    <div key={chore.id} className="card bg-yellow-50 border-yellow-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-gray-800">{chore.name}</h4>
                          <p className="text-sm text-gray-600">{chore.description}</p>
                          <p className="text-xs text-yellow-600 mt-1">⭐ {chore.points} points</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {chores.filter(c => c.is_active).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📋</div>
                      <p>No chores available. Create chores first!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dish Duty Order Tab */}
      {activeTab === 'dishes' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dish Duty Rotation Order</h2>
                <p className="text-gray-600 mt-2">Configure the order for weekly dish duty assignments</p>
              </div>
              <div className="text-4xl">🍽️</div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Current Order:</h3>
              <div className="flex items-center space-x-2 text-blue-700">
                {dishDutyOrder.map((name, index) => (
                  <div key={name} className="flex items-center">
                    <span className="font-medium">{name}</span>
                    {index < dishDutyOrder.length - 1 && (
                      <span className="mx-2 text-blue-500">→</span>
                    )}
                  </div>
                ))}
                {dishDutyOrder.length === 0 && (
                  <span className="text-blue-600 italic">No order configured</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-800 mb-4">Available Kids:</h3>
                <div className="space-y-3">
                  {users.filter(u => u.role === 'kid').map((user) => {
                    const isInOrder = dishDutyOrder.includes(user.display_name);
                    return (
                      <div 
                        key={user.id} 
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isInOrder 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {user.display_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{user.display_name}</span>
                          </div>
                          {!isInOrder && (
                            <button
                              onClick={() => handleUpdateDishDutyOrder([...dishDutyOrder, user.display_name])}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-full transition-colors"
                            >
                              Add to Order
                            </button>
                          )}
                          {isInOrder && (
                            <span className="text-green-600 text-sm font-medium">✓ In Order</span>
                          )}
                        </div>
                      </div>
                    )})}
                  
                  {users.filter(u => u.role === 'kid').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">👶</div>
                      <p>No kids found. Create kid users first!</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-4">Current Rotation Order:</h3>
                <div className="space-y-3">
                  {dishDutyOrder.map((name, index) => (
                    <div key={name} className="p-3 bg-white rounded-lg border-2 border-green-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {index > 0 && (
                            <button
                              onClick={() => moveDishDutyUser(index, index - 1)}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full transition-colors"
                              title="Move Up"
                            >
                              ↑
                            </button>
                          )}
                          {index < dishDutyOrder.length - 1 && (
                            <button
                              onClick={() => moveDishDutyUser(index, index + 1)}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full transition-colors"
                              title="Move Down"
                            >
                              ↓
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateDishDutyOrder(dishDutyOrder.filter(n => n !== name))}
                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {dishDutyOrder.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-4xl mb-2">🍽️</div>
                      <p>No rotation order set</p>
                      <p className="text-sm">Add kids to create the order</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {dishDutyOrder.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">How it works:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Every Monday at 12:01 AM, the system automatically assigns dish duty to the next person in order</li>
                  <li>• The rotation follows this exact order: <strong>{dishDutyOrder.join(' → ')}</strong></li>
                  <li>• After the last person, it cycles back to the first person</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <PaymentTracking />
        </div>
      )}

      {/* Family Tab */}
      {activeTab === 'family' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Family Management</h2>
                <p className="text-gray-600 mt-2">Manage family members, invite codes, and settings</p>
              </div>
              <div className="text-4xl">🏠</div>
            </div>
          </div>
          <FamilyManagement />
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">System Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{chores.length}</div>
                <div className="text-gray-600">Total Chores</div>
                <div className="text-2xl mt-2">📋</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-success-600">{users.filter(u => u.role === 'kid').length}</div>
                <div className="text-gray-600">Kids</div>
                <div className="text-2xl mt-2">👶</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{users.filter(u => u.role === 'admin').length}</div>
                <div className="text-gray-600">Admins</div>
                <div className="text-2xl mt-2">👨‍💼</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{users.length}</div>
                <div className="text-gray-600">Total Users</div>
                <div className="text-2xl mt-2">👥</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordChangeUser(null);
        }}
        targetUser={passwordChangeUser}
        isAdmin={true}
      />
    </div>
  );
};

// Chore Edit Form Component
const ChoreEditForm = ({ chore, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: chore.name,
    description: chore.description || '',
    points: chore.points,
    is_bonus_available: chore.is_bonus_available || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        required
        className="input-field text-sm"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
      />
      
      <textarea
        className="input-field text-sm resize-none"
        rows="2"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
      />
      
      <input
        type="number"
        min="1"
        max="10"
        className="input-field text-sm"
        value={formData.points}
        onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) }))}
      />
      
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={formData.is_bonus_available}
          onChange={(e) => setFormData(prev => ({ ...prev, is_bonus_available: e.target.checked }))}
        />
        <span>Bonus Chore (2x XP) 🌟</span>
      </label>
      
      <div className="flex space-x-2">
        <button type="submit" className="flex-1 btn-success text-sm py-2">
          <Save className="w-3 h-3 mr-1" />
          Save
        </button>
        <button type="button" onClick={onCancel} className="flex-1 btn-secondary text-sm py-2">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AdminPanel;