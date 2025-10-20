import { useState, useEffect, useCallback } from 'react';
import expenseTrackingService from '../services/expenseTrackingService';

export const useExpenseTracking = (expenses) => {
  const [changeData, setChangeData] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const calculateChange = useCallback(() => {
    if (!expenses || expenses.length === 0) {
      setChangeData(null);
      return null;
    }

    const change = expenseTrackingService.getExpenseChange(expenses);
    setChangeData(change);
    return change;
  }, [expenses]);

  const resetTracking = useCallback(() => {
    expenseTrackingService.resetTracking();
    setChangeData(null);
  }, []);

  const getTotalExpenses = useCallback(() => {
    return expenseTrackingService.calculateTotalExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    calculateChange();
  }, [calculateChange]);

  return {
    changeData,
    isTracking,
    calculateChange,
    resetTracking,
    getTotalExpenses,
    hasChange: changeData && !changeData.isNoChange,
    isIncrease: changeData?.isIncrease || false,
    isDecrease: changeData?.isDecrease || false,
    changeAmount: changeData?.amount || 0,
    changePercentage: changeData?.percentage || 0
  };
};

export default useExpenseTracking;


