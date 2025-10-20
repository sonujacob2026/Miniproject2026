// Utility function to clear authentication state
export const clearAuthState = () => {
  try {
    // Clear all authentication-related localStorage items
    const keysToRemove = [
      'admin_token',
      'admin_user', 
      'admin_mode',
      'supabase_session',
      'expenseai_expenses',
      'household_expenses',
      'household_monthly_stats',
      'cached_profile',
      'questionnaire_banner_dismissed'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('Auth state cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing auth state:', error);
    return false;
  }
};

// Function to reset admin state specifically
export const clearAdminState = () => {
  try {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_mode');
    console.log('Admin state cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing admin state:', error);
    return false;
  }
};

// Function to reset regular user state specifically
export const clearUserState = () => {
  try {
    localStorage.removeItem('supabase_session');
    localStorage.removeItem('cached_profile');
    localStorage.removeItem('expenseai_expenses');
    localStorage.removeItem('household_expenses');
    localStorage.removeItem('household_monthly_stats');
    localStorage.removeItem('questionnaire_banner_dismissed');
    console.log('User state cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing user state:', error);
    return false;
  }
};

// Function to completely reset auth and redirect to login
export const resetAuthAndRedirect = async () => {
  try {
    // Import supabase dynamically to avoid circular imports
    const { supabase } = await import('../lib/supabase');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear all auth state
    clearAuthState();
    
    // Redirect to login page
    window.location.href = '/login';
    
    console.log('Auth reset and redirected to login');
    return true;
  } catch (error) {
    console.error('Error resetting auth:', error);
    return false;
  }
};
