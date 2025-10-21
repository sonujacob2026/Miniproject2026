import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackToDashboard = ({ className = "", showText = true, size = "normal" }) => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2";
    
    if (size === "small") {
      return `${baseClasses} px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white`;
    } else if (size === "large") {
      return `${baseClasses} px-6 py-4 text-lg bg-green-600 hover:bg-green-700 text-white`;
    } else {
      return `${baseClasses} px-4 py-3 text-base bg-green-600 hover:bg-green-700 text-white`;
    }
  };

  const getIconSize = () => {
    if (size === "small") return "w-4 h-4";
    if (size === "large") return "w-6 h-6";
    return "w-5 h-5";
  };

  return (
    <button
      onClick={handleBackToDashboard}
      className={`${getButtonClasses()} ${className}`}
      title="Return to Dashboard"
    >
      <svg 
        className={`${getIconSize()} mr-2`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10 19l-7-7m0 0l7-7m-7 7h18" 
        />
      </svg>
      {showText && "Back to Dashboard"}
    </button>
  );
};

export default BackToDashboard;
