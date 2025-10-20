import { useState, useEffect, useCallback } from 'react';

// Hook for reliable data fetching with validation
export const useReliableData = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Validate data completeness
  const validateData = useCallback((data) => {
    if (!data) return false;
    
    // Check if data has all required fields
    const requiredFields = ['user_id', 'full_name', 'email'];
    return requiredFields.every(field => data[field] !== undefined && data[field] !== null);
  }, []);

  // Load data with validation
  const loadData = useCallback(async (showLoading = true) => {
    if (!fetchFunction) return;

    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsValidating(true);
      }
      setError(null);

      const result = await fetchFunction();
      
      if (result.success && result.data) {
        // Validate data completeness
        if (validateData(result.data)) {
          setData(result.data);
          console.log('ReliableData: Data loaded and validated successfully');
        } else {
          console.warn('ReliableData: Data validation failed, retrying...');
          // Retry once more if validation fails
          const retryResult = await fetchFunction();
          if (retryResult.success && retryResult.data && validateData(retryResult.data)) {
            setData(retryResult.data);
            console.log('ReliableData: Data loaded after retry');
          } else {
            throw new Error('Data validation failed after retry');
          }
        }
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('ReliableData: Error loading data:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  }, [fetchFunction, validateData]);

  // Initialize
  useEffect(() => {
    loadData();
  }, [loadData, ...dependencies]);

  // Refresh data
  const refresh = useCallback(() => {
    loadData(false);
  }, [loadData]);

  return {
    data,
    loading,
    isValidating,
    error,
    refresh,
    isValid: data ? validateData(data) : false
  };
};


