import React, { useState, useEffect } from 'react';
import expenseTrackingService from '../services/expenseTrackingService';

const ExpenseChangeIndicator = ({ expenses, showOnRefresh = true }) => {
  const [changeData, setChangeData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (expenses && expenses.length > 0) {
      const change = expenseTrackingService.getExpenseChange(expenses);
      setChangeData(change);
      
      // Show indicator if there's a change and showOnRefresh is true
      if (showOnRefresh && (change.isIncrease || change.isDecrease)) {
        setIsVisible(true);
        setIsAnimating(true);
        
        // Auto-hide after 5 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
          setIsAnimating(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [expenses, showOnRefresh]);

  const handleClose = () => {
    setIsVisible(false);
    setIsAnimating(false);
  };

  if (!isVisible || !changeData || changeData.isNoChange) {
    return null;
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percentage) => {
    return Math.abs(percentage).toFixed(1);
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-500 ease-in-out ${
      isAnimating ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'
    }`}>
      <div className={`bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-sm ${
        changeData.isIncrease 
          ? 'border-red-500 bg-red-50' 
          : 'border-green-500 bg-green-50'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              changeData.isIncrease 
                ? 'bg-red-100 text-red-600' 
                : 'bg-green-100 text-green-600'
            }`}>
              {changeData.isIncrease ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className={`text-sm font-semibold ${
                changeData.isIncrease ? 'text-red-800' : 'text-green-800'
              }`}>
                {changeData.isIncrease ? 'Expense Increased' : 'Expense Decreased'}
              </h4>
              <p className={`text-lg font-bold ${
                changeData.isIncrease ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatAmount(changeData.amount)}
              </p>
              {changeData.percentage > 0 && (
                <p className={`text-xs ${
                  changeData.isIncrease ? 'text-red-600' : 'text-green-600'
                }`}>
                  {changeData.isIncrease ? '+' : '-'}{formatPercentage(changeData.percentage)}% from last refresh
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className={`flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors ${
              changeData.isIncrease ? 'hover:text-red-600' : 'hover:text-green-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Page refreshed at {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ExpenseChangeIndicator;


