import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import { getSwal } from '../lib/swal';
import EnhancedReceiptUpload from './EnhancedReceiptUpload';

const AddIncomeForm = ({ onIncomeAdded, onClose }) => {
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
    receiptUrl: '',
    isRecurring: false,
    recurringFrequency: 'monthly'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [dynamicFields, setDynamicFields] = useState({});

  // Category-specific field configurations
  const categoryFieldConfigs = {
    'Salary': {
      fields: ['company', 'employeeId', 'department', 'designation'],
      labels: {
        company: 'Company Name',
        employeeId: 'Employee ID',
        department: 'Department',
        designation: 'Designation'
      },
      placeholders: {
        company: 'Enter company name',
        employeeId: 'Enter employee ID',
        department: 'Enter department',
        designation: 'Enter designation'
      }
    },
    'Freelance': {
      fields: ['client', 'project', 'projectType', 'contractDuration'],
      labels: {
        client: 'Client Name',
        project: 'Project Name',
        projectType: 'Project Type',
        contractDuration: 'Contract Duration'
      },
      placeholders: {
        client: 'Enter client name',
        project: 'Enter project name',
        projectType: 'e.g., Web Development, Design',
        contractDuration: 'e.g., 3 months, 6 weeks'
      }
    },
    'Business': {
      fields: ['businessName', 'businessType', 'revenueSource', 'taxId'],
      labels: {
        businessName: 'Business Name',
        businessType: 'Business Type',
        revenueSource: 'Revenue Source',
        taxId: 'Tax ID/GST Number'
      },
      placeholders: {
        businessName: 'Enter business name',
        businessType: 'e.g., Retail, Service, Manufacturing',
        revenueSource: 'e.g., Sales, Services, Products',
        taxId: 'Enter GST/Tax ID'
      }
    },
    'Investments': {
      fields: ['investmentType', 'broker', 'portfolio', 'returns'],
      labels: {
        investmentType: 'Investment Type',
        broker: 'Broker/Platform',
        portfolio: 'Portfolio Name',
        returns: 'Returns Type'
      },
      placeholders: {
        investmentType: 'e.g., Stocks, Mutual Funds, Bonds',
        broker: 'Enter broker/platform name',
        portfolio: 'Enter portfolio name',
        returns: 'e.g., Dividends, Capital Gains'
      }
    },
    'Rental Income': {
      fields: ['propertyAddress', 'propertyType', 'tenantName', 'leasePeriod'],
      labels: {
        propertyAddress: 'Property Address',
        propertyType: 'Property Type',
        tenantName: 'Tenant Name',
        leasePeriod: 'Lease Period'
      },
      placeholders: {
        propertyAddress: 'Enter property address',
        propertyType: 'e.g., Apartment, House, Commercial',
        tenantName: 'Enter tenant name',
        leasePeriod: 'e.g., 1 year, 6 months'
      }
    },
    'Sales': {
      fields: ['productName', 'customerName', 'salesChannel', 'quantity'],
      labels: {
        productName: 'Product/Service Name',
        customerName: 'Customer Name',
        salesChannel: 'Sales Channel',
        quantity: 'Quantity'
      },
      placeholders: {
        productName: 'Enter product/service name',
        customerName: 'Enter customer name',
        salesChannel: 'e.g., Online, Store, Direct',
        quantity: 'Enter quantity sold'
      }
    },
    'Government Benefits': {
      fields: ['benefitType', 'governmentDepartment', 'referenceNumber', 'benefitPeriod'],
      labels: {
        benefitType: 'Benefit Type',
        governmentDepartment: 'Government Department',
        referenceNumber: 'Reference Number',
        benefitPeriod: 'Benefit Period'
      },
      placeholders: {
        benefitType: 'e.g., Pension, Subsidy, Grant',
        governmentDepartment: 'Enter department name',
        referenceNumber: 'Enter reference number',
        benefitPeriod: 'e.g., Monthly, Quarterly'
      }
    },
    'Gifts': {
      fields: ['giftFrom', 'occasion', 'giftType', 'relationship'],
      labels: {
        giftFrom: 'Gift From',
        occasion: 'Occasion',
        giftType: 'Gift Type',
        relationship: 'Relationship'
      },
      placeholders: {
        giftFrom: 'Enter giver name',
        occasion: 'e.g., Birthday, Wedding, Festival',
        giftType: 'e.g., Cash, Voucher, Item',
        relationship: 'e.g., Family, Friend, Colleague'
      }
    },
    'Agriculture': {
      fields: ['cropType', 'farmSize', 'season', 'yield'],
      labels: {
        cropType: 'Crop Type',
        farmSize: 'Farm Size',
        season: 'Season',
        yield: 'Yield'
      },
      placeholders: {
        cropType: 'Enter crop type',
        farmSize: 'e.g., 2 acres, 5 hectares',
        season: 'e.g., Rabi, Kharif',
        yield: 'Enter yield amount'
      }
    }
  };

  // Payment methods
  const paymentMethods = [
    { name: 'UPI', icon: '📱' },
    { name: 'Card', icon: '💳' },
    { name: 'Cash', icon: '💵' },
    { name: 'Bank Transfer', icon: '🏦' }
  ];

  // Recurring frequencies
  const recurringFrequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  // Date validation helper function
  const validateDate = async (dateString) => {
    const Swal = await getSwal();
    
    if (!dateString) {
      await Swal.fire({
        title: 'Date Required',
        text: 'Please select an income date',
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
        text: 'Income date cannot be in the future',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }

    // Check if date is too old (more than 1 year ago)
    if (selectedDate < oneYearAgo) {
      await Swal.fire({
        title: 'Date Too Old',
        text: 'Income date cannot be more than 1 year ago (before ' + oneYearAgo.toLocaleDateString() + ')',
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

  // Fetch income categories from database on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const { data: categoriesData, error } = await supabase
          .from('income_categories')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        
        setCategories(categoriesData);
        
        // Set default category if available
        if (categoriesData.length > 0) {
          setFormData(prev => ({
            ...prev,
            category: categoriesData[0].name
          }));
        }
      } catch (error) {
        console.error('Error fetching income categories:', error);
        setMessage('Error loading income categories. Please refresh the page.');
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
        
        const { data: subcategoriesData, error } = await supabase
          .from('income_subcategories')
          .select('*')
          .eq('category_id', categories.find(cat => cat.name === formData.category)?.id)
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        
        setAvailableSubcategories(subcategoriesData);
        
        // Auto-select first subcategory if available
        if (subcategoriesData.length > 0) {
          setFormData(prev => ({
            ...prev,
            subcategory: subcategoriesData[0].name
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
  }, [formData.category, categories]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle category change and update dynamic fields
  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      category: category
    }));

    // Initialize dynamic fields for the selected category
    const config = categoryFieldConfigs[category];
    if (config) {
      const newDynamicFields = {};
      config.fields.forEach(field => {
        newDynamicFields[field] = '';
      });
      setDynamicFields(newDynamicFields);
    } else {
      setDynamicFields({});
    }
  };

  // Handle dynamic field changes
  const handleDynamicFieldChange = (field, value) => {
    setDynamicFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Analyze extracted text with OpenAI AI for income documents
  const analyzeWithAI = async (text) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/ocr/analyze-income-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedText: text,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'AI analysis failed');
      }

      return result;
    } catch (err) {
      console.error('AI Analysis Error:', err);
      throw new Error(`AI analysis failed: ${err.message}`);
    }
  };

  // Handle data extracted from receipt OCR
  const handleReceiptDataExtracted = (extractedData) => {
    console.log('🔍 AddIncomeForm: Received extracted data:', extractedData);
    
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
    
    // Category extraction - map to income categories
    if (extractedData.category) {
      // Try to match with existing income categories
      const matchingCategory = categories.find(cat => 
        cat.name.toLowerCase().includes(extractedData.category.toLowerCase()) ||
        extractedData.category.toLowerCase().includes(cat.name.toLowerCase())
      );
      if (matchingCategory) {
        updates.category = matchingCategory.name;
        console.log('🏷️ Setting category:', updates.category);
        
        // Trigger category change to load subcategories and dynamic fields
        setTimeout(() => {
          handleCategoryChange(matchingCategory.name);
          
          // Auto-select subcategory if available
          setTimeout(async () => {
            try {
              const { data: subcategoriesData, error } = await supabase
                .from('income_subcategories')
                .select('*')
                .eq('category_id', matchingCategory.id)
                .eq('is_active', true)
                .order('name');
              
              if (!error && subcategoriesData && subcategoriesData.length > 0) {
                // Try to match subcategory based on description or use first available
                let selectedSubcategory = subcategoriesData[0]; // Default to first
                
                // If we have description, try to match it with subcategory names
                if (extractedData.description) {
                  const matchingSubcategory = subcategoriesData.find(sub => 
                    sub.name.toLowerCase().includes(extractedData.description.toLowerCase()) ||
                    extractedData.description.toLowerCase().includes(sub.name.toLowerCase())
                  );
                  if (matchingSubcategory) {
                    selectedSubcategory = matchingSubcategory;
                  }
                }
                
                updates.subcategory = selectedSubcategory.name;
                console.log('🏷️ Auto-selected subcategory:', selectedSubcategory.name);
                
                // Update form data with subcategory
                setFormData(prev => ({ ...prev, subcategory: selectedSubcategory.name }));
              }
            } catch (error) {
              console.error('Error loading subcategories for auto-selection:', error);
            }
          }, 200);
        }, 100);
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
          text: 'Please log in to add income',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
        setLoading(false);
        return;
      }

      console.log('Adding income for user:', user.id);

      // Get category and subcategory IDs
      const selectedCategory = categories.find(cat => cat.name === formData.category);
      const selectedSubcategory = availableSubcategories.find(sub => sub.name === formData.subcategory);

      const incomeData = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        category: formData.category,
        subcategory: formData.subcategory || null,
        payment_method: formData.paymentMethod,
        date: formData.date,
        description: formData.description || null,
        tags: formData.tags?.length ? formData.tags : null,
        notes: formData.notes || null,
        upi_id: formData.paymentMethod === 'UPI' ? formData.upiId : null,
        receipt_url: formData.receiptUrl || null,
        is_recurring: formData.isRecurring,
        recurring_frequency: formData.isRecurring ? formData.recurringFrequency : null,
        category_id: selectedCategory?.id || null,
        subcategory_id: selectedSubcategory?.id || null,
        // Add dynamic fields based on category
        ...(formData.category && categoryFieldConfigs[formData.category] ? dynamicFields : {})
      };

      console.log('Income data to insert:', incomeData);

      const { data, error } = await supabase
        .from('incomes')
        .insert([incomeData])
        .select();

      if (error) {
        console.error('Error adding income:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        
        const Swal = await getSwal();
        await Swal.fire({
          title: 'Error Adding Income',
          text: error.message || 'Please try again.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      } else {
        console.log('Income added successfully:', data);
        
        const Swal = await getSwal();
        await Swal.fire({
          title: 'Success!',
          text: 'Income added successfully!',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
        
        // Reset form
        setFormData({
          amount: '',
          category: categories.length > 0 ? categories[0].name : '',
          subcategory: '',
          paymentMethod: 'UPI',
          upiId: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          tags: [],
          notes: '',
          receiptUrl: '',
          isRecurring: false,
          recurringFrequency: 'monthly'
        });

        // Notify parent component
        if (onIncomeAdded) {
          onIncomeAdded(data[0]);
        }

        // Close modal after a short delay
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Exception adding income:', error);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Error',
        text: 'Error adding income. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const commonTags = ['salary', 'bonus', 'freelance', 'investment', 'business', 'passive', 'taxable', 'non-taxable'];

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-2xl mx-auto max-h-[85vh] flex flex-col">
      <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-xl">
        <h2 className="text-2xl font-bold text-gray-900">Add Income</h2>
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            📸 Step 1: Upload Receipt/Document
            <span className="ml-2 text-sm font-normal text-blue-600">(AI will auto-fill fields below)</span>
          </h3>
          <EnhancedReceiptUpload
            onDataExtracted={handleReceiptDataExtracted}
            onReceiptUploaded={handleReceiptUploaded}
            availableCategories={categories}
            analysisType="income"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.icon} {category.name}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {paymentMethods.map((method) => (
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. username@okaxis or mobile@upi"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your UPI ID for payment tracking
                </p>
              </div>
            )}

            {/* Dynamic Fields based on Category */}
            {formData.category && categoryFieldConfigs[formData.category] && (
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {formData.category} Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryFieldConfigs[formData.category].fields.map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {categoryFieldConfigs[formData.category].labels[field]}
                      </label>
                      <input
                        type="text"
                        value={dynamicFields[field] || ''}
                        onChange={(e) => handleDynamicFieldChange(field, e.target.value)}
                        placeholder={categoryFieldConfigs[formData.category].placeholders[field]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring Income */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    This is recurring income
                  </span>
                </label>
                
                {formData.isRecurring && (
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e) => handleInputChange('recurringFrequency', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {recurringFrequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the income"
              />
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
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
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Submit Income'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddIncomeForm;
