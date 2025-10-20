import React from 'react';

const BackgroundRefreshIndicator = ({ isVisible, message = "Refreshing data..." }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
      <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

export default BackgroundRefreshIndicator;


