import React from 'react';

const LoadingSpinner = ({ size = 'lg', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="animate-spin rounded-full border-4 border-gray-200 border-t-primary-500 mb-4">
        <div className={`rounded-full ${sizeClasses[size]}`}></div>
      </div>
      <p className="text-gray-600 font-medium animate-pulse">{message}</p>
      <div className="mt-4 text-4xl animate-bounce">🧹</div>
    </div>
  );
};

export default LoadingSpinner;