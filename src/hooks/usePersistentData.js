import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

// Enhanced persistent data hook that ensures data survives page refreshes
export const usePersistentData = (key, defaultValue = null, options = {}) => {
  const { user } = useSupabaseAuth();
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRestored, setIsRestored] = useState(false);

  const {
    fetchFunction = null,
    autoRefresh = false,
    refreshInterval = 30000,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    userSpecific = true
  } = options;

  // Generate cache key
  const cacheKey = userSpecific && user?.id ? `${key}_${user.id}` : key;

  // Load data from cache immediately on mount
  useEffect(() => {
    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          
          // Check if cache is still valid
          if (parsed.timestamp && (Date.now() - parsed.timestamp) < cacheTimeout) {
            setData(parsed.data);
            setIsRestored(true);
            console.log(`usePersistentData: Restored ${key} from cache`);
          } else {
            console.log(`usePersistentData: Cache expired for ${key}`);
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (error) {
        console.error(`usePersistentData: Error loading ${key} from cache:`, error);
        localStorage.removeItem(cacheKey);
      } finally {
        setLoading(false);
      }
    };

    loadFromCache();
  }, [cacheKey, cacheTimeout]);

  // Save data to cache whenever it changes
  useEffect(() => {
    if (data !== defaultValue && isRestored) {
      try {
        const cacheData = {
          data,
          timestamp: Date.now(),
          userId: user?.id
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(`usePersistentData: Cached ${key}`);
      } catch (error) {
        console.error(`usePersistentData: Error caching ${key}:`, error);
      }
    }
  }, [data, cacheKey, isRestored, user?.id]);

  // Fetch fresh data if fetch function is provided
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!fetchFunction || !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFunction(user.id);
      
      if (result.success) {
        setData(result.data);
        setIsRestored(true);
        
        // Update cache with fresh data
        const cacheData = {
          data: result.data,
          timestamp: Date.now(),
          userId: user.id
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error(`usePersistentData: Error fetching ${key}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, user?.id, cacheKey]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !fetchFunction || !user?.id) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchFunction, refreshInterval, user?.id, fetchData]);

  // Fetch data on mount if no cached data
  useEffect(() => {
    if (fetchFunction && user?.id && !isRestored && !loading) {
      fetchData();
    }
  }, [fetchFunction, user?.id, isRestored, loading, fetchData]);

  // Update data function
  const updateData = useCallback((newData) => {
    setData(newData);
    setIsRestored(true);
  }, []);

  // Clear data function
  const clearData = useCallback(() => {
    setData(defaultValue);
    setIsRestored(false);
    localStorage.removeItem(cacheKey);
  }, [defaultValue, cacheKey]);

  return {
    data,
    loading,
    error,
    isRestored,
    updateData,
    clearData,
    refresh: () => fetchData(true)
  };
};


