import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star } from 'lucide-react';

const Leaderboard = ({ className = "" }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assignments/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      } else {
        console.error('Failed to fetch leaderboard');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <Star className="w-5 h-5 text-blue-500" />;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'from-yellow-100 to-yellow-200 border-yellow-300';
      case 2:
        return 'from-gray-100 to-gray-200 border-gray-300';
      case 3:
        return 'from-amber-100 to-amber-200 border-amber-300';
      default:
        return 'from-blue-50 to-blue-100 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
          <Trophy className="mr-2 text-yellow-500" />
          Leaderboard
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
          <Trophy className="mr-2 text-yellow-500" />
          Leaderboard
        </h2>
        <p className="text-gray-600 text-center py-8">
          No players found. Complete some chores to get started!
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
        <Trophy className="mr-2 text-yellow-500" />
        Leaderboard
      </h2>

      <div className="space-y-3">
        {leaderboard.map((player) => (
          <div
            key={player.id}
            className={`border rounded-lg p-4 bg-gradient-to-r ${getRankColor(player.rank)} transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm">
                  {getRankIcon(player.rank)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg text-gray-800">
                      #{player.rank} {player.display_name}
                    </h3>
                    <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      Level {player.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    {player.title}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">
                  {player.total_experience} XP
                </div>
                <div className="text-sm text-gray-600">
                  {player.progress.percentage}% to next level
                </div>
              </div>
            </div>

            {/* Mini progress bar */}
            <div className="mt-3">
              <div className="w-full bg-white/60 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${player.progress.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          🏆 Complete chores and bonus challenges to climb the leaderboard!
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;