import React, { useState, useEffect } from 'react';
import { getSwal } from '../lib/swal';
import EnhancedReceiptUpload from './EnhancedReceiptUpload';
import expenseCategoriesService from '../services/expenseCategoriesService';

const SimpleAddExpenseModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    upiId: '',
    notes: '',
    receiptUrl: ''
  });
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const paymentMethods = [
    'cash',
    'debit_card',
    'credit_card',
    'upi',
    'net_banking'
  ];

  // Load categories from database
  useEffect(() => {
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
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle data extracted from receipt OCR
  const handleReceiptDataExtracted = (extractedData) => {
    console.log('🔍 SimpleAddExpenseModal: Received extracted data:', extractedData);
    
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
        'cash': 'cash',
        'card': 'debit_card', 
        'upi': 'upi',
        'bank transfer': 'net_banking',
        'debit': 'debit_card',
        'credit': 'credit_card'
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
    
    console.log('🔄 Updating form with:', updates);
    setFormData(prev => ({ ...prev, ...updates }));
    
    // Show success message
    const Swal = getSwal();
    Swal.fire({
      title: 'Receipt Processed!',
      text: 'We\'ve extracted information from your receipt. Please review and edit the fields as needed.',
      icon: 'success',
      confirmButtonColor: '#3b82f6'
    });
  };

  // Handle receipt upload
  const handleReceiptUploaded = (receiptUrl) => {
    setFormData(prev => ({ ...prev, receiptUrl }));
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
    if (!formData.description || !formData.category) {
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
    if (!formData.date) {
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Date Required',
        text: 'Please select an expense date',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Check if date is in the future
    if (selectedDate > today) {
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Invalid Date',
        text: 'Expense date cannot be in the future',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Check if date is too old (more than 1 year ago)
    if (selectedDate < oneYearAgo) {
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Date Too Old',
        text: 'Expense date cannot be more than 1 year ago',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    // Validate UPI ID if payment method is UPI
    if (formData.paymentMethod === 'upi' && formData.upiId) {
      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
      if (!upiRegex.test(formData.upiId.trim())) {
        const Swal = await getSwal();
        await Swal.fire({
          title: 'Invalid UPI ID Format',
          text: 'Please enter a valid UPI ID (e.g., username@okaxis or mobile@upi)',
          icon: 'warning',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    }

    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Expense</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: Receipt Upload First */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-md font-semibold text-green-900 mb-3 flex items-center">
              📸 Step 1: Upload Receipt
              <span className="ml-2 text-xs font-normal text-green-600">(AI will auto-fill fields below)</span>
            </h3>
            <EnhancedReceiptUpload
              onDataExtracted={handleReceiptDataExtracted}
              onReceiptUploaded={handleReceiptUploaded}
            />
          </div>

          {/* Step 2: Review & Edit Auto-filled Fields */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
              ✏️ Step 2: Review & Edit Details
              <span className="ml-2 text-xs font-normal text-gray-500">(AI pre-filled, please verify)</span>
            </h3>
            
            {/* Amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) *
              </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="What did you spend on?"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            {categoriesLoading ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mr-2"></div>
                <span className="text-gray-500 text-sm">Loading categories...</span>
              </div>
            ) : (
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              max={new Date().toISOString().split('T')[0]}
              min={new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0]}
              title="Select a date within the last year"
            />
            <p className="text-xs text-gray-500 mt-1">
              Cannot be in the future or more than 1 year ago
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="cash">Cash</option>
              <option value="debit_card">Debit Card</option>
              <option value="credit_card">Credit Card</option>
              <option value="upi">UPI</option>
              <option value="net_banking">Net Banking</option>
            </select>
          </div>

          {/* UPI ID (only visible when UPI is selected) */}
          {formData.paymentMethod === 'upi' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UPI ID
              </label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => handleInputChange('upiId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g. username@okaxis or mobile@upi"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your UPI ID for payment tracking
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Any additional notes..."
            />
          </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleAddExpenseModal;
