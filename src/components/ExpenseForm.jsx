import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import supabaseService from '../services/supabaseService';
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
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [showOtherCategoryInput, setShowOtherCategoryInput] = useState(false);
  const [otherCategoryName, setOtherCategoryName] = useState('');
  const [showOtherSubcategoryInput, setShowOtherSubcategoryInput] = useState(false);
  const [otherSubcategoryName, setOtherSubcategoryName] = useState('');
  const [subcategories, setSubcategories] = useState([]);

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
        // Load subcategories for the default category
        await loadSubcategories(categoriesData[0].category);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setMessage('Error loading categories. Please refresh the page.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load subcategories for a specific category
  const loadSubcategories = async (categoryName) => {
    try {
      if (!categoryName || categoryName === 'Other') {
        setSubcategories([]);
        setSubcategoriesLoading(false);
        return;
      }
      
      setSubcategoriesLoading(true);
      const subcategoriesData = await expenseCategoriesService.getSubcategories(categoryName);
      setSubcategories(subcategoriesData);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  // Load transactions from Supabase
  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const { data, error } = await supabaseService.select('transactions', {
        eq: { user_id: user.id },
        order: { column: 'created_at', ascending: false },
        limit: 10
      });

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

  // Handle category change
  const handleCategoryChange = async (category) => {
    if (category === 'Other') {
      setShowOtherCategoryInput(true);
      setFormData(prev => ({
        ...prev,
        category: 'Other',
        subcategory: ''
      }));
      setSubcategories([]);
      setShowOtherSubcategoryInput(false);
    } else {
      setShowOtherCategoryInput(false);
      setOtherCategoryName('');
      setFormData(prev => ({
        ...prev,
        category: category,
        subcategory: ''
      }));
      await loadSubcategories(category);
    }
  };

  // Handle subcategory change
  const handleSubcategoryChange = (subcategory) => {
    if (subcategory === 'Other') {
      setShowOtherSubcategoryInput(true);
      setFormData(prev => ({
        ...prev,
        subcategory: 'Other'
      }));
    } else {
      setShowOtherSubcategoryInput(false);
      setOtherSubcategoryName('');
      setFormData(prev => ({
        ...prev,
        subcategory: subcategory
      }));
    }
  };

  // Save custom category to database
  const saveCustomCategory = async (categoryName) => {
    try {
      const categoryData = {
        category: categoryName,
        icon: '📝',
        subcategories: [],
        is_active: true
      };
      
      const newCategory = await expenseCategoriesService.addCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (error) {
      console.error('Error saving custom category:', error);
      throw error;
    }
  };

  // Save custom subcategory to database
  const saveCustomSubcategory = async (categoryId, subcategoryName) => {
    try {
      const subcategoryData = {
        name: subcategoryName,
        icon: '📝',
        isRecurring: false,
        frequency: 'monthly'
      };
      
      const updatedCategory = await expenseCategoriesService.addSubcategory(categoryId, subcategoryData);
      
      // Update the categories list with the new subcategory
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId ? updatedCategory : cat
      ));
      
      // Reload subcategories for current category
      await loadSubcategories(formData.category);
      
      return updatedCategory;
    } catch (error) {
      console.error('Error saving custom subcategory:', error);
      throw error;
    }
  };

  // Handle data extracted from receipt OCR
  const handleReceiptDataExtracted = async (extractedData) => {
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
        // Map to DB-facing names used in this app
        'food': 'Food',
        'food & dining': 'Food',
        'dining': 'Food',
        'restaurant': 'Food',
        'restaurent': 'Food',
        'takeaway': 'Food',
        'take way': 'Food',
        'takeway': 'Food',
        'cafe': 'Food',
        'transportation': 'Transport',
        'transport': 'Transport',
        'public transport': 'Transport',
        'shopping': 'Shopping',
        'bills & utilities': 'Bills',
        'bills': 'Bills',
        'utilities': 'Bills',
        'healthcare': 'Healthcare',
        'health': 'Healthcare',
        'entertainment': 'Entertainment',
        'education': 'Education',
        'housing': 'Rent',
        'miscellaneous': 'Miscellaneous',
        'misc': 'Miscellaneous',
        'financial': 'Investments'
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

    // Apply the category update immediately so subcategories can load
    const nextCategory = updates.category || formData.category;
    if (updates.category) {
      setFormData(prev => ({ ...prev, category: updates.category }));
      // Ensure subcategories for this category are loaded before selecting subcategory
      await loadSubcategories(updates.category);
    }

    // Subcategory extraction (after ensuring subcategories are loaded)
    if (extractedData.subcategory && nextCategory) {
      const subLower = extractedData.subcategory.toLowerCase();
      const exact = subcategories.find(s => s.name.toLowerCase() === subLower);
      if (exact) {
        updates.subcategory = exact.name;
      } else {
        const contains = subcategories.find(s => s.name.toLowerCase().includes(subLower) || subLower.includes(s.name.toLowerCase()));
        if (contains) updates.subcategory = contains.name;
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

    // Validate custom category input
    if (formData.category === 'Other' && (!otherCategoryName || otherCategoryName.trim() === '')) {
      setMessage('Please enter a custom category name');
      return;
    }

    // Validate custom subcategory input
    if (formData.subcategory === 'Other' && (!otherSubcategoryName || otherSubcategoryName.trim() === '')) {
      setMessage('Please enter a custom subcategory name');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      let finalCategory = formData.category;
      let finalSubcategory = formData.subcategory;

      // Handle custom category
      if (formData.category === 'Other') {
        try {
          const newCategory = await saveCustomCategory(otherCategoryName.trim());
          finalCategory = newCategory.category;
          setMessage('Custom category created and transaction added successfully!');
        } catch (error) {
          setMessage('Error creating custom category. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Handle custom subcategory
      if (formData.subcategory === 'Other') {
        try {
          const selectedCategory = categories.find(cat => cat.category === finalCategory);
          if (selectedCategory) {
            await saveCustomSubcategory(selectedCategory.id, otherSubcategoryName.trim());
            finalSubcategory = otherSubcategoryName.trim();
          }
        } catch (error) {
          setMessage('Error creating custom subcategory. Please try again.');
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabaseService.insert('transactions', [
        {
          user_id: user.id,
          amount: parseFloat(formData.amount),
          category: finalCategory,
          subcategory: finalSubcategory || null,
          payment_method: formData.paymentMethod,
          date: formData.date,
          description: formData.description || null,
          receipt_url: formData.receiptUrl || null
        }
      ]);

      if (error) {
        console.error('Error adding transaction:', error);
        setMessage('Error adding transaction. Please try again.');
      } else {
        console.log('Transaction added successfully:', data);
        if (!message.includes('Custom category created')) {
          setMessage('Transaction added successfully!');
        }
        
        // Reset form
        setFormData({
          amount: '',
          category: categories.length > 0 ? categories[0].category : '',
          subcategory: '',
          paymentMethod: 'UPI',
          date: new Date().toISOString().split('T')[0],
          description: '',
          receiptUrl: ''
        });

        // Reset other inputs
        setShowOtherCategoryInput(false);
        setOtherCategoryName('');
        setShowOtherSubcategoryInput(false);
        setOtherSubcategoryName('');
        setSubcategories([]);

        // Reload transactions and categories
        await loadTransactions();
        await loadCategories();
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
      const { error } = await supabaseService.delete('transactions', {
        eq: { id: transactionId, user_id: user.id }
      });

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
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.category}>
                      {category.icon} {category.category}
                    </option>
                  ))}
                  <option value="Other">➕ Other</option>
                </select>
              )}
              
              {/* Custom Category Input */}
              {showOtherCategoryInput && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Custom Category Name *
                  </label>
                  <input
                    type="text"
                    value={otherCategoryName}
                    onChange={(e) => setOtherCategoryName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter your custom category name"
                    required
                  />
                </div>
              )}
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory
              </label>
              {subcategoriesLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin mr-2"></div>
                  <span className="text-gray-500">Loading subcategories...</span>
                </div>
              ) : (
                <select
                  value={formData.subcategory}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  disabled={!formData.category || formData.category === 'Other'}
                >
                  <option value="">
                    {!formData.category 
                      ? 'Select a category first' 
                      : formData.category === 'Other'
                        ? 'Custom category - no subcategories'
                        : subcategories.length === 0 
                          ? 'No subcategories available' 
                          : 'Select subcategory'
                    }
                  </option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.name} value={subcategory.name}>
                      {subcategory.icon} {subcategory.name}
                    </option>
                  ))}
                  {formData.category && formData.category !== 'Other' && subcategories.length > 0 && (
                    <option value="Other">➕ Other</option>
                  )}
                </select>
              )}
              
              {/* Custom Subcategory Input */}
              {showOtherSubcategoryInput && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Custom Subcategory Name *
                  </label>
                  <input
                    type="text"
                    value={otherSubcategoryName}
                    onChange={(e) => setOtherSubcategoryName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter your custom subcategory name"
                    required
                  />
                </div>
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