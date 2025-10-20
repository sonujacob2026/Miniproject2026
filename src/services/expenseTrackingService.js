class ExpenseTrackingService {
  constructor() {
    this.storageKey = 'expenseai_expense_tracking';
    this.lastTotalKey = 'expenseai_last_total_expense';
  }

  // Calculate total expenses from expense array
  calculateTotalExpenses(expenses) {
    if (!expenses || !Array.isArray(expenses)) {
      return 0;
    }
    
    return expenses.reduce((total, expense) => {
      return total + (parseFloat(expense.amount) || 0);
    }, 0);
  }

  // Get the last stored total expense
  getLastTotalExpense() {
    try {
      const lastTotal = localStorage.getItem(this.lastTotalKey);
      return lastTotal ? parseFloat(lastTotal) : 0;
    } catch (error) {
      console.error('Error getting last total expense:', error);
      return 0;
    }
  }

  // Store the current total expense
  storeCurrentTotalExpense(total) {
    try {
      localStorage.setItem(this.lastTotalKey, total.toString());
    } catch (error) {
      console.error('Error storing current total expense:', error);
    }
  }

  // Calculate expense change (current - previous)
  calculateExpenseChange(currentTotal) {
    const lastTotal = this.getLastTotalExpense();
    const change = currentTotal - lastTotal;
    
    // Store current total for next comparison
    this.storeCurrentTotalExpense(currentTotal);
    
    return {
      amount: Math.abs(change),
      isIncrease: change > 0,
      isDecrease: change < 0,
      isNoChange: change === 0,
      percentage: lastTotal > 0 ? ((change / lastTotal) * 100) : 0
    };
  }

  // Get expense change data
  getExpenseChange(expenses) {
    const currentTotal = this.calculateTotalExpenses(expenses);
    return this.calculateExpenseChange(currentTotal);
  }

  // Reset tracking (useful for new users or when starting fresh)
  resetTracking() {
    try {
      localStorage.removeItem(this.lastTotalKey);
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error resetting expense tracking:', error);
    }
  }

  // Get tracking history (optional feature)
  getTrackingHistory() {
    try {
      const history = localStorage.getItem(this.storageKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting tracking history:', error);
      return [];
    }
  }

  // Add to tracking history (optional feature)
  addToHistory(changeData) {
    try {
      const history = this.getTrackingHistory();
      const entry = {
        timestamp: new Date().toISOString(),
        ...changeData
      };
      
      history.push(entry);
      
      // Keep only last 30 entries
      if (history.length > 30) {
        history.splice(0, history.length - 30);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error adding to tracking history:', error);
    }
  }
}

// Create and export singleton instance
const expenseTrackingService = new ExpenseTrackingService();
export default expenseTrackingService;


