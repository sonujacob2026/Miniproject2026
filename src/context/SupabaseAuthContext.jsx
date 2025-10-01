import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, auth } from '../lib/supabase';

const SupabaseAuthContext = createContext({});

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const startTime = performance.now();
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        // Handle OAuth callback events more smoothly
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in via OAuth:', session.user.email);
          
          // Skip processing if this is an admin user (handled by admin system)
          if (session.user.email === 'admin@gmail.com') {
            console.log('Admin user detected in Supabase auth, ignoring...');
            return;
          }
          
          // Check user status in background (non-blocking)
          supabase
            .from('user_profiles')
            .select('status')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data: userProfile, error: profileError }) => {
              if (profileError) {
                console.warn('Could not fetch user profile for OAuth user:', profileError);
              } else if (userProfile?.status === 'suspended') {
                console.log('OAuth user account is suspended, signing out...');
                supabase.auth.signOut();
              }
            })
            .catch((statusError) => {
              console.warn('Error checking OAuth user status:', statusError);
            });
          
          // Set user immediately for faster loading
          setSession(session);
          setUser(session.user);
          setLoading(false);

          // Ensure a user_profiles row exists and is linked to this user_id
          try {
            const now = new Date().toISOString();
            const { error: upsertErr } = await supabase
              .from('user_profiles')
              .upsert(
                {
                  user_id: session.user.id,
                  email: session.user.email,
                  last_login_at: now,
                  updated_at: now
                },
                { onConflict: 'user_id' }
              );
            if (upsertErr) {
              console.warn('user_profiles upsert on SIGNED_IN warning:', upsertErr);
            }
          } catch (e) {
            console.warn('user_profiles upsert on SIGNED_IN exception:', e);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing state');
          setSession(null);
          setUser(null);
          setLoading(false);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email and password
  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true);
      console.log('📝 Attempting sign up with:', { email, fullName });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            onboarding_completed: false
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      console.log('📝 Sign up response:', { data, error });

      if (error) {
        console.error('❌ Sign up error:', error);
        
        // Enhanced error handling for better user experience
        let errorMessage = error.message;

        if (error.message.includes('User already registered') || 
            error.message.includes('already exists')) {
          errorMessage = 'This email is already registered. Please sign in instead or use a different email address.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password') && error.message.includes('weak')) {
          errorMessage = 'Password is too weak. Please choose a stronger password with at least 8 characters.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many signup attempts. Please wait a few minutes before trying again.';
        }

        return { user: null, error: errorMessage };
      }

      // If user created, ensure a row exists in user_profiles
      if (data?.user) {
        try {
          const { id, email: userEmail, app_metadata, email_confirmed_at } = data.user;
          const now = new Date().toISOString();
          const provider = app_metadata?.provider || 'email';
          const { error: upsertErr } = await supabase
            .from('user_profiles')
            .upsert(
              {
                user_id: id,
                username,
                full_name: fullName ?? null,
                email: userEmail,
                provider,
                role: 'user',
                is_active: true,
                email_verified: !!email_confirmed_at,
                onboarding_completed: false,
                created_at: now,
                updated_at: now
              },
              { onConflict: 'user_id' }
            );
          if (upsertErr) {
            const msg = upsertErr.message || '';
            const code = upsertErr.code || '';
            if (code === '23505' || (msg.includes('username') && (msg.includes('duplicate') || msg.includes('already exists')))) {
              return { user: null, error: 'Username is already taken' };
            }
            console.warn('user_profiles upsert warning:', upsertErr);
          }
        } catch (e) {
          console.warn('user_profiles upsert exception:', e);
        }
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('📧 Email confirmation required for:', data.user.email);
        return {
          user: data.user,
          error: null,
          message: 'Please check your email and click the confirmation link to complete your registration.'
        };
      }

      console.log('✅ Sign up successful:', data.user);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      return { user: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting sign in with:', email);

      // Allow admin email to be processed but will be handled by admin system
      if (email === 'admin@gmail.com') {
        console.log('Admin email detected, this will be handled by admin authentication...');
        setLoading(false);
        return { user: null, error: 'Admin access - please use admin credentials' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('🔐 Sign in response:', { data, error });

      if (error) {
        console.error('❌ Sign in error:', error);

        // Enhanced error handling for better user experience
        let errorMessage = error.message;

        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('User not found') || 
                   error.message.includes('does not exist')) {
          errorMessage = 'Account not found. Please check your email or create a new account.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
        } else if (error.message.includes('Account disabled')) {
          errorMessage = 'Your account has been disabled. Please contact support for assistance.';
        }

        return {
          user: null,
          error: errorMessage
        };
      }

      console.log('✅ Sign in successful:', data.user);

      // Check user status before allowing login
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('status, full_name')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) {
          console.warn('Could not fetch user profile:', profileError);
        } else if (userProfile?.status === 'suspended') {
          console.log('User account is suspended, signing out...');
          // Sign out the user immediately
          await supabase.auth.signOut();
          return {
            user: null,
            error: 'Your account has been disabled. Please contact support for assistance.'
          };
        }
      } catch (statusError) {
        console.warn('Error checking user status:', statusError);
        // Continue with login if status check fails (don't block legitimate users)
      }

      // Update local state immediately
      setUser(data.user);
      setSession(data.session);

      // Update profile last_login_at and email_verified, create row if missing
      try {
        const { id, email: userEmail, email_confirmed_at } = data.user;
        const now = new Date().toISOString();
        const { error: upsertErr } = await supabase
          .from('user_profiles')
          .upsert(
            {
              user_id: id,
              email: userEmail,
              last_login_at: now,
              email_verified: !!email_confirmed_at,
              updated_at: now
            },
            { onConflict: 'user_id' }
          );
        if (upsertErr) {
          console.warn('user_profiles sign-in upsert warning:', upsertErr);
        }
      } catch (e) {
        console.warn('user_profiles sign-in upsert exception:', e);
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { user: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        // Return the full error object so callers can inspect error.message
        return { user: null, error };
      }

      // Note: For OAuth, the user will be redirected and the auth state change will handle the rest
      return { user: null, error: null };
    } catch (error) {
      // Return the caught error object for consistent shape
      return { user: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    console.log('SupabaseAuth: Signing out user...');
    
    // Clear local state IMMEDIATELY - this triggers immediate redirect
    console.log('SupabaseAuth: Clearing user state immediately');
    setUser(null);
    setSession(null);
    setLoading(false);

    // Clear localStorage keys related to user data to prevent stale data
    try {
      localStorage.removeItem('expenseai_expenses');
      localStorage.removeItem('questionnaire_banner_dismissed');
      // Add any other keys that should be cleared on sign out here
      console.log('SupabaseAuth: Cleared localStorage keys on sign out');
    } catch (e) {
      console.warn('SupabaseAuth: Error clearing localStorage on sign out:', e);
    }
    
    // Call signOut in background (don't wait for it)
    auth.signOut().catch(error => {
      console.warn('SupabaseAuth: Background signOut error:', error);
    });

    console.log('SupabaseAuth: Sign out initiated - redirecting immediately');
    return { error: null };
  };

  // Reset password with email (legacy function name)
  const forgotPassword = async (email) => {
    try {
      const { data, error } = await auth.resetPassword(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Reset password with email
  const resetPasswordForEmail = async (email) => {
    try {
      setLoading(true);
      console.log('📧 Sending password reset email to:', email);
      console.log('📍 Redirect URL:', `${window.location.origin}/reset-password`);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('❌ resetPasswordForEmail error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Password reset email sent successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ resetPasswordForEmail exception:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update password (called after user clicks reset link)
  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);
      console.log('🔐 Updating password...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ updatePassword error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Password updated successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ updatePassword exception:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Send OTP to email (for passwordless sign-in)
  const sendOtp = async (email) => {
    try {
      setLoading(true);
      console.log('📱 Sending OTP to:', email);
      
      const { data, error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/reset-password`
        }
      });

      if (error) {
        console.error('❌ sendOtp error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ OTP sent successfully');
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ sendOtp exception:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and sign in (for passwordless sign-in)
  const verifyOtp = async (email, token) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) {
        console.error('❌ verifyOtp error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null, user: data.user };
    } catch (error) {
      console.error('❌ verifyOtp exception:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Mock validation functions (you can implement real validation if needed)

  const validateEmail = async (email) => {
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { available: false, message: 'Invalid email format' };
    }
    return { available: true, message: null };
  };

  const validatePassword = async (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length * 20;
    const isValid = score >= 80;

    return {
      data: {
        isValid,
        score,
        checks
      }
    };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    forgotPassword,
    resetPasswordForEmail,
    updatePassword,
    sendOtp,
    verifyOtp,
    validateEmail,
    validatePassword
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export default SupabaseAuthContext;
