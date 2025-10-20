import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import { 
  PAYMENT_METHODS
} from '../services/expenseCategoriesService';
import expenseCategoriesService from '../services/expenseCategoriesService';
import { getSwal } from '../lib/swal';
import EnhancedReceiptUpload from './EnhancedReceiptUpload';

const HouseholdExpenseForm = ({ onExpenseAdded, onClose }) => {
  const { user } = useSupabaseAuth();
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    subcategory: '',
    paymentMethod: 'UPI',
    upiId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    tags: [],
    notes: '',
    receiptUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Date validation helper function
  const validateDate = async (dateString) => {
    const Swal = await getSwal();
    
    if (!dateString) {
      await Swal.fire({
        title: 'Date Required',
        text: 'Please select an expense date',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }

    const selectedDate = new Date(dateString);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Check if date is in the future
    if (selectedDate > today) {
      await Swal.fire({
        title: 'Invalid Date',
        text: 'Expense date cannot be in the future',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }

    // Check if date is too old (more than 1 year ago)
    if (selectedDate < oneYearAgo) {
      await Swal.fire({
        title: 'Date Too Old',
        text: 'Expense date cannot be more than 1 year ago (before ' + oneYearAgo.toLocaleDateString() + ')',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }

    return true;
  };

  // UPI ID validation helper function
  const validateUPIId = async (upiId) => {
    const Swal = await getSwal();
    
    if (!upiId.trim()) {
      await Swal.fire({
        title: 'UPI ID Required',
        text: 'Please enter your UPI ID',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }

    // UPI ID format validation: username@bank or mobile@upi
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    if (!upiRegex.test(upiId.trim())) {
      await Swal.fire({
        title: 'Invalid UPI ID Format',
        text: 'Please enter a valid UPI ID (e.g., username@okaxis or mobile@upi)',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }

    return true;
  };

  // Fetch categories from database on component mount
  useEffect(() => {
    const fetchCategories = async () => {
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
        console.error('Error fetching categories:', error);
        setMessage('Error loading categories. Please refresh the page.');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    const updateSubcategories = async () => {
      if (!formData.category) {
        setAvailableSubcategories([]);
        setFormData(prev => ({
          ...prev,
          subcategory: ''
        }));
        return;
      }
      
      try {
        // Clear subcategory first
        setFormData(prev => ({
          ...prev,
          subcategory: ''
        }));
        
        const subcategories = await expenseCategoriesService.getSubcategories(formData.category);
        setAvailableSubcategories(subcategories);
        
        // Auto-select first subcategory if available
        if (subcategories.length > 0) {
          setFormData(prev => ({
            ...prev,
            subcategory: subcategories[0].name
          }));
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        setAvailableSubcategories([]);
        setFormData(prev => ({
          ...prev,
          subcategory: ''
        }));
      }
    };

    updateSubcategories();
  }, [formData.category]);

  // Update recurring settings when subcategory changes
  useEffect(() => {
    if (formData.subcategory) {
      // Find the selected subcategory to get its recurring settings
      const selectedSubcategory = availableSubcategories.find(
        sub => sub.name === formData.subcategory
      );
      
      // No additional logic needed for subcategory selection
    }
  }, [formData.subcategory, availableSubcategories]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle data extracted from receipt OCR
  const handleReceiptDataExtracted = (extractedData) => {
    console.log('🔍 HouseholdExpenseForm: Received extracted data:', extractedData);
    
    const updates = {};
    
    // Amount extraction
    if (extractedData.amount) {
      updates.amount = extractedData.amount.toString();
      console.log('💰 Setting amount:', updates.amount);
    }
    
    // Date extraction
    if (extractedData.date) {
      // Convert date to YYYY-MM-DD format if needed
      let formattedDate = extractedData.date;
      if (typeof extractedData.date === 'string') {
        // Try to parse various date formats
        const dateObj = new Date(extractedData.date);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      }
      updates.date = formattedDate;
      console.log('📅 Setting date:', updates.date);
    } else {
      // Default to today's date if no date found
      updates.date = new Date().toISOString().split('T')[0];
      console.log('📅 No date found, using today:', updates.date);
    }
    
    // Category extraction
    if (extractedData.category) {
      // Try to match with existing categories
      const matchingCategory = categories.find(cat => 
        cat.category.toLowerCase().includes(extractedData.category.toLowerCase()) ||
        extractedData.category.toLowerCase().includes(cat.category.toLowerCase())
      );
      if (matchingCategory) {
        updates.category = matchingCategory.category;
        console.log('🏷️ Setting category:', updates.category);
      }
    }
    
    // Payment method extraction
    if (extractedData.paymentMethod) {
      // Map common payment methods
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
    
    // UPI ID extraction
    if (extractedData.upiId) {
      updates.upiId = extractedData.upiId;
      console.log('🆔 Setting UPI ID:', updates.upiId);
    }
    
    // Description extraction
    if (extractedData.description) {
      updates.description = extractedData.description;
      console.log('📝 Setting description:', updates.description);
    }
    
    // Subcategory extraction (try to match with available subcategories)
    if (extractedData.subcategory && updates.category) {
      const category = categories.find(cat => cat.category === updates.category);
      if (category && category.subcategories) {
        const matchingSubcategory = category.subcategories.find(sub => 
          sub.name.toLowerCase().includes(extractedData.subcategory.toLowerCase()) ||
          extractedData.subcategory.toLowerCase().includes(sub.name.toLowerCase())
        );
        if (matchingSubcategory) {
          updates.subcategory = matchingSubcategory.name;
          console.log('🏷️ Setting subcategory:', updates.subcategory);
        }
      }
    }
    
    console.log('🔄 Updating form with:', updates);
    setFormData(prev => ({ ...prev, ...updates }));
    setMessage('✅ Receipt processed! Please review the extracted information.');
  };

  // Handle receipt upload
  const handleReceiptUploaded = (receiptUrl) => {
    setFormData(prev => ({ ...prev, receiptUrl }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Map UI category/subcategory to DB category (matches CHECK constraint in transactions table)
  const mapToDbCategory = (category, subcategory) => {
    const name = (subcategory || category || '').toLowerCase();
    if (name.includes('grocery') || name.includes('food')) return 'Food';
    if (name.includes('rent') || name.includes('mortgage') || name.includes('housing')) return 'Rent';
    if (name.includes('transport') || name.includes('fuel') || name.includes('taxi') || name.includes('parking') || name.includes('toll')) return 'Transport';
    if (name.includes('electric') || name.includes('water') || name.includes('gas') || name.includes('internet') || name.includes('broadband') || name.includes('recharge') || name.includes('bill') || name.includes('utility')) return 'Bills';
    if (name.includes('emi') || name.includes('loan')) return 'EMI';
    if (name.includes('education') || name.includes('school') || name.includes('tuition') || name.includes('book') || name.includes('course')) return 'Education';
    if (name.includes('entertain') || name.includes('movie') || name.includes('stream') || name.includes('gaming') || name.includes('hobby')) return 'Entertainment';
    if (name.includes('invest') || name.includes('sip')) return 'Investments';
    if (name.includes('insurance')) return 'Bills';
    return 'Shopping';
  };

  // Map UI payment method to DB payment_method (matches CHECK constraint)
  const mapToDbPayment = (paymentMethod) => {
    const m = (paymentMethod || '').toLowerCase();
    if (m.includes('upi')) return 'UPI';
    if (m.includes('credit') || m.includes('debit') || m.includes('card')) return 'Card';
    if (m.includes('cash')) return 'Cash';
    if (m.includes('net') || m.includes('bank') || m.includes('cheque') || m.includes('auto')) return 'Bank Transfer';
    if (m.includes('wallet')) return 'UPI';
    return 'UPI';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Invalid Amount',
        text: 'Please enter a valid amount greater than 0',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Validate required fields
    if (!formData.category || !formData.subcategory || !formData.paymentMethod) {
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Missing Information',
        text: 'Please fill in all required fields',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Validate date
    if (!(await validateDate(formData.date))) {
      return;
    }

    // Validate UPI ID if payment method is UPI
    if (formData.paymentMethod === 'UPI' && !(await validateUPIId(formData.upiId))) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Debug: Check user authentication
      if (!user || !user.id) {
        console.error('User not authenticated:', user);
        const Swal = await getSwal();
        await Swal.fire({
          title: 'Authentication Error',
          text: 'Please log in to add expenses',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
        setLoading(false);
        return;
      }

      console.log('Adding expense for user:', user.id);

      // Map values to match DB constraints in DATABASE_SETUP.sql (transactions table)
      const mappedCategory = mapToDbCategory(formData.category, formData.subcategory);
      const mappedPayment = mapToDbPayment(formData.paymentMethod);

      const expenseData = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        category: mappedCategory, // must be one of: Food, Rent, Transport, Shopping, Bills, EMI, Education, Entertainment, Investments
        subcategory: formData.subcategory || null, // store the specific bill/item like "Electricity Bill"
        payment_method: mappedPayment, // must be one of: UPI, Card, Cash, Bank Transfer
        date: formData.date,
        description: formData.description || null,
        tags: formData.tags?.length ? formData.tags : null, // text[]
        notes: formData.notes || null,
        upi_id: formData.paymentMethod === 'UPI' ? formData.upiId : null,
        receipt_url: formData.receiptUrl || null
      };

      console.log('Expense data to insert:', expenseData);

      const { data, error } = await supabase
  .from('expenses')
  .insert([expenseData])
  .select();


      if (error) {
        console.error('Error adding expense:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        
        const Swal = await getSwal();
        await Swal.fire({
          title: 'Error Adding Expense',
          text: error.message || 'Please try again.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      } else {
        console.log('Expense added successfully:', data);
        
        const Swal = await getSwal();
        await Swal.fire({
          title: 'Success!',
          text: 'Expense added successfully!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        
        // Reset form
        setFormData({
          amount: '',
          category: categories.length > 0 ? categories[0].category : '',
          subcategory: '',
          paymentMethod: 'UPI',
          upiId: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          tags: [],
          notes: '',
          receiptUrl: ''
        });

        // Notify parent component
        if (onExpenseAdded) {
          onExpenseAdded(data[0]);
        }

        // Close modal after a short delay
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Exception adding expense:', error);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Error',
        text: 'Error adding expense. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const commonTags = ['urgent', 'work-related', 'family', 'personal', 'business', 'tax-deductible'];

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-2xl mx-auto max-h-[85vh] flex flex-col">
      <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-xl">
        <h2 className="text-2xl font-bold text-gray-900">Add Household Expense</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {message && (
        <div className={`m-6 mb-0 p-3 rounded-lg ${
          message.includes('successfully') 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Scrollable form body */}
      <form onSubmit={handleSubmit} className="space-y-8 overflow-auto p-6">
        {/* Step 1: Receipt Upload First */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            📸 Step 1: Upload Receipt
            <span className="ml-2 text-sm font-normal text-green-600">(AI will auto-fill fields below)</span>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                max={new Date().toISOString().split('T')[0]}
                min={new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]}
                title="Select a date within the last year (from 1 year ago to today)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cannot be in the future or more than 1 year ago (from {new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toLocaleDateString()} to today)
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              {categoriesLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mr-2"></div>
                  <span className="text-gray-500">Loading categories...</span>
                </div>
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.category}>
                      {category.icon} {category.category}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory *
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) => handleInputChange('subcategory', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                disabled={!formData.category || categoriesLoading}
              >
                <option value="">
                  {!formData.category 
                    ? 'Select a category first' 
                    : availableSubcategories.length === 0 
                      ? 'No subcategories available' 
                      : 'Select subcategory'
                  }
                </option>
                {availableSubcategories.map((subcategory) => (
                  <option key={subcategory.name} value={subcategory.name}>
                    {subcategory.icon} {subcategory.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.name} value={method.name}>
                    {method.icon} {method.name}
                  </option>
                ))}
              </select>
            </div>

            {/* UPI ID (only visible when UPI is selected) */}
            {formData.paymentMethod === 'UPI' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID *
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => handleInputChange('upiId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. username@okaxis or mobile@upi"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your UPI ID for payment tracking
                </p>
              </div>
            )}

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Brief description of the expense"
              />
            </div>

            {/* Tags */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {commonTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder="Additional notes or details"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Submit Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HouseholdExpenseForm;