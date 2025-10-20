import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import HouseholdExpenseForm from './HouseholdExpenseForm';
import QuickExpenseButtons from './QuickExpenseButtons';
import RecurringExpensesManager from './RecurringExpensesManager';
import ExpenseChangeIndicator from './ExpenseChangeIndicator';

const HouseholdExpenseDashboard = () => {
  const { user } = useSupabaseAuth();
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [monthlyStats, setMonthlyStats] = useState({
    total: 0,
    utilities: 0,
    food: 0,
    transport: 0,
    other: 0
  });
  const [recurringRefreshKey, setRecurringRefreshKey] = useState(0);

  // Load cached expenses and stats immediately for better UX on refresh
  useEffect(() => {
    const cached = localStorage.getItem('household_expenses');
    const cachedStats = localStorage.getItem('household_monthly_stats');
    
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        setExpenses(cachedData);
        calculateMonthlyStats(cachedData);
      } catch (error) {
        console.error('Error parsing cached expenses:', error);
      }
    }
    
    if (cachedStats) {
      try {
        const parsedStats = JSON.parse(cachedStats);
        setMonthlyStats(parsedStats);
      } catch (error) {
        console.error('Error parsing cached stats:', error);
      }
    }
  }, []);

  // Load expenses and incomes from database
  useEffect(() => {
    if (user?.id) {
      loadExpenses();
      loadIncomes();
    }
  }, [user?.id]);

  // Save expenses to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem('household_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Save monthly stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('household_monthly_stats', JSON.stringify(monthlyStats));
  }, [monthlyStats]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      // Compute first and last day of current month accurately
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading expenses from DB:', error);
        // Load from cache
        const cached = localStorage.getItem('household_expenses');
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            setExpenses(cachedData);
            calculateMonthlyStats(cachedData);
          } catch (parseError) {
            console.error('Error parsing cached expenses:', parseError);
            setExpenses([]);
            calculateMonthlyStats([]);
          }
        } else {
          setExpenses([]);
          calculateMonthlyStats([]);
        }
      } else {
        const normalized = (data || []).map((e) => ({
          ...e,
          amount: Number(e.amount)
        }));
        setExpenses(normalized);
        calculateMonthlyStats(normalized);
      }
    } catch (error) {
      console.error('Exception loading expenses:', error);
      // Load from cache
      const cached = localStorage.getItem('household_expenses');
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          setExpenses(cachedData);
          calculateMonthlyStats(cachedData);
        } catch (parseError) {
          console.error('Error parsing cached expenses:', parseError);
          setExpenses([]);
          calculateMonthlyStats([]);
        }
      } else {
        setExpenses([]);
        calculateMonthlyStats([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadIncomes = async () => {
    try {
      // Compute first and last day of current month accurately
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading incomes from DB:', error);
        setIncomes([]);
      } else {
        const normalized = (data || []).map((i) => ({
          ...i,
          amount: Number(i.amount)
        }));
        setIncomes(normalized);
      }
    } catch (error) {
      console.error('Error in loadIncomes:', error);
      setIncomes([]);
    }
  };

  const calculateMonthlyStats = (expenseData) => {
    const stats = {
      total: 0,
      utilities: 0,
      food: 0,
      transport: 0,
      other: 0
    };

    const normalize = (val) => (val || '').toString().trim().toLowerCase();

    expenseData.forEach(expense => {
      const amt = Number(expense.amount) || 0;
      stats.total += amt;

      const label = normalize(expense.category) || normalize(expense.subcategory);

      if (['utilities', 'electricity', 'water', 'gas', 'internet/broadband'].includes(label)) {
        stats.utilities += amt;
      } else if (['food & groceries', 'food', 'groceries'].includes(label)) {
        stats.food += amt;
      } else if (['transportation', 'transport', 'fuel/petrol', 'taxi', 'cab', 'bus', 'train'].includes(label)) {
        stats.transport += amt;
      } else {
        stats.other += amt;
      }
    });

    setMonthlyStats(stats);
  };

  const handleExpenseAdded = (newExpense) => {
    setExpenses(prev => {
      const updated = [newExpense, ...prev];
      calculateMonthlyStats(updated);
      // If the newly added expense is recurring, bump refresh key to reload recurring list
      if (newExpense?.is_recurring) {
        setRecurringRefreshKey((k) => k + 1);
      }
      return updated;
    });
    setShowAddForm(false);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Mobile Recharge': '📱',
      'Electricity Bill': '💡',
      'Internet/Broadband': '🌐',
      'EMI/Loan Payment': '🏦',
      'Groceries': '🛒',
      'Fuel/Petrol': '⛽',
      'Water Bill': '💧',
      'Gas Bill': '🔥',
      'Rent/Mortgage': '🏠',
      'Credit Card Payment': '💳'
    };
    return icons[category] || '📝';
  };

  const getIncomeIcon = (category) => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Household Expenses</h2>
        </div>

        {/* Monthly Stats */}
        {loading ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-sm opacity-90">Total This Month</div>
              <div className="text-2xl font-bold">₹{monthlyStats.total.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
              <div className="text-sm opacity-90">Utilities</div>
              <div className="text-2xl font-bold">₹{monthlyStats.utilities.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
              <div className="text-sm opacity-90">Food & Groceries</div>
              <div className="text-2xl font-bold">₹{monthlyStats.food.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
              <div className="text-sm opacity-90">Transportation</div>
              <div className="text-2xl font-bold">₹{monthlyStats.transport.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'quick', label: 'Quick Add', icon: '⚡' },
              { id: 'recurring', label: 'Recurring', icon: '🔄' },
              { id: 'recent', label: 'Recent', icon: '📝' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <QuickExpenseButtons onExpenseAdded={handleExpenseAdded} />
              <RecurringExpensesManager refreshKey={recurringRefreshKey} />
            </div>
          )}

          {activeTab === 'quick' && (
            <QuickExpenseButtons onExpenseAdded={handleExpenseAdded} />
          )}

          {activeTab === 'recurring' && (
            <RecurringExpensesManager refreshKey={recurringRefreshKey} />
          )}

          {activeTab === 'recent' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
              {expenses.length === 0 && incomes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📝</div>
                  <p className="text-gray-600">No activities found for this month</p>
                  <p className="text-sm text-gray-500">Add your first income or expense to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...expenses.map(e => ({ ...e, type: 'expense' })), ...incomes.map(i => ({ ...i, type: 'income' }))]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 10)
                    .map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                        item.type === 'income' 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {item.type === 'income' ? getIncomeIcon(item.category) : getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.category}</div>
                          <div className="text-sm text-gray-600">
                            {formatDate(item.date)} • {item.payment_method || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          item.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString()}
                        </div>
                        {item.is_recurring && (
                          <div className="text-xs text-blue-600">Recurring</div>
                        )}
                        <div className={`text-xs ${
                          item.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {item.type === 'income' ? 'Income' : 'Expense'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <HouseholdExpenseForm
              onExpenseAdded={handleExpenseAdded}
              onClose={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {/* Expense Change Indicator */}
      <ExpenseChangeIndicator expenses={expenses} showOnRefresh={true} />
    </div>
  );
};

export default HouseholdExpenseDashboard;