import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { useAdmin } from '../context/AdminContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastProvider';

const AuthPage = ({ suppressAutoRedirect = false, initialMode } = {}) => {
  const { user, signUp, signIn, signInWithGoogle, validateEmail, validatePassword, resetPasswordForEmail } = useSupabaseAuth();
  const { adminSignIn, isAdmin } = useAdmin();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Form state
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);

  
  // Forgot password modal state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  // Redirect if user is already logged in (unless explicitly suppressed)
  useEffect(() => {
    if (!suppressAutoRedirect && user) {
      if (user.user_metadata?.onboarding_completed) {
        navigate('/dashboard');
      } else {
        navigate('/questionnaire');
      }
    }
  }, [user, navigate, suppressAutoRedirect]);

  // Redirect if admin is already logged in
  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/dashboard');
    }
  }, [isAdmin, navigate]);

  // Clear form and errors
  const clearForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setValidationErrors({});
    setPasswordStrength(null);
  };


  // Real-time validation functions

  const handleEmailChange = async (value) => {
    setEmail(value);
    if (value.includes('@')) {
      try {
        const result = await validateEmail(value);
        setValidationErrors(prev => ({
          ...prev,
          email: result.available ? null : result.message
        }));
      } catch (error) {
        console.log('Email validation error:', error);
      }
    } else {
      setValidationErrors(prev => ({ ...prev, email: null }));
    }
  };

  const handlePasswordChange = async (value) => {
    setPassword(value);

    if (isSignUp) {
      if (value.length > 0) {
        try {
          const result = await validatePassword(value);
          setPasswordStrength(result.data);
          setValidationErrors(prev => ({
            ...prev,
            password: result.data?.isValid ? null : 'Password does not meet requirements'
          }));
        } catch (error) {
          console.log('Password validation error:', error);
        }
      } else {
        setPasswordStrength(null);
        setValidationErrors(prev => ({ ...prev, password: null }));
      }
    } else {
      // For sign-in, no password validation needed
      setPasswordStrength(null);
      setValidationErrors(prev => ({ ...prev, password: null }));
    }
  };

  const handleFullNameChange = (value) => {
    setFullName(value);

    if (value.length > 0) {
      if (value.length < 2) {
        setValidationErrors(prev => ({ ...prev, fullName: 'Full name must be at least 2 characters' }));
      } else if (value.length > 100) {
        setValidationErrors(prev => ({ ...prev, fullName: 'Full name must be less than 100 characters' }));
      } else if (!/^[a-zA-Z\s'-]+$/.test(value)) {
        setValidationErrors(prev => ({ ...prev, fullName: 'Full name can only contain letters, spaces, hyphens, and apostrophes' }));
      } else {
        setValidationErrors(prev => ({ ...prev, fullName: null }));
      }
    } else {
      setValidationErrors(prev => ({ ...prev, fullName: null }));
    }
  };



  const handleAuth = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    setValidationErrors({});

    try {
      // Check if this is an admin user trying to sign in
      if (!isSignUp && email === 'admin@gmail.com') {
        const result = await adminSignIn(email, password);
        if (result.success) {
          navigate('/admin/dashboard');
        } else {
          toast.error(result.error || 'Admin authentication failed');
        }
        return;
      }

      if (isSignUp) {
        const { error, message } = await signUp(email, password, fullName);
        
        if (error) {
          let errorMessage = '';
          const errorString = error.message || error.toString();
          
          if (errorString.includes('User already registered') || errorString.includes('already exists')) {
            errorMessage = 'This email is already registered. Please sign in instead or use a different email address.';
          } else if (errorString.includes('Invalid email') || errorString.includes('Email format')) {
            errorMessage = 'Please enter a valid email address.';
          } else if (errorString.includes('Password') && errorString.includes('weak')) {
            errorMessage = 'Password is too weak. Please choose a stronger password with at least 8 characters.';
          } else if (errorString.includes('Network') || errorString.includes('Connection')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (errorString.includes('rate limit') || errorString.includes('too many')) {
            errorMessage = 'Too many signup attempts. Please wait a few minutes before trying again.';
          } else {
            errorMessage = `Signup failed: ${errorString}`;
          }
          
          toast.error(errorMessage);
          setLoading(false);
          return;
        }
        
        const successMessage = message || 'Account created successfully! Please check your email for confirmation.';
        toast.success(successMessage);
        clearForm();
      } else {
        const { user: loggedInUser, error } = await signIn(email, password);
        
        if (error) {
          let errorMessage = 'Incorrect email or password. Please try again.';
          const errorString = error.message || error.toString();
          
          if (errorString.includes('Invalid login credentials') || errorString.includes('wrong')) {
            errorMessage = 'Incorrect email or password. Please try again.';
          } else if (errorString.includes('User not found')) {
            errorMessage = 'No account found with this email address.';
          } else if (errorString.includes('Email not confirmed')) {
            errorMessage = 'Please check your email and click the confirmation link before signing in.';
          } else if (errorString.includes('Network') || errorString.includes('Connection')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (errorString.includes('rate limit') || errorString.includes('too many')) {
            errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
          }
          
          toast.error(errorMessage);
          setLoading(false);
          return;
        }

        // Successful login - redirect based on onboarding status
        if (loggedInUser) {
          toast.success('Login successful! Redirecting...');
          if (loggedInUser.user_metadata?.onboarding_completed) {
            navigate('/dashboard');
          } else {
            navigate('/questionnaire');
          }
        } else {
          toast.error('Login failed: No user returned');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMsg = error.message || 'An unexpected error occurred during authentication';
      toast.error(errorMsg);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        toast.error('Supabase configuration is missing. Please check your environment variables.');
        setLoading(false);
        return;
      }

      const { error } = await signInWithGoogle();

      if (error) {
        let errorMessage = '';
        const errorMsg = error.message || error.toString();
        
        if (errorMsg.includes('popup_closed') || errorMsg.includes('cancelled')) {
          errorMessage = 'Google sign-in was cancelled. Please try again.';
        } else if (errorMsg.includes('popup_blocked')) {
          errorMessage = 'Popup blocked. Please allow popups for this site and try again.';
        } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (errorMsg.includes('account_exists') || errorMsg.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please sign in with your password.';
        } else if (errorMsg.includes('invalid_grant') || errorMsg.includes('access_denied')) {
          errorMessage = 'Access denied. Please check your Google account settings and try again.';
        } else if (errorMsg.includes('invalid_client') || errorMsg.includes('unauthorized_client')) {
          errorMessage = 'Google OAuth configuration error. Please contact support.';
        } else if (errorMsg.includes('user_not_found') || errorMsg.includes('does not exist')) {
          errorMessage = 'This Google account does not exist or is not accessible. Please try a different account.';
        } else if (errorMsg.includes('supabase') || errorMsg.includes('configuration')) {
          errorMessage = 'Supabase configuration error. Please check your environment variables and try again.';
        } else {
          errorMessage = `Google sign-in failed: ${errorMsg}`;
        }
        
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      toast.info('Redirecting to Google...');
      // Note: Supabase will handle the redirect automatically

    } catch (error) {
      console.error('Google sign-in error:', error);
      
      let errorMsg = '';
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMsg = 'Network error. Please check your internet connection and Supabase configuration.';
      } else if (error.message.includes('supabase') || error.message.includes('client')) {
        errorMsg = 'Supabase client error. Please check your configuration and try again.';
      } else {
        errorMsg = `Google sign-in failed: ${error.message}`;
      }
      
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotPasswordEmail(email);
    setForgotPasswordMessage('');
    setShowForgotPasswordModal(true);
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Please enter your email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');

    try {
      const { success, error } = await resetPasswordForEmail(forgotPasswordEmail);
      
      if (success) {
        setForgotPasswordMessage('Password reset email sent! Please check your inbox and click the link to reset your password.');
        setTimeout(() => {
          setShowForgotPasswordModal(false);
          setForgotPasswordEmail('');
          setForgotPasswordMessage('');
        }, 3000);
      } else {
        setForgotPasswordMessage(error || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setForgotPasswordMessage(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordEmail('');
    setForgotPasswordMessage('');
    setForgotPasswordLoading(false);
  };

  return (
    <>
      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeForgotPasswordModal}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
              </div>
              <button
                onClick={closeForgotPasswordModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={forgotPasswordLoading}
                />
              </div>

              {forgotPasswordMessage && (
                <div className={`p-4 rounded-lg ${
                  forgotPasswordMessage.includes('sent') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <div className="flex items-center">
                    {forgotPasswordMessage.includes('sent') ? (
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {forgotPasswordMessage}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeForgotPasswordModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  disabled={forgotPasswordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading || !forgotPasswordEmail}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {forgotPasswordLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Start managing your finances today' : 'Welcome back to ExpenseAI'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Google Sign-In enabled */}
          {true && (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Continue with Google'
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>
            </>
          )}


          <form className="space-y-6" noValidate onSubmit={handleAuth}>
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required={isSignUp}
                    value={fullName}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                      validationErrors.fullName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {validationErrors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
                  )}
                </div>



              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type={isSignUp ? "email" : "text"}
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  if (isSignUp) {
                    handleEmailChange(e.target.value);
                  } else {
                    setEmail(e.target.value);
                    // Clear any existing error messages when user starts typing
                    if (toast.show && toast.type === 'error') {
                      setToast({ show: false, message: '', type: 'info' });
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAuth(e);
                  }
                }}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                  validationErrors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAuth(e);
                  }
                }}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                  validationErrors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
              />
              {isSignUp && validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
              {isSignUp && passwordStrength && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Password Strength</span>
                    <span>{passwordStrength.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 80 ? 'bg-green-500' :
                        passwordStrength.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${passwordStrength.score}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Requirements: {passwordStrength.checks?.length ? '✓' : '✗'} 8+ chars,
                      {passwordStrength.checks?.uppercase ? ' ✓' : ' ✗'} uppercase,
                    {passwordStrength.checks?.lowercase ? ' ✓' : ' ✗'} lowercase,
                    {passwordStrength.checks?.number ? ' ✓' : ' ✗'} number,
                    {passwordStrength.checks?.special ? ' ✓' : ' ✗'} special char
                  </div>
                </div>
              )}
            </div>

            {/* Prominent inline error display */}
            {toast.show && toast.type === 'error' && (
              <div 
                style={{
                  backgroundColor: '#fef2f2',
                  border: '2px solid #fca5a5',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>❌</span>
                  <span style={{ color: '#dc2626', fontWeight: '500', fontSize: '16px' }}>
                    {toast.message}
                  </span>
                </div>
              </div>
            )}

            {/* Success message display */}
            {toast.show && toast.type === 'success' && (
              <div 
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '2px solid #86efac',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <span style={{ color: '#16a34a', fontWeight: '500', fontSize: '16px' }}>
                    {toast.message}
                  </span>
                </div>
              </div>
            )}


            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </div>

            {/* Forgot Password Link */}
            {!isSignUp && (
              <div className="text-center mb-4">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => { 
                  setIsSignUp(!isSignUp); 
                  clearForm(); 
                }}
                className="text-sm text-green-600 hover:text-green-500 font-medium"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default AuthPage;
