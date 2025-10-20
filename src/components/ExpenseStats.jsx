import React from 'react';

const ExpenseStats = ({ expenses = [], incomes = [] }) => {
  // Calculate expense statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
  
  // Calculate income statistics
  const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0);
  const averageIncome = incomes.length > 0 ? totalIncomes / incomes.length : 0;
  
  // Get current month expenses
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });
  const monthlyExpenseTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const currentMonthIncomes = incomes.filter(income => {
    const incomeDate = new Date(income.date);
    return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
  });
  const monthlyIncomeTotal = currentMonthIncomes.reduce((sum, income) => sum + income.amount, 0);

  // Get category breakdown
  const expenseCategoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const incomeCategoryTotals = incomes.reduce((acc, income) => {
    acc[income.category] = (acc[income.category] || 0) + income.amount;
    return acc;
  }, {});

  const topExpenseCategory = Object.entries(expenseCategoryTotals).sort(([,a], [,b]) => b - a)[0];
  const topIncomeCategory = Object.entries(incomeCategoryTotals).sort(([,a], [,b]) => b - a)[0];

  // Get recent transactions (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentExpenses = expenses.filter(expense => new Date(expense.date) >= sevenDaysAgo);
  const recentIncomes = incomes.filter(income => new Date(income.date) >= sevenDaysAgo);
  const weeklyExpenseTotal = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const weeklyIncomeTotal = recentIncomes.reduce((sum, income) => sum + income.amount, 0);

  const formatAmount = (amount) => {
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
      'Other': '📦'
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

  return (
    <div className="space-y-6 mb-8">
      {/* Income and Expense Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Expenses */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(totalExpenses)}</p>
            <p className="text-xs text-gray-500">{expenses.length} transactions</p>
          </div>
        </div>
      </div>

      {/* Total Income */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Total Income</p>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(totalIncomes)}</p>
            <p className="text-xs text-gray-500">{incomes.length} transactions</p>
          </div>
        </div>
      </div>

      {/* This Month */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(monthlyExpenseTotal)}</p>
            <p className="text-xs text-gray-500">{currentMonthExpenses.length} expenses</p>
            <p className="text-xs text-green-600">+{formatAmount(monthlyIncomeTotal)} income</p>
          </div>
        </div>
      </div>

      {/* Last 7 Days */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Last 7 Days</p>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(weeklyExpenseTotal)}</p>
            <p className="text-xs text-gray-500">{recentExpenses.length} expenses</p>
            <p className="text-xs text-green-600">+{formatAmount(weeklyIncomeTotal)} income</p>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            {topExpenseCategory || topIncomeCategory ? (
              <span className="text-2xl">
                {topExpenseCategory ? getExpenseCategoryIcon(topExpenseCategory[0]) : getIncomeCategoryIcon(topIncomeCategory[0])}
              </span>
            ) : (
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Top Categories</p>
            {topExpenseCategory ? (
              <>
                <p className="text-lg font-bold text-gray-900">{topExpenseCategory[0]}</p>
                <p className="text-xs text-red-500">-{formatAmount(topExpenseCategory[1])}</p>
              </>
            ) : topIncomeCategory ? (
              <>
                <p className="text-lg font-bold text-gray-900">{topIncomeCategory[0]}</p>
                <p className="text-xs text-green-500">+{formatAmount(topIncomeCategory[1])}</p>
              </>
            ) : (
              <p className="text-lg font-bold text-gray-900">No data</p>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Additional Income Cards */}
      {incomes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Average Income */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Average Income</p>
                <p className="text-2xl font-bold text-gray-900">{formatAmount(averageIncome)}</p>
                <p className="text-xs text-gray-500">per transaction</p>
              </div>
            </div>
          </div>

          {/* Highest Income */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Highest Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAmount(Math.max(...incomes.map(i => i.amount)))}
                </p>
                <p className="text-xs text-gray-500">single transaction</p>
              </div>
            </div>
          </div>

          {/* Net Balance */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                totalIncomes - totalExpenses >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <svg className={`w-6 h-6 ${
                  totalIncomes - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${
                  totalIncomes - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatAmount(totalIncomes - totalExpenses)}
                </p>
                <p className="text-xs text-gray-500">income - expenses</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {(expenses.length > 0 || incomes.length > 0) && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Average expense</p>
                  <p className="text-xl font-bold text-gray-900">{formatAmount(averageExpense)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average income</p>
                  <p className="text-xl font-bold text-gray-900">{formatAmount(averageIncome)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expense categories</p>
                  <p className="text-xl font-bold text-gray-900">{Object.keys(expenseCategoryTotals).length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Income categories</p>
                  <p className="text-xl font-bold text-gray-900">{Object.keys(incomeCategoryTotals).length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseStats;
