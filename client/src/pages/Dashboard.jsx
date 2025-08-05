import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Star,
  Trophy,
  Sparkles,
  Utensils,
  RotateCcw
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [dishDuty, setDishDuty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, dishDutyRes] = await Promise.all([
        axios.get('/api/assignments/daily'),
        axios.get('/api/assignments/dish-duty')
      ]);
      
      setAssignments(assignmentsRes.data.assignments || []);
      setDishDuty(dishDutyRes.data.duty || null);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load chores');
    } finally {
      setLoading(false);
    }
  };

  const completeAssignment = async (assignmentId) => {
    setCompletingId(assignmentId);
    try {
      await axios.post(`/api/assignments/daily/${assignmentId}/complete`);
      
      // Show celebration
      showCelebration();
      
      // Refresh data
      await fetchData();
      
      toast.success('Great job! Chore completed! 🎉');
    } catch (error) {
      console.error('Error completing assignment:', error);
      toast.error(error.response?.data?.error || 'Failed to complete chore');
    } finally {
      setCompletingId(null);
    }
  };

  const showCelebration = () => {
    // Create confetti effect
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.position = 'fixed';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.top = '100vh';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.backgroundColor = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'][Math.floor(Math.random() * 5)];
      confetti.style.zIndex = '9999';
      document.body.appendChild(confetti);
      
      setTimeout(() => {
        confetti.remove();
      }, 3000);
    }
  };

  const manualAssign = async () => {
    try {
      await axios.post('/api/assignments/daily/assign');
      await fetchData();
      toast.success('Daily chores assigned! 📋');
    } catch (error) {
      toast.error('Failed to assign chores');
    }
  };

  const manualRotate = async () => {
    try {
      await axios.post('/api/assignments/dish-duty/rotate');
      await fetchData();
      toast.success('Dish duty rotated! 🍽️');
    } catch (error) {
      toast.error('Failed to rotate dish duty');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your chores..." />;
  }

  const userAssignments = isAdmin ? assignments : assignments.filter(a => a.user_id === user.id);
  const completedCount = userAssignments.filter(a => a.is_completed).length;
  const totalCount = userAssignments.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user.display_name}! 
          <span className="ml-2 text-3xl">
            {isAdmin ? '👨‍💼' : '🧒'}
          </span>
        </h1>
        <p className="text-xl text-gray-600">
          {isAdmin ? "Let's see how everyone is doing!" : "Ready to tackle some chores?"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Completion Rate */}
        <div className="card bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-600 font-semibold">Today's Progress</p>
              <p className="text-3xl font-bold text-success-800">{completionRate}%</p>
              <p className="text-success-600 text-sm">{completedCount} of {totalCount} completed</p>
            </div>
            <Trophy className="w-12 h-12 text-success-500" />
          </div>
        </div>

        {/* Dish Duty */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 font-semibold">Dish Duty This Week</p>
              <p className="text-2xl font-bold text-blue-800">
                {dishDuty ? dishDuty.display_name : 'Not assigned'}
              </p>
              <p className="text-blue-600 text-sm">Monday - Sunday</p>
            </div>
            <Utensils className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        {/* Points */}
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 font-semibold">Points Earned Today</p>
              <p className="text-3xl font-bold text-yellow-800">
                {userAssignments.filter(a => a.is_completed).reduce((sum, a) => sum + a.points_earned, 0)}
              </p>
              <p className="text-yellow-600 text-sm">Keep up the great work!</p>
            </div>
            <Star className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="card mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            Admin Controls
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={manualAssign}
              className="btn-primary flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Assign Daily Chores</span>
            </button>
            <button
              onClick={manualRotate}
              className="btn-secondary flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rotate Dish Duty</span>
            </button>
          </div>
        </div>
      )}

      {/* Today's Chores */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-primary-500" />
          Today's Chores
          <span className="ml-2 text-xl">📋</span>
        </h2>

        {userAssignments.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No chores assigned yet!
            </h3>
            <p className="text-gray-500">
              {isAdmin ? 'Use the admin controls above to assign chores.' : 'Check back later or ask a parent to assign chores.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`card transition-all duration-300 ${
                  assignment.is_completed 
                    ? 'chore-complete border-success-300 bg-success-50' 
                    : 'hover:shadow-lg border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                      {assignment.chore_name}
                    </h3>
                    {isAdmin && (
                      <p className="text-sm text-gray-600 mb-2">
                        Assigned to: <span className="font-semibold">{assignment.display_name}</span>
                      </p>
                    )}
                    <p className="text-gray-600 text-sm mb-3">
                      {assignment.chore_description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1 text-yellow-600">
                        <Star className="w-4 h-4" />
                        <span>{assignment.points_earned} points</span>
                      </div>
                      {assignment.is_completed && (
                        <div className="flex items-center space-x-1 text-success-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Completed!</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {assignment.is_completed ? (
                    <div className="text-4xl animate-bounce">✅</div>
                  ) : (
                    <div className="text-4xl opacity-50">
                      <Clock className="w-8 h-8 text-warning-500" />
                    </div>
                  )}
                </div>

                {!assignment.is_completed && (
                  <button
                    onClick={() => completeAssignment(assignment.id)}
                    disabled={completingId === assignment.id}
                    className="w-full btn-success flex items-center justify-center space-x-2"
                  >
                    {completingId === assignment.id ? (
                      <>
                        <div className="spinner"></div>
                        <span>Completing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Complete</span>
                        <span>🎯</span>
                      </>
                    )}
                  </button>
                )}

                {assignment.is_completed && assignment.completed_at && (
                  <div className="mt-4 text-xs text-success-600 text-center">
                    Completed: {new Date(assignment.completed_at).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Encouragement */}
      {!isAdmin && (
        <div className="card bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 text-center">
          <div className="text-4xl mb-4">🌟</div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">
            {completionRate === 100 ? "Amazing job today! 🎉" : "You're doing great! Keep it up! 💪"}
          </h3>
          <p className="text-purple-600">
            {completionRate === 100 
              ? "All chores completed! You're a chore champion!" 
              : `${totalCount - completedCount} more chore${totalCount - completedCount !== 1 ? 's' : ''} to go!`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;