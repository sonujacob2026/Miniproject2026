import { useState, useEffect, useCallback } from 'react';

// Hook for instant loading with background refresh
export const useInstantLoading = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load cached data instantly
  const loadCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem('instant_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < 5 * 60 * 1000) { // 5 minutes
          setData(parsed.data);
          setLoading(false);
          console.log('Instant loading: Data loaded from cache');
          return true;
        }
      }
    } catch (error) {
      console.warn('Instant loading: Error loading cached data:', error);
    }
    return false;
  }, []);

  // Save data to cache
  const saveToCache = useCallback((newData) => {
    try {
      const cacheData = {
        data: newData,
        timestamp: Date.now()
      };
      localStorage.setItem('instant_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Instant loading: Error saving to cache:', error);
    }
  }, []);

  // Fetch fresh data
  const fetchFreshData = useCallback(async () => {
    if (!fetchFunction) return;

    try {
      setRefreshing(true);
      setError(null);

      const result = await fetchFunction();
      
      if (result.success) {
        setData(result.data);
        saveToCache(result.data);
        console.log('Instant loading: Fresh data fetched and cached');
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Instant loading: Error fetching fresh data:', err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFunction, saveToCache]);

  // Initialize
  useEffect(() => {
    // Load cached data instantly
    const hasCachedData = loadCachedData();
    
    // Fetch fresh data in background
    fetchFreshData();
  }, [loadCachedData, fetchFreshData, ...dependencies]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: fetchFreshData
  };
};


