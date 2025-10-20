import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { createWorker } from 'tesseract.js';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';

const EnhancedReceiptUpload = ({ onDataExtracted, onReceiptUploaded, onClear, onCategorySelected, availableCategories = [], disabled = false, analysisType = 'expense' }) => {
  const { user } = useSupabaseAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const fileInputRef = useRef(null);

  // Reset component state for new uploads
  const resetUploadState = () => {
    setError('');
    setExtractedText('');
    setPreviewUrl('');
    setIsUploading(false);
    setIsProcessing(false);
    setIsAnalyzing(false);
    setUploadProgress(0);
    setProcessingStep('');
    console.log('🔄 Upload state reset for new upload');
  };

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    
    // Reset state before processing new file
    resetUploadState();
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG)');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setError('');
    processFile(file);
  }, []);

  // Process the uploaded file with enhanced AI analysis
  const processFile = async (file) => {
    console.log('🚀 Starting file processing for:', file.name, 'Size:', file.size, 'Type:', file.type);
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setProcessingStep('Uploading receipt...');
      
      console.log('📁 Creating preview URL...');
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      console.log('✅ Preview URL created:', preview);
      
      // Upload to Supabase Storage
      console.log('📤 Preparing file upload...');
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'anonymous'}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      console.log('🔐 User info:', { userId: user?.id, isAuthenticated: !!user });
      console.log('📂 File path:', fileName);
      console.log('📦 Bucket: receipts-v2');
      
      // Quick Supabase connection check (non-blocking)
      try {
        const { data: session } = await supabase.auth.getSession();
        
        if (!session?.session) {
          throw new Error('No active session found');
        }
      } catch (connError) {
        console.error('❌ Supabase connection error:', connError);
        throw new Error(`Authentication error: ${connError.message}`);
      }
      
      console.log('⬆️ Starting Supabase upload...');
      console.log('📤 Upload details:', {
        fileName,
        fileSize: file.size,
        fileType: file.type,
        bucket: 'receipts-v2'
      });
      
      const uploadStartTime = Date.now();
      
      // Add timeout to prevent hanging
      console.log('🚀 Creating upload promise...');
      const uploadPromise = supabase.storage
        .from('receipts-v2')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      console.log('✅ Upload promise created, starting race with timeout...');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log('⏰ Upload timeout reached, rejecting promise');
          reject(new Error('Upload timeout after 15 seconds'));
        }, 15000);
      });
      
      console.log('⏱️ Upload started with 15s timeout...');
      
      // Add progress tracking
      let progressInterval = setInterval(() => {
        const elapsed = Date.now() - uploadStartTime;
        console.log(`⏳ Upload in progress... ${elapsed}ms elapsed`);
        
        // Test if upload is actually progressing
        if (elapsed > 10000) {
          console.log('⚠️ Upload taking longer than expected, checking connection...');
        }
      }, 2000);
      
      let uploadData, uploadError;
      
      try {
        console.log('🏁 Starting Promise.race between upload and timeout...');
        const result = await Promise.race([
          uploadPromise,
          timeoutPromise
        ]);
        
        console.log('🎯 Promise.race completed, result:', result);
        uploadData = result.data;
        uploadError = result.error;
        clearInterval(progressInterval);
        console.log('✅ Progress interval cleared');
      } catch (error) {
        console.error('❌ Promise.race error:', error);
        clearInterval(progressInterval);
        throw error;
      }
      
      const uploadDuration = Date.now() - uploadStartTime;
      console.log('📊 Upload completed in', uploadDuration + 'ms');
      console.log('📊 Upload result:', { data: uploadData, error: uploadError });
      
      if (uploadError) {
        console.error('❌ Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      console.log('✅ Upload successful:', uploadData);
      
      setUploadProgress(30);
      setProcessingStep('Upload complete! Getting public URL...');
      
      // Get public URL
      console.log('🔗 Getting public URL...');
      const { data: { publicUrl } } = supabase.storage
        .from('receipts-v2')
        .getPublicUrl(fileName);
      
      console.log('✅ Public URL:', publicUrl);
      
      setUploadProgress(50);
      setProcessingStep('Extracting text with OCR...');
      
      // Process with OCR
      console.log('🔍 Starting OCR processing...');
      setIsProcessing(true);
      const ocrResult = await extractTextFromImage(file);
      
      console.log('📝 OCR result:', ocrResult);
      
      if (!ocrResult || !ocrResult.text) {
        console.error('❌ OCR failed - no text extracted');
        throw new Error('Failed to extract text from receipt');
      }
      
      console.log('✅ OCR successful, extracted text length:', ocrResult.text.length);
      setExtractedText(ocrResult.text);
      setUploadProgress(75);
      setProcessingStep('Analyzing with AI...');
      
      // Analyze with OpenAI AI
      console.log('🤖 Starting AI analysis...');
      setIsAnalyzing(true);
      const aiResult = await analyzeWithAI(ocrResult.text);
      
      console.log('🧠 AI analysis result:', aiResult);
      
      setUploadProgress(100);
      setProcessingStep('Analysis complete!');
      
      // Call callbacks
      console.log('📞 Calling callbacks...');
      
      if (onReceiptUploaded) {
        console.log('📤 Calling onReceiptUploaded with URL:', publicUrl);
        onReceiptUploaded(publicUrl);
      }
      
      if (onDataExtracted && aiResult.success) {
        console.log('✅ Calling onDataExtracted with AI data:', aiResult.data);
        onDataExtracted(aiResult.data);
      } else if (onDataExtracted) {
        // Fallback to basic OCR parsing if AI fails
        console.log('⚠️ AI failed, using basic parsing fallback');
        const basicData = parseReceiptTextBasic(ocrResult.text);
        console.log('📝 Basic parsed data:', basicData);
        onDataExtracted(basicData);
      } else {
        console.log('❌ No onDataExtracted callback provided');
      }
      
      } catch (err) {
        console.error('Error processing file:', err);
        setError(err.message || 'Failed to process receipt');
      } finally {
        // Reset all states to allow new uploads
        setIsUploading(false);
        setIsProcessing(false);
        setIsAnalyzing(false);
        setUploadProgress(0);
        setProcessingStep('');
        
        // Clear any existing timeouts or intervals
        console.log('🧹 Cleaning up upload state...');
      }
  };

  // Extract text using Tesseract.js
  const extractTextFromImage = async (file) => {
    try {
      setProcessingStep('Initializing OCR engine...');
      const worker = await createWorker('eng');
      
      setProcessingStep('Processing image...');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      
      return { text };
    } catch (err) {
      console.error('OCR Error:', err);
      throw new Error('Failed to extract text from receipt');
    }
  };

  // Analyze extracted text with OpenAI AI
  const analyzeWithAI = async (text) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      // Choose endpoint based on analysis type
      const endpoint = analysisType === 'income' 
        ? '/api/ocr/analyze-income-document'
        : '/api/ocr/analyze-receipt';
      
      const response = await fetch(`${backendUrl}${endpoint}`, {
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

  // Analyze extracted text specifically for category selection
  const analyzeCategoryWithAI = async (text) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      if (availableCategories.length === 0) {
        throw new Error('No categories available');
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/ocr/analyze-category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedText: text,
          availableCategories: availableCategories.map(cat => cat.category),
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error(`Category analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Category analysis failed');
      }

      return result;
    } catch (err) {
      console.error('Category Analysis Error:', err);
      throw new Error(`Category analysis failed: ${err.message}`);
    }
  };

  // Basic OCR parsing as fallback
  const parseReceiptTextBasic = (text) => {
    console.log('📝 Parsing text with basic OCR:', text);
    
    const parsedData = {
      amount: null,
      date: null,
      category: null,
      paymentMethod: null,
      description: null
    };
    
    // Extract amount - prioritize TOTAL over subtotal
    const amountPatterns = [
      // Look for TOTAL first (highest priority)
      /(?:TOTAL|Total|total)\s*:?\s*(?:₹|Rs\.?|INR\.?)\s*(\d+(?:\.\d{2})?)/gi,
      /(?:TOTAL|Total|total)\s*(\d+(?:\.\d{2})?)\s*(?:₹|Rs\.?|INR\.?)/gi,
      // Look for amount to pay or due
      /(?:Amount\s+to\s+Pay|Amount\s+Due|Payable|Due)\s*:?\s*(?:₹|Rs\.?|INR\.?)\s*(\d+(?:\.\d{2})?)/gi,
      // Look for grand total
      /(?:Grand\s+Total|Net\s+Total)\s*:?\s*(?:₹|Rs\.?|INR\.?)\s*(\d+(?:\.\d{2})?)/gi,
      // Look for final amount
      /(?:Final\s+Amount|Final\s+Total)\s*:?\s*(?:₹|Rs\.?|INR\.?)\s*(\d+(?:\.\d{2})?)/gi,
      // General amount patterns (lower priority)
      /(?:₹|Rs\.?|INR\.?)\s*(\d+(?:\.\d{2})?)/gi,
      /(\d+(?:\.\d{2})?)\s*(?:₹|Rs\.?|INR\.?)/gi
    ];
    
    let foundAmount = null;
    let priority = 0;
    
    for (let i = 0; i < amountPatterns.length; i++) {
      const pattern = amountPatterns[i];
      const matches = text.match(pattern);
      if (matches && i < priority) {
        // Found a higher priority amount, use it
        const amount = matches[0].replace(/[₹Rs\.\s:INR]/gi, '');
        foundAmount = parseFloat(amount);
        priority = i;
        console.log(`💰 Basic OCR found amount (priority ${i}):`, foundAmount);
      }
    }
    
    // If no TOTAL found, try to calculate from subtotal + tax
    if (foundAmount === null) {
      const subtotalMatch = text.match(/(?:Subtotal|Subotal)\s*:?\s*(?:₹|Rs\.?|INR\.?)\s*(\d+(?:\.\d{2})?)/gi);
      const taxMatch = text.match(/Tax\s*\([^)]*\)\s*:?\s*(?:₹|Rs\.?|INR\.?)\s*(\d+(?:\.\d{2})?)/gi);
      
      if (subtotalMatch && taxMatch) {
        const subtotal = parseFloat(subtotalMatch[0].replace(/[₹Rs\.\s:INR]/gi, ''));
        const tax = parseFloat(taxMatch[0].replace(/[₹Rs\.\s:INR]/gi, ''));
        foundAmount = subtotal + tax;
        console.log(`🧮 Calculated total: ${subtotal} + ${tax} = ${foundAmount}`);
      } else {
        // Try to find any explicit TOTAL mentioned
        const explicitTotalMatch = text.match(/TOTAL\s*:?\s*(\d+(?:\.\d{2})?)/gi);
        if (explicitTotalMatch) {
          foundAmount = parseFloat(explicitTotalMatch[0].replace(/[TOTAL\s:]/gi, ''));
          console.log(`💰 Found explicit TOTAL: ${foundAmount}`);
        }
      }
    }
    
    // If we found an amount, use it
    if (foundAmount !== null) {
      parsedData.amount = foundAmount;
    }
    
    // Extract date - multiple patterns
    const datePatterns = [
      /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/g,
      /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/g,
      /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/gi
    ];
    
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        const dateStr = matches[0];
        const parts = dateStr.split(/[-/]/);
        if (parts.length === 3) {
          let day = parts[0];
          let month = parts[1];
          let year = parts[2];
          
          // Handle 2-digit year
          if (year.length === 2) {
            year = '20' + year;
          }
          
          // Format as YYYY-MM-DD
          parsedData.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('📅 Basic OCR found date:', parsedData.date);
        }
        break;
      }
    }
    
    // Extract description from first few lines
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      // Get first few meaningful lines (skip headers, totals)
      const descriptionLines = lines
        .filter(line => !line.toLowerCase().includes('total') && 
                       !line.toLowerCase().includes('subtotal') &&
                       !line.toLowerCase().includes('tax') &&
                       !line.toLowerCase().includes('receipt') &&
                       line.length > 3)
        .slice(0, 3);
      
      if (descriptionLines.length > 0) {
        parsedData.description = descriptionLines.join(', ');
        console.log('📝 Basic OCR found description:', parsedData.description);
      }
    }
    
    // Extract category based on keywords - enhanced with more specific patterns
    const categoryKeywords = {
      'Food & Dining': [
        'restaurant', 'cafe', 'coffee', 'food', 'meal', 'lunch', 'dinner', 'breakfast',
        'pizza', 'burger', 'sandwich', 'juice', 'tea', 'snacks', 'dining', 'kitchen',
        'hotel', 'bar', 'pub', 'bakery', 'confectionery', 'groceries', 'vegetables',
        'fruits', 'milk', 'bread', 'rice', 'wheat', 'flour', 'spices', 'oil',
        'croissant', 'corner', 'hamburger', 'fries', 'soda', 'drink'
      ],
      'Transportation': [
        'taxi', 'uber', 'ola', 'bus', 'metro', 'train', 'flight', 'airport',
        'fuel', 'petrol', 'diesel', 'gas', 'parking', 'toll', 'fare', 'ticket',
        'auto', 'rickshaw', 'cab', 'vehicle', 'car', 'bike', 'motorcycle'
      ],
      'Shopping': [
        'store', 'shop', 'mall', 'market', 'supermarket', 'department', 'retail',
        'clothes', 'clothing', 'shoes', 'electronics', 'mobile', 'laptop', 'computer',
        'furniture', 'appliances', 'cosmetics', 'jewelry', 'watch', 'bag', 'accessories',
        'utensil', 'forks', 'spoons', 'knives', 'spatula', 'cookware', 'kitchen',
        'tools', 'hardware', 'emporium'
      ],
      'Bills & Utilities': [
        'electricity', 'water', 'internet', 'phone', 'mobile', 'broadband', 'cable',
        'rent', 'maintenance', 'society', 'gas', 'cylinder', 'insurance', 'premium',
        'subscription', 'recharge', 'bill', 'utility', 'connection'
      ],
      'Healthcare': [
        'hospital', 'clinic', 'doctor', 'medical', 'pharmacy', 'medicine', 'drug',
        'health', 'fitness', 'gym', 'yoga', 'therapy', 'treatment', 'consultation'
      ],
      'Entertainment': [
        'movie', 'theater', 'cinema', 'game', 'concert', 'ticket', 'entertainment',
        'music', 'book', 'magazine', 'subscription', 'streaming', 'netflix', 'prime'
      ],
      'Education': [
        'school', 'college', 'university', 'tuition', 'fees', 'course', 'training',
        'education', 'academy', 'institute', 'learning'
      ],
      'Travel': [
        'hotel', 'booking', 'travel', 'trip', 'vacation', 'holiday', 'resort',
        'flight', 'train', 'bus', 'accommodation', 'tour', 'package'
      ]
    };
    
    const textLower = text.toLowerCase();
    let categoryScore = {};
    
    // Calculate scores for each category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          score += 1;
          // Bonus for exact matches or common business names
          if (textLower.includes(keyword + ' ')) score += 0.5;
        }
      }
      if (score > 0) {
        categoryScore[category] = score;
      }
    }
    
    // Special merchant-based categorization
    const merchantPatterns = {
      'Food & Dining': ['cafe', 'restaurant', 'coffee', 'bakery', 'kitchen', 'dining', 'food', 'meal', 'corner', 'pizza', 'burger', 'fast food', 'restaurant name'],
      'Shopping': ['store', 'shop', 'mall', 'market', 'supermarket', 'retail', 'emporium', 'utensil', 'tools', 'hardware'],
      'Healthcare': ['hospital', 'clinic', 'pharmacy', 'medical', 'doctor'],
      'Education': ['school', 'college', 'university', 'tuition', 'education', 'academy', 'institute'],
      'Transportation': ['taxi', 'uber', 'bus', 'metro', 'train', 'airport'],
      'Entertainment': ['cinema', 'theater', 'movie', 'game', 'entertainment'],
      'Housing': ['hotel', 'booking', 'travel', 'accommodation'],
      'Utilities': ['bill', 'utility', 'electricity', 'water', 'internet', 'phone']
    };
    
    // Check merchant name patterns (first few words)
    const receiptLines = text.split('\n').filter(line => line.trim().length > 0);
    if (receiptLines.length > 0) {
      const merchantName = receiptLines[0].toLowerCase();
      for (const [category, patterns] of Object.entries(merchantPatterns)) {
        for (const pattern of patterns) {
          if (merchantName.includes(pattern)) {
            categoryScore[category] = (categoryScore[category] || 0) + 3; // High bonus for merchant match
            console.log(`🏢 Merchant pattern match: ${pattern} in "${merchantName}" -> ${category}`);
          }
        }
      }
    }
    
    // Find category with highest score
    if (Object.keys(categoryScore).length > 0) {
      const bestCategory = Object.entries(categoryScore)
        .sort(([,a], [,b]) => b - a)[0][0];
      
      // Special check: Don't categorize as Education unless it's clearly educational
      if (bestCategory === 'Education') {
        const textLower = text.toLowerCase();
        const isActuallyEducational = textLower.includes('school') || 
                                     textLower.includes('college') || 
                                     textLower.includes('university') ||
                                     textLower.includes('tuition') ||
                                     textLower.includes('academy');
        
        if (!isActuallyEducational) {
          console.log('🚫 Preventing false Education categorization, looking for next best category');
          // Remove Education and find next best
          delete categoryScore['Education'];
          if (Object.keys(categoryScore).length > 0) {
            const nextBestCategory = Object.entries(categoryScore)
              .sort(([,a], [,b]) => b - a)[0][0];
            parsedData.category = nextBestCategory;
            console.log('🏷️ Basic OCR found category (after Education filter):', parsedData.category, 'Score:', categoryScore[nextBestCategory]);
          }
        } else {
          parsedData.category = bestCategory;
          console.log('🏷️ Basic OCR found category (Education confirmed):', parsedData.category, 'Score:', categoryScore[bestCategory]);
        }
      } else {
        parsedData.category = bestCategory;
        console.log('🏷️ Basic OCR found category:', parsedData.category, 'Score:', categoryScore[bestCategory]);
      }
    }
    
    // Extract payment method keywords
    const paymentKeywords = {
      'UPI': ['upi', 'gpay', 'phonepe', 'paytm', 'bharatpe'],
      'Card': ['card', 'debit', 'credit', 'visa', 'mastercard'],
      'Cash': ['cash', 'currency'],
      'net_banking': ['net banking', 'online', 'internet banking']
    };
    
    const lowerText = text.toLowerCase();
    for (const [method, keywords] of Object.entries(paymentKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        if (!parsedData.paymentMethod) {
          parsedData.paymentMethod = method;
          console.log('💳 Basic OCR found payment method:', parsedData.paymentMethod);
        }
        break;
      }
    }
    
    console.log('✅ Basic OCR parsing complete:', parsedData);
    return parsedData;
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Clear uploaded file
  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    resetUploadState();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Notify parent to clear any AI-filled fields
    if (typeof onClear === 'function') {
      try {
        onClear();
      } catch (err) {
        console.error('onClear callback error:', err);
      }
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        📸 Upload Receipt for AI Analysis
      </label>
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="max-h-48 mx-auto rounded-lg shadow-sm"
            />
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>
              {' '}or drag and drop
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, JPEG up to 10MB
            </p>
            <p className="text-xs text-blue-600 font-medium">
              ✨ AI will automatically fill expense fields
            </p>
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      {(isUploading || isProcessing || isAnalyzing) && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              {processingStep || 'Processing...'}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isAnalyzing ? 'bg-purple-600' : 'bg-blue-600'
              }`}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
      
      {/* Processing Indicators */}
      {(isProcessing || isAnalyzing) && (
        <div className="mt-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-2">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isProcessing ? 'Extracting text from receipt...' : 'Analyzing with AI...'}
          </div>
        </div>
      )}

      {/* Extracted Text Preview and Category Re-analysis */}
      {extractedText && (
        <div className="mt-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-2">
          <div className="flex justify-between items-center mb-2">
            <details className="flex-1">
              <summary className="cursor-pointer font-medium">View extracted text</summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap">{extractedText}</pre>
            </details>
            {availableCategories.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('🤖 Re-analyzing category with AI...');
                    const result = await analyzeCategoryWithAI(extractedText);
                    if (result.success && result.data.category) {
                      console.log('✅ AI selected category:', result.data.category);
                      if (typeof onCategorySelected === 'function') {
                        onCategorySelected(result.data.category);
                      }
                    }
                  } catch (err) {
                    console.error('❌ Category re-analysis failed:', err);
                    setError(`Category analysis failed: ${err.message}`);
                  }
                }}
                className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Re-analyze category with AI"
              >
                🤖 AI Category
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedReceiptUpload;
