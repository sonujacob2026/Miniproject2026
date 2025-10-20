import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import DataRestorationService from '../services/dataRestorationService';

export const useDataRestoration = () => {
  const { user } = useSupabaseAuth();
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorationComplete, setRestorationComplete] = useState(false);
  const [restorationError, setRestorationError] = useState(null);
  const [restorationProgress, setRestorationProgress] = useState(0);

  useEffect(() => {
    const restoreData = async () => {
      if (!user?.id) {
        setRestorationComplete(true);
        return;
      }

      try {
        setIsRestoring(true);
        setRestorationError(null);
        setRestorationProgress(0);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setRestorationProgress(prev => {
            if (prev < 90) return prev + 10;
            return prev;
          });
        }, 200);

        // Perform actual data restoration
        const result = await DataRestorationService.restoreUserData(user.id);
        
        clearInterval(progressInterval);
        setRestorationProgress(100);

        if (result.success) {
          console.log('Data restoration completed successfully');
        } else {
          console.warn('Data restoration completed with errors:', result.errors);
          setRestorationError(result.errors.join(', '));
        }

        setRestorationComplete(true);
      } catch (error) {
        console.error('Data restoration failed:', error);
        setRestorationError(error.message);
        setRestorationComplete(true);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreData();
  }, [user?.id]);

  const retryRestoration = async () => {
    setRestorationComplete(false);
    setRestorationError(null);
    setRestorationProgress(0);
    
    // Trigger re-restoration
    if (user?.id) {
      const result = await DataRestorationService.restoreUserData(user.id);
      setRestorationComplete(true);
      if (!result.success) {
        setRestorationError(result.errors.join(', '));
      }
    }
  };

  const clearCache = () => {
    if (user?.id) {
      DataRestorationService.clearUserCache(user.id);
      setRestorationComplete(false);
      setRestorationError(null);
      setRestorationProgress(0);
    }
  };

  return {
    isRestoring,
    restorationComplete,
    restorationError,
    restorationProgress,
    retryRestoration,
    clearCache
  };
};


