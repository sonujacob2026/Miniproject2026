import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useProfile } from '../context/ProfileContext';
import ProfileDropdown from './ProfileDropdown';

const UnifiedNavbar = ({ 
  showBackButton = false, 
  backButtonText = "Back to Dashboard", 
  backButtonPath = "/dashboard",
  pageTitle = null,
  showNavigation = true,
  showAuthButtons = false,
  onGetStarted = null,
  backButtonStyle = "gradient" // "gradient" or "outline"
}) => {
  const { user } = useSupabaseAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBackClick = () => {
    navigate(backButtonPath);
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate('/auth');
    }
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left Side - Logo and Back Button */}
          <div className="flex items-center space-x-4">
            {/* Always show logo */}
            <div 
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">ExpenseAI</span>
            </div>
            
            {/* Show back button if needed */}
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                  backButtonStyle === "gradient" 
                    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white" 
                    : "bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600"
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {backButtonText}
              </button>
            )}
          </div>

          {/* Right Side - Navigation, Auth Buttons, or Profile */}
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            {showNavigation && !user && (
              <nav className="hidden md:flex space-x-8">
                <a href="#features" className="text-gray-600 hover:text-green-600 transition-colors font-medium">Features</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-green-600 transition-colors font-medium">How it Works</a>
                <a href="#about" className="text-gray-600 hover:text-green-600 transition-colors font-medium">About</a>
                <a href="#contact" className="text-gray-600 hover:text-green-600 transition-colors font-medium">Contact</a>
              </nav>
            )}

            {/* Auth Buttons (for landing pages) */}
            {showAuthButtons && !user && (
              <div className="hidden md:flex items-center space-x-4">
                <button
                  onClick={handleSignIn}
                  className="text-gray-600 hover:text-green-600 transition-colors font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={handleGetStarted}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Profile Dropdown (for authenticated users) */}
            {user && <ProfileDropdown />}

            {/* Mobile Menu Button */}
            {(showNavigation || showAuthButtons) && !user && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (showNavigation || showAuthButtons) && !user && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {showNavigation && (
                <>
                  <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-green-600">Features</a>
                  <a href="#how-it-works" className="block px-3 py-2 text-gray-600 hover:text-green-600">How it Works</a>
                  <a href="#about" className="block px-3 py-2 text-gray-600 hover:text-green-600">About</a>
                  <a href="#contact" className="block px-3 py-2 text-gray-600 hover:text-green-600">Contact</a>
                </>
              )}
              {showAuthButtons && (
                <div className="pt-4 pb-2 border-t border-gray-200">
                  <button 
                    onClick={handleSignIn}
                    className="block w-full text-left px-3 py-2 text-green-600 font-medium"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={handleGetStarted}
                    className="block w-full mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default UnifiedNavbar;
