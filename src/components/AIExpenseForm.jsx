import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import EnhancedReceiptUpload from './EnhancedReceiptUpload';
import expenseCategoriesService from '../services/expenseCategoriesService';

const AIExpenseForm = () => {
  const { user } = useSupabaseAuth();
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
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
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiExtractedData, setAiExtractedData] = useState(null);

  // Payment methods
  const paymentMethods = [
    { value: 'UPI', label: '📱 UPI', icon: '📱' },
    { value: 'Card', label: '💳 Card', icon: '💳' },
    { value: 'Cash', label: '💵 Cash', icon: '💵' },
    { value: 'Bank Transfer', label: '🏦 Bank Transfer', icon: '🏦' }
  ];

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

  // Handle AI-extracted data from receipt
  const handleAIDataExtracted = (extractedData) => {
    console.log('AI extracted data:', extractedData);
    setAiExtractedData(extractedData);
    
    const updates = {};
    
    if (extractedData.amount) {
      updates.amount = extractedData.amount.toString();
    }
    
    if (extractedData.date) {
      updates.date = extractedData.date;
    }
    
    if (extractedData.category) {
      updates.category = extractedData.category;
    }
    
    if (extractedData.paymentMethod) {
      // Map AI payment method to form payment method
      const paymentMap = {
        'upi': 'UPI',
        'card': 'Card',
        'cash': 'Cash',
        'net_banking': 'Bank Transfer'
      };
      updates.paymentMethod = paymentMap[extractedData.paymentMethod] || extractedData.paymentMethod;
    }
    
    if (extractedData.description) {
      updates.description = extractedData.description;
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Show success message with confidence score
    const confidence = extractedData.confidence ? ` (${Math.round(extractedData.confidence * 100)}% confidence)` : '';
    setMessage(`✨ AI Analysis Complete${confidence}! Please review the extracted information below.`);
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
        setMessage('✅ Transaction added successfully!');
        
        // Reset form
        setFormData({
          amount: '',
          category: categories.length > 0 ? categories[0].category : '',
          paymentMethod: 'UPI',
          date: new Date().toISOString().split('T')[0],
          description: '',
          receiptUrl: ''
        });
        setAiExtractedData(null);

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
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) {
        console.error('Error deleting transaction:', error);
        setMessage('Error deleting transaction');
      } else {
        setMessage('Transaction deleted successfully');
        await loadTransactions();
      }
    } catch (error) {
      console.error('Exception deleting transaction:', error);
      setMessage('Error deleting transaction');
    }
  };

  // Get payment method icon
  const getPaymentIcon = (method) => {
    const payment = paymentMethods.find(p => p.value === method);
    return payment ? payment.icon : '💳';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 AI-Powered Expense Tracker
        </h1>
        <p className="text-gray-600">
          Upload a receipt and let AI automatically fill your expense details!
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.includes('successfully') || message.includes('AI Analysis') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {message.includes('successfully') || message.includes('AI Analysis') ? '✅' : '⚠️'}
            </span>
            {message}
          </div>
        </div>
      )}

      {/* AI Extracted Data Preview */}
      {aiExtractedData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            🎯 AI Analysis Results
            {aiExtractedData.confidence && (
              <span className="ml-2 text-sm font-normal text-blue-700">
                ({Math.round(aiExtractedData.confidence * 100)}% confidence)
              </span>
            )}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {aiExtractedData.amount && (
              <div>
                <span className="font-medium text-blue-900">Amount:</span>
                <div className="text-blue-700">₹{aiExtractedData.amount}</div>
              </div>
            )}
            {aiExtractedData.date && (
              <div>
                <span className="font-medium text-blue-900">Date:</span>
                <div className="text-blue-700">{aiExtractedData.date}</div>
              </div>
            )}
            {aiExtractedData.category && (
              <div>
                <span className="font-medium text-blue-900">Category:</span>
                <div className="text-blue-700">{aiExtractedData.category}</div>
              </div>
            )}
            {aiExtractedData.paymentMethod && (
              <div>
                <span className="font-medium text-blue-900">Payment:</span>
                <div className="text-blue-700">{aiExtractedData.paymentMethod}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Receipt Upload (Priority) */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            📸 Step 1: Upload Receipt
            <span className="ml-2 text-sm font-normal text-gray-500">(AI will auto-fill fields below)</span>
          </h2>
          
          <EnhancedReceiptUpload
            onDataExtracted={handleAIDataExtracted}
            onReceiptUploaded={handleReceiptUploaded}
          />
        </div>

        {/* Step 2: Review & Edit Fields */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            ✏️ Step 2: Review & Edit Details
            <span className="ml-2 text-sm font-normal text-gray-500">(AI pre-filled, please verify)</span>
          </h2>
          
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2"></div>
                  <span className="text-gray-500">Loading categories...</span>
                </div>
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.icon} {method.label}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the expense"
            />
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Adding Expense...
                </>
              ) : (
                <>
                  💾 Add Expense
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Transactions</h2>
        
        {loadingTransactions ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions yet. Add your first expense above!
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {getPaymentIcon(transaction.payment_method)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {transaction.category} • {transaction.payment_method}
                    </div>
                    {transaction.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {transaction.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                    {transaction.receipt_url && (
                      <div className="text-xs text-blue-600">
                        📎 Receipt attached
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete transaction"
                  >
                    🗑️
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

export default AIExpenseForm;
