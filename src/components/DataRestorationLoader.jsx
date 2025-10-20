import React from 'react';

const DataRestorationLoader = ({ message = "Restoring your data..." }) => {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
        {/* Animated loader */}
        <div className="relative mb-6">
          <div className="w-16 h-16 mx-auto relative">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Message */}
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {message}
        </h3>
        
        <p className="text-gray-600 text-sm">
          Please wait while we restore your data from cache...
        </p>

        {/* Progress indicator */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 text-xs text-gray-500">
          <p>💡 This ensures your data persists across page refreshes</p>
        </div>
      </div>
    </div>
  );
};

export default DataRestorationLoader;


