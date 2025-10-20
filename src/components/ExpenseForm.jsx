import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import EnhancedReceiptUpload from './EnhancedReceiptUpload';
import expenseCategoriesService from '../services/expenseCategoriesService';

const ExpenseForm = () => {
  const { user } = useSupabaseAuth();
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    paymentMethod: 'UPI',
    date: new Date().toISOString().split('T')[0],
    description: '',
    receiptUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Payment methods

  const paymentMethods = ['UPI', 'Card', 'Cash', 'Bank Transfer'];

  // Load transactions and categories on component mount
  useEffect(() => {
    if (user) {
      loadTransactions();
      loadCategories();
    }
  }, [user]);

  // Load categories from database
  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await expenseCategoriesService.getAllCategories();
      setCategories(categoriesData);
      
      // Set default category if available
      if (categoriesData.length > 0) {
        setFormData(prev => ({
          ...prev,
          category: categoriesData[0].category
        }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setMessage('Error loading categories. Please refresh the page.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load transactions from Supabase
  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading transactions:', error);
        setMessage('Error loading transactions');
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Exception loading transactions:', error);
      setMessage('Error loading transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle data extracted from receipt OCR
  const handleReceiptDataExtracted = (extractedData) => {
    console.log('🔍 ExpenseForm: Received extracted data:', extractedData);
    
    const updates = {};
    
    // Amount extraction
    if (extractedData.amount) {
      updates.amount = extractedData.amount.toString();
      console.log('💰 Setting amount:', updates.amount);
    }
    
    // Date extraction
    if (extractedData.date) {
      updates.date = extractedData.date;
      console.log('📅 Setting date:', updates.date);
    }
    
    // Category extraction - try to match with existing categories
    if (extractedData.category) {
      console.log('🔍 Trying to match category:', extractedData.category);
      
      // Create a mapping for common AI-extracted categories to database categories
      const categoryMapping = {
        'food': 'Food & Dining',
        'food & dining': 'Food & Dining',
        'dining': 'Food & Dining',
        'restaurant': 'Food & Dining',
        'cafe': 'Food & Dining',
        'transportation': 'Transportation',
        'transport': 'Transportation',
        'shopping': 'Shopping',
        'bills & utilities': 'Utilities',
        'bills': 'Utilities',
        'utilities': 'Utilities',
        'healthcare': 'Healthcare',
        'health': 'Healthcare',
        'entertainment': 'Entertainment',
        'education': 'Education',
        'housing': 'Housing',
        'miscellaneous': 'Miscellaneous',
        'misc': 'Miscellaneous',
        'financial': 'Financial'
      };
      
      // First try exact mapping
      let matchedCategory = categoryMapping[extractedData.category.toLowerCase()];
      
      if (matchedCategory) {
        // Verify the mapped category exists in the database
        const dbCategory = categories.find(cat => cat.category === matchedCategory);
        if (dbCategory) {
          updates.category = matchedCategory;
          console.log('🏷️ Category mapped successfully:', extractedData.category, '→', matchedCategory);
        }
      }
      
      // If no mapping found, try fuzzy matching
      if (!updates.category) {
        const matchingCategory = categories.find(cat => 
          cat.category.toLowerCase().includes(extractedData.category.toLowerCase()) ||
          extractedData.category.toLowerCase().includes(cat.category.toLowerCase())
        );
        if (matchingCategory) {
          updates.category = matchingCategory.category;
          console.log('🏷️ Category matched via fuzzy search:', updates.category);
        } else {
          console.log('⚠️ Category not found in available categories:', extractedData.category);
          console.log('📋 Available categories:', categories.map(c => c.category));
        }
      }
    }
    
    // Payment method extraction
    if (extractedData.paymentMethod) {
      const paymentMethodMap = {
        'cash': 'Cash',
        'card': 'Card', 
        'upi': 'UPI',
        'bank transfer': 'Bank Transfer',
        'debit': 'Card',
        'credit': 'Card'
      };
      
      const mappedMethod = paymentMethodMap[extractedData.paymentMethod.toLowerCase()] || extractedData.paymentMethod;
      updates.paymentMethod = mappedMethod;
      console.log('💳 Setting payment method:', updates.paymentMethod);
    }
    
    // Description extraction
    if (extractedData.description) {
      updates.description = extractedData.description;
      console.log('📝 Setting description:', updates.description);
    }
    
    console.log('🔄 Updating form with:', updates);
    setFormData(prev => ({ ...prev, ...updates }));
    setMessage('✅ Receipt processed! Please review the extracted information.');
  };

  // Handle receipt upload
  const handleReceiptUploaded = (receiptUrl) => {
    setFormData(prev => ({ ...prev, receiptUrl }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }

    if (!formData.category || !formData.paymentMethod || !formData.date) {
      setMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            amount: parseFloat(formData.amount),
            category: formData.category,
            payment_method: formData.paymentMethod,
            date: formData.date,
            description: formData.description || null,
            receipt_url: formData.receiptUrl || null
          }
        ])
        .select();

      if (error) {
        console.error('Error adding transaction:', error);
        setMessage('Error adding transaction. Please try again.');
      } else {
        console.log('Transaction added successfully:', data);
        setMessage('Transaction added successfully!');
        
        // Reset form
        setFormData({
          amount: '',
          category: 'Food',
          paymentMethod: 'UPI',
          date: new Date().toISOString().split('T')[0],
          description: '',
          receiptUrl: ''
        });

        // Reload transactions
        await loadTransactions();
      }
    } catch (error) {
      console.error('Exception adding transaction:', error);
      setMessage('Error adding transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    const { getSwal } = await import('../lib/swal');
    const Swal = await getSwal();
    const res = await Swal.fire({
      icon: 'warning',
      title: 'Delete Transaction?',
      text: 'Are you sure you want to delete this transaction?',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });
    if (!res.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting transaction:', error);
        setMessage('Error deleting transaction');
      } else {
        setMessage('Transaction deleted successfully!');
        await loadTransactions();
      }
    } catch (error) {
      console.error('Exception deleting transaction:', error);
      setMessage('Error deleting transaction');
    }
  };

  // Format amount for display
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'Food': '🍕',
      'Rent': '🏠',
      'Transport': '🚗',
      'Shopping': '🛍️',
      'Bills': '📄',
      'EMI': '💳',
      'Education': '📚',
      'Entertainment': '🎬',
      'Investments': '📈'
    };
    return icons[category] || '💰';
  };

  // Get payment method icon
  const getPaymentIcon = (method) => {
    const icons = {
      'UPI': '📱',
      'Card': '💳',
      'Cash': '💵',
      'Bank Transfer': '🏦'
    };
    return icons[method] || '💰';
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to manage expenses.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Expense</h2>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className="flex items-center">
              {message.includes('successfully') ? (
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {message}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Receipt Upload First */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              📸 Step 1: Upload Receipt
              <span className="ml-2 text-sm font-normal text-blue-600">(AI will auto-fill fields below)</span>
            </h3>
            <EnhancedReceiptUpload
              onDataExtracted={handleReceiptDataExtracted}
              onReceiptUploaded={handleReceiptUploaded}
            />
          </div>

          {/* Step 2: Review & Edit Auto-filled Fields */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              ✏️ Step 2: Review & Edit Details
              <span className="ml-2 text-sm font-normal text-gray-500">(AI pre-filled, please verify)</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              {categoriesLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin mr-2"></div>
                  <span className="text-gray-500">Loading categories...</span>
                </div>
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.category}>
                      {category.icon} {category.category}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>
                    {getPaymentIcon(method)} {method}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
                max={new Date().toISOString().split('T')[0]}
                min={new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]}
                title="Select a date within the last year (from 1 year ago to today)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cannot be in the future or more than 1 year ago (from {new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toLocaleDateString()} to today)
              </p>
            </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Brief description of the expense"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding Expense...
              </div>
            ) : (
              'Add Expense'
            )}
          </button>
        </form>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Transactions</h3>
        
        {loadingTransactions ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600">No transactions yet. Add your first expense above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">{getCategoryIcon(transaction.category)}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{transaction.category}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{getPaymentIcon(transaction.payment_method)} {transaction.payment_method}</span>
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-lg text-gray-900">
                    {formatAmount(transaction.amount)}
                  </span>
                  <button
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Delete transaction"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseForm; 