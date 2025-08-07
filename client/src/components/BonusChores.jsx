import React, { useState, useEffect } from 'react';
import { Star, Trophy, Zap } from 'lucide-react';

const BonusChores = ({ onCompleteBonus }) => {
  const [bonusChores, setBonusChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    fetchBonusChores();
  }, []);

  const fetchBonusChores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/assignments/bonus/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBonusChores(data.chores);
      } else {
        console.error('Failed to fetch bonus chores');
      }
    } catch (error) {
      console.error('Error fetching bonus chores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBonus = async (choreId) => {
    try {
      setCompleting(choreId);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/assignments/bonus/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ choreId }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Call parent callback with level result
        if (onCompleteBonus) {
          onCompleteBonus(data);
        }

        // Show success message with XP gained
        alert(`🎉 Bonus chore completed!\n+${data.points} points\n+${data.experience} XP${data.leveling.leveledUp ? `\n🎊 LEVEL UP! You are now level ${data.leveling.newLevel}!` : ''}`);
        
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error completing bonus chore:', error);
      alert('Error completing bonus chore. Please try again.');
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
          <Star className="mr-2 text-yellow-500" />
          Bonus Chores
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (bonusChores.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
          <Star className="mr-2 text-yellow-500" />
          Bonus Chores
        </h2>
        <p className="text-gray-600 text-center py-8">
          No bonus chores available right now. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
        <Star className="mr-2 text-yellow-500" />
        Bonus Chores
        <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
          Double XP! 
        </span>
      </h2>
      
      <p className="text-gray-600 mb-6">
        Complete these optional chores to earn extra points and XP! 
        <span className="font-semibold text-purple-600">Bonus chores give 2x XP!</span>
      </p>

      <div className="space-y-4">
        {bonusChores.map((chore) => (
          <div
            key={chore.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-yellow-50 to-orange-50"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg text-gray-800">{chore.name}</h3>
              <div className="flex items-center space-x-2">
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                  {chore.points} pts
                </div>
                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  {chore.points * 2} XP
                </div>
              </div>
            </div>
            
            {chore.description && (
              <p className="text-gray-600 text-sm mb-3">{chore.description}</p>
            )}
            
            <button
              onClick={() => handleCompleteBonus(chore.id)}
              disabled={completing === chore.id}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                completing === chore.id
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
              }`}
            >
              {completing === chore.id ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                  Completing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Trophy className="w-4 h-4 mr-2" />
                  Complete for Double XP!
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BonusChores;