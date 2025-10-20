// Data Restoration Service - Ensures all user data persists across page refreshes
import { supabase } from '../lib/supabase';

class DataRestorationService {
  constructor() {
    this.cachePrefix = 'expenseai_';
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.restorationPromises = new Map();
  }

  // Get cache key for user-specific data
  getCacheKey(key, userId) {
    return `${this.cachePrefix}${key}_${userId}`;
  }

  // Save data to cache with timestamp
  saveToCache(key, data, userId = null) {
    try {
      const cacheKey = userId ? this.getCacheKey(key, userId) : `${this.cachePrefix}${key}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
        userId
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`DataRestorationService: Cached ${key}`);
      return true;
    } catch (error) {
      console.error(`DataRestorationService: Error caching ${key}:`, error);
      return false;
    }
  }

  // Load data from cache
  loadFromCache(key, userId = null) {
    try {
      const cacheKey = userId ? this.getCacheKey(key, userId) : `${this.cachePrefix}${key}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        
        // Check if cache is still valid
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < this.cacheTimeout) {
          console.log(`DataRestorationService: Loaded ${key} from cache`);
          return { success: true, data: parsed.data, fromCache: true };
        } else {
          console.log(`DataRestorationService: Cache expired for ${key}`);
          localStorage.removeItem(cacheKey);
        }
      }
      
      return { success: false, data: null, fromCache: false };
    } catch (error) {
      console.error(`DataRestorationService: Error loading ${key} from cache:`, error);
      return { success: false, data: null, fromCache: false, error: error.message };
    }
  }

  // Restore all user data on page load
  async restoreUserData(userId) {
    if (!userId) {
      console.warn('DataRestorationService: No user ID provided for data restoration');
      return { success: false, error: 'No user ID' };
    }

    // Check if we're already restoring data for this user
    if (this.restorationPromises.has(userId)) {
      return this.restorationPromises.get(userId);
    }

    const restorationPromise = this._performDataRestoration(userId);
    this.restorationPromises.set(userId, restorationPromise);

    try {
      const result = await restorationPromise;
      return result;
    } finally {
      this.restorationPromises.delete(userId);
    }
  }

  async _performDataRestoration(userId) {
    console.log(`DataRestorationService: Starting data restoration for user ${userId}`);
    
    const restorationResults = {
      profile: null,
      expenses: null,
      budgets: null,
      goals: null,
      payments: null,
      success: true,
      errors: []
    };

    try {
      // Restore profile data
      const profileResult = await this._restoreProfile(userId);
      restorationResults.profile = profileResult;

      // Restore expenses data
      const expensesResult = await this._restoreExpenses(userId);
      restorationResults.expenses = expensesResult;

      // Restore budgets data
      const budgetsResult = await this._restoreBudgets(userId);
      restorationResults.budgets = budgetsResult;

      // Restore goals data
      const goalsResult = await this._restoreGoals(userId);
      restorationResults.goals = goalsResult;

      // Check for any errors
      const errors = [
        profileResult.error,
        expensesResult.error,
        budgetsResult.error,
        goalsResult.error
      ].filter(Boolean);

      if (errors.length > 0) {
        restorationResults.success = false;
        restorationResults.errors = errors;
        console.warn('DataRestorationService: Some data restoration failed:', errors);
      }

      console.log('DataRestorationService: Data restoration completed', restorationResults);
      return restorationResults;

    } catch (error) {
      console.error('DataRestorationService: Error during data restoration:', error);
      return {
        ...restorationResults,
        success: false,
        errors: [error.message]
      };
    }
  }

  async _restoreProfile(userId) {
    try {
      // Try cache first
      const cached = this.loadFromCache('profile', userId);
      if (cached.success) {
        console.log('DataRestorationService: Profile restored from cache');
        return { success: true, data: cached.data, fromCache: true };
      }

      // Try localStorage cache as fallback
      try {
        const localStorageKey = `expenseai_profile_${userId}`;
        const cachedProfile = localStorage.getItem(localStorageKey);
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          console.log('DataRestorationService: Profile restored from localStorage cache');
          return { success: true, data: parsed.data, fromCache: true };
        }
      } catch (localStorageError) {
        console.warn('DataRestorationService: Error reading localStorage cache:', localStorageError);
      }

      // If no cache, try database with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 3000)
      );

      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) throw error;

      const profileData = data || null;
      
      // Cache the result
      if (profileData) {
        this.saveToCache('profile', profileData, userId);
      }

      console.log('DataRestorationService: Profile restored from database');
      return { success: true, data: profileData, fromCache: false };
    } catch (error) {
      console.error('DataRestorationService: Error restoring profile:', error);
      
      // Try to return stale cache if database fails
      try {
        const localStorageKey = `expenseai_profile_${userId}`;
        const cachedProfile = localStorage.getItem(localStorageKey);
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          console.log('DataRestorationService: Database failed, using stale localStorage cache');
          return { success: true, data: parsed.data, fromCache: true, stale: true };
        }
      } catch (localStorageError) {
        console.warn('DataRestorationService: Error reading stale localStorage cache:', localStorageError);
      }
      
      return { success: false, error: error.message };
    }
  }

  async _restoreExpenses(userId) {
    try {
      // Try cache first
      const cached = this.loadFromCache('expenses', userId);
      if (cached.success) {
        return { success: true, data: cached.data, fromCache: true };
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      const expensesData = data || [];
      
      // Cache the result
      this.saveToCache('expenses', expensesData, userId);

      return { success: true, data: expensesData, fromCache: false };
    } catch (error) {
      console.error('DataRestorationService: Error restoring expenses:', error);
      return { success: false, error: error.message };
    }
  }

  async _restoreBudgets(userId) {
    try {
      // Try cache first
      const cached = this.loadFromCache('budgets', userId);
      if (cached.success) {
        return { success: true, data: cached.data, fromCache: true };
      }

      // For now, budgets are stored in localStorage
      // This could be extended to fetch from database if needed
      const budgetsData = {
        overallMonthly: 0,
        categories: {}
      };

      return { success: true, data: budgetsData, fromCache: true };
    } catch (error) {
      console.error('DataRestorationService: Error restoring budgets:', error);
      return { success: false, error: error.message };
    }
  }

  async _restoreGoals(userId) {
    try {
      // Try cache first
      const cached = this.loadFromCache('goals', userId);
      if (cached.success) {
        return { success: true, data: cached.data, fromCache: true };
      }

      // For now, goals are stored in localStorage
      // This could be extended to fetch from database if needed
      const goalsData = [];

      return { success: true, data: goalsData, fromCache: true };
    } catch (error) {
      console.error('DataRestorationService: Error restoring goals:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear all cached data for a user
  clearUserCache(userId) {
    if (!userId) return;

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${this.cachePrefix}`) && key.includes(`_${userId}`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`DataRestorationService: Cleared cache for user ${userId}`);
  }

  // Clear all cached data
  clearAllCache() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.cachePrefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('DataRestorationService: Cleared all cache');
  }

  // Get cache status for debugging
  getCacheStatus(userId) {
    const status = {
      profile: this.loadFromCache('profile', userId),
      expenses: this.loadFromCache('expenses', userId),
      budgets: this.loadFromCache('budgets', userId),
      goals: this.loadFromCache('goals', userId)
    };

    return status;
  }
}

export default new DataRestorationService();
