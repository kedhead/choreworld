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
  BarChart3
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminPanel = () => {
  const { register } = useAuth();
  const [activeTab, setActiveTab] = useState('chores');
  const [chores, setChores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [editingChore, setEditingChore] = useState(null);
  const [showNewChoreForm, setShowNewChoreForm] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  
  const [newChore, setNewChore] = useState({
    name: '',
    description: '',
    points: 1
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

  const fetchData = async () => {
    try {
      const [choresRes, usersRes] = await Promise.all([
        axios.get('/api/chores'),
        axios.get('/api/auth/users')
      ]);
      
      setChores(choresRes.data.chores || []);
      setUsers(usersRes.data.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // Chore Management
  const handleCreateChore = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/chores', newChore);
      toast.success('Chore created successfully! 🎉');
      setNewChore({ name: '', description: '', points: 1 });
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
      const success = await register(newUser);
      if (success) {
        setNewUser({ username: '', password: '', display_name: '', role: 'kid' });
        setShowNewUserForm(false);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin panel..." />;
  }

  const tabs = [
    { id: 'chores', label: 'Manage Chores', icon: ListTodo, emoji: '📋' },
    { id: 'users', label: 'Manage Users', icon: Users, emoji: '👥' },
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
                  onClick={() => setShowNewChoreForm(false)}
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
                    onClick={() => setShowNewChoreForm(false)}
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
                      <h3 className="font-bold text-lg text-gray-800">{chore.name}</h3>
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
                
                <div className="flex justify-between items-center">
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
              </div>
            ))}
          </div>
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
    </div>
  );
};

// Chore Edit Form Component
const ChoreEditForm = ({ chore, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: chore.name,
    description: chore.description || '',
    points: chore.points
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