import React from 'react';
import { X, Trophy, Star, Zap } from 'lucide-react';

const LevelUpModal = ({ isOpen, onClose, levelUpData }) => {
  if (!isOpen || !levelUpData) return null;

  const { oldLevel, newLevel, totalXP, progress } = levelUpData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform animate-bounce">
        {/* Header with close button */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Celebration content */}
        <div className="px-6 pb-6 text-center">
          {/* Trophy icon with glow effect */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-60 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full w-20 h-20 mx-auto flex items-center justify-center shadow-lg">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Level up text */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              🎉 LEVEL UP! 🎉
            </h2>
            <p className="text-xl text-gray-600 mb-2">
              You reached <span className="font-bold text-purple-600">Level {newLevel}</span>!
            </p>
            <p className="text-sm text-gray-500">
              Advanced from Level {oldLevel} → Level {newLevel}
            </p>
          </div>

          {/* XP Progress */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-purple-500 mr-2" />
              <span className="font-semibold text-gray-700">Total XP: {totalXP}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            
            <div className="text-xs text-gray-600">
              {progress.currentXP} / {progress.neededXP} XP to next level
            </div>
          </div>

          {/* Motivational message */}
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-center text-yellow-800">
              <Star className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                Keep completing chores to level up even more!
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Awesome! Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;