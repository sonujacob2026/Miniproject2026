import React from 'react';

const RecentTransactions = ({ expenses = [], incomes = [] }) => {
  console.log('RecentTransactions: Received data:', { 
    expensesCount: expenses.length, 
    incomesCount: incomes.length,
    expenses: expenses.slice(0, 3), // Log first 3 expenses
    incomes: incomes.slice(0, 3)    // Log first 3 incomes
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getExpenseCategoryIcon = (category) => {
    const icons = {
      'Food & Dining': '🍽️',
      'Transportation': '🚗',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Bills & Utilities': '📄',
      'Healthcare': '🏥',
      'Education': '📚',
      'Travel': '✈️',
      'Groceries': '🛒',
      'Gas': '⛽',
      'Other': '📦',
      'Food': '🍽️',
      'Transport': '🚗',
      'Bills': '📄',
      'EMI': '🏦',
      'Entertainment': '🎬',
      'Education': '📚',
      'Investments': '📈',
      'Rent': '🏠'
    };
    return icons[category] || '📦';
  };

  const getIncomeCategoryIcon = (category) => {
    const icons = {
      'Salary': '💼',
      'Freelance': '💻',
      'Business': '🏢',
      'Investments': '📈',
      'Rental Income': '🏠',
      'Sales': '🛒',
      'Bonus': '🎁',
      'Agriculture': '🌾',
      'Transport': '🚛',
      'Other': '💰'
    };
    return icons[category] || '💰';
  };

  // Combine and sort all transactions by date
  const allTransactions = [
    ...expenses.map(expense => ({
      ...expense,
      type: 'expense',
      _type: 'Expense',
      _date: new Date(expense.date)
    })),
    ...incomes.map(income => ({
      ...income,
      type: 'income',
      _type: 'Income',
      _date: new Date(income.date)
    }))
  ].sort((a, b) => b._date - a._date).slice(0, 10); // Show only recent 10 transactions

  if (allTransactions.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500">No transactions yet</p>
          <p className="text-gray-400 text-sm">Start adding expenses and incomes to see your recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
      
      <div className="space-y-3">
        {allTransactions.map((transaction, index) => (
          <div
            key={`${transaction.type}-${transaction.id}-${index}`}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              transaction.type === 'income' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                transaction.type === 'income' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {transaction.type === 'income' 
                  ? getIncomeCategoryIcon(transaction.category)
                  : getExpenseCategoryIcon(transaction.category)
                }
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    transaction.type === 'income'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {transaction._type}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {transaction.category}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {transaction.description || transaction.subcategory || 'No description'}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDate(transaction.date)}
                </div>
              </div>
            </div>
            <div className={`text-right ${
              transaction.type === 'income' 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              <div className="text-sm font-semibold">
                {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
              </div>
              <div className="text-xs text-gray-500">
                {transaction.payment_method || transaction.paymentMethod || 'N/A'}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Showing {allTransactions.length} recent transactions</span>
          <span>
            {expenses.length} expenses • {incomes.length} incomes
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactions;
