import React from 'react';

const LevelDisplay = ({ levelStats, className = "" }) => {
  if (!levelStats) {
    return (
      <div className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-6 bg-white/20 rounded mb-2"></div>
          <div className="h-2 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  const { level, totalXP, progress, title } = levelStats;

  return (
    <div className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold">Level {level}</h3>
        <div className="text-sm bg-white/20 px-2 py-1 rounded-full">
          {totalXP} XP
        </div>
      </div>
      
      <div className="text-sm font-medium mb-3 text-blue-100">
        {title}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress to Level {level + 1}</span>
          <span>{progress.currentXP} / {progress.neededXP} XP</span>
        </div>
        
        <div className="w-full bg-white/20 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        
        <div className="text-xs text-blue-100 text-center">
          {progress.percentage}% Complete
        </div>
      </div>
    </div>
  );
};

export default LevelDisplay;