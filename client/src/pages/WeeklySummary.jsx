import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Trophy,
  Star,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Award,
  Utensils
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const WeeklySummary = () => {
  const { user, isAdmin } = useAuth();
  const [summaryData, setSummaryData] = useState(null);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableWeeks();
  }, []);

  useEffect(() => {
    if (availableWeeks.length > 0) {
      fetchWeeklySummary(availableWeeks[currentWeekIndex]);
    }
  }, [currentWeekIndex, availableWeeks]);

  const fetchAvailableWeeks = async () => {
    try {
      const response = await axios.get('/api/assignments/weeks');
      const weeks = response.data.weeks || [];
      
      // Add current week if not in the list
      const currentWeek = getCurrentWeekStart();
      if (!weeks.includes(currentWeek)) {
        weeks.unshift(currentWeek);
      }
      
      setAvailableWeeks(weeks.sort((a, b) => new Date(b) - new Date(a)));
    } catch (error) {
      console.error('Error fetching weeks:', error);
      toast.error('Failed to load week history');
    }
  };

  const fetchWeeklySummary = async (weekStart) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/assignments/summary?week=${weekStart}`);
      setSummaryData(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error('Failed to load weekly summary');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const navigateWeek = (direction) => {
    if (direction === 'prev' && currentWeekIndex < availableWeeks.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    } else if (direction === 'next' && currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading weekly summary..." />;
  }

  if (!summaryData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No data available</h3>
          <p className="text-gray-500">Complete some chores to see your weekly summary!</p>
        </div>
      </div>
    );
  }

  const { stats, daily_assignments, dish_duty, week_start, week_end } = summaryData;
  const currentWeek = availableWeeks[currentWeekIndex];
  const isCurrentWeek = currentWeek === getCurrentWeekStart();

  // Calculate overall completion rate
  const totalAssignments = daily_assignments.length;
  const completedAssignments = daily_assignments.filter(a => a.is_completed).length;
  const overallCompletionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  // Get user stats for display
  const userStats = Object.entries(stats || {}).map(([name, data]) => ({
    name,
    ...data,
    completionRate: data.total_assigned > 0 ? Math.round((data.total_completed / data.total_assigned) * 100) : 0
  })).sort((a, b) => b.total_points - a.total_points);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
          Weekly Summary
          <span className="ml-2 text-3xl">📊</span>
        </h1>
        <p className="text-xl text-gray-600">Track progress and celebrate achievements!</p>
      </div>

      {/* Week Navigation */}
      <div className="card mb-8 bg-gradient-to-r from-primary-50 to-purple-50 border-primary-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            disabled={currentWeekIndex >= availableWeeks.length - 1}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Week</span>
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-800">
              {formatDate(week_start)} - {formatDate(week_end)}
            </h2>
            <p className="text-primary-600">
              {isCurrentWeek ? 'Current Week' : 'Historical Data'}
            </p>
          </div>

          <button
            onClick={() => navigateWeek('next')}
            disabled={currentWeekIndex <= 0}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next Week</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-600 font-semibold">Completion Rate</p>
              <p className="text-3xl font-bold text-success-800">{overallCompletionRate}%</p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-success-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 font-semibold">Total Assignments</p>
              <p className="text-3xl font-bold text-blue-800">{totalAssignments}</p>
            </div>
            <Calendar className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 font-semibold">Points Earned</p>
              <p className="text-3xl font-bold text-yellow-800">
                {userStats.reduce((sum, user) => sum + user.total_points, 0)}
              </p>
            </div>
            <Star className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 font-semibold">Dish Duty</p>
              <p className="text-lg font-bold text-purple-800">
                {dish_duty ? dish_duty.display_name : 'Not assigned'}
              </p>
            </div>
            <Utensils className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* User Performance */}
      {userStats.length > 0 && (
        <div className="card mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Users className="w-6 h-6 mr-2 text-primary-500" />
            Individual Performance
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userStats.map((userStat, index) => (
              <div key={userStat.name} className="relative">
                {index === 0 && userStat.total_points > 0 && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full px-2 py-1 text-xs font-bold z-10">
                    👑 Top Performer
                  </div>
                )}
                
                <div className={`card ${
                  index === 0 && userStat.total_points > 0
                    ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300'
                    : 'bg-gradient-to-br from-gray-50 to-gray-100'
                }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {userStat.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{userStat.name}</h4>
                      <p className="text-sm text-gray-600">
                        {userStat.completionRate}% completion rate
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completed</span>
                      <span className="font-semibold text-success-600">
                        {userStat.total_completed} / {userStat.total_assigned}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Points Earned</span>
                      <span className="font-semibold text-yellow-600 flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {userStat.total_points}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${userStat.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Breakdown */}
      <div className="card">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-primary-500" />
          Daily Breakdown
        </h3>

        {daily_assignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h4 className="text-xl font-semibold text-gray-700 mb-2">No assignments this week</h4>
            <p className="text-gray-500">Chores will appear here once they're assigned.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Group assignments by date */}
            {Object.entries(
              daily_assignments.reduce((groups, assignment) => {
                const date = assignment.assigned_date;
                if (!groups[date]) groups[date] = [];
                groups[date].push(assignment);
                return groups;
              }, {})
            ).map(([date, assignments]) => (
              <div key={date} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-bold text-lg text-gray-800 mb-3 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  <span className="ml-2 text-sm text-gray-500">
                    ({assignments.filter(a => a.is_completed).length}/{assignments.length} completed)
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        assignment.is_completed
                          ? 'bg-success-50 border-success-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-800 text-sm">
                            {assignment.chore_name}
                          </h5>
                          <p className="text-xs text-gray-600 mb-2">
                            {assignment.display_name}
                          </p>
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="flex items-center text-yellow-600">
                              <Star className="w-3 h-3 mr-1" />
                              {assignment.points_earned}
                            </span>
                            {assignment.is_completed ? (
                              <span className="flex items-center text-success-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Done
                              </span>
                            ) : (
                              <span className="flex items-center text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-lg">
                          {assignment.is_completed ? '✅' : '⏳'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Encouragement Message */}
      {overallCompletionRate > 0 && (
        <div className="card mt-8 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200 text-center">
          <div className="text-4xl mb-4">
            {overallCompletionRate === 100 ? '🎉' : overallCompletionRate >= 75 ? '🌟' : '💪'}
          </div>
          <h3 className="text-lg font-bold text-purple-800 mb-2">
            {overallCompletionRate === 100 
              ? "Perfect week! Amazing job everyone! 🎊" 
              : overallCompletionRate >= 75
              ? "Great work this week! Keep it up! ⭐"
              : "Good effort! There's always next week! 🚀"
            }
          </h3>
          <p className="text-purple-600">
            {overallCompletionRate === 100
              ? "All chores completed - you're chore champions!"
              : `${overallCompletionRate}% completion rate - every bit of help counts!`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default WeeklySummary;