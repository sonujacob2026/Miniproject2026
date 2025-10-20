import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { createWorker } from 'tesseract.js';

const ReceiptUpload = ({ onDataExtracted, onReceiptUploaded, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    
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

  // Process the uploaded file
  const processFile = async (file) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts-v2')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      setUploadProgress(50);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts-v2')
        .getPublicUrl(fileName);
      
      setUploadProgress(75);
      
      // Process with OCR
      setIsProcessing(true);
      const extractedData = await extractTextFromImage(file);
      
      setUploadProgress(100);
      
      // Call callbacks
      if (onReceiptUploaded) {
        onReceiptUploaded(publicUrl);
      }
      
      if (onDataExtracted && extractedData) {
        onDataExtracted(extractedData);
      }
      
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err.message || 'Failed to process receipt');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  // Extract text using Tesseract.js
  const extractTextFromImage = async (file) => {
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      
      return parseReceiptText(text);
    } catch (err) {
      console.error('OCR Error:', err);
      throw new Error('Failed to extract text from receipt');
    }
  };

  // Parse extracted text to extract relevant information
  const parseReceiptText = (text) => {
    const parsedData = {
      amount: null,
      date: null,
      paymentMethod: null,
      upiId: null,
      description: null
    };
    
    // Extract amount (₹ or Rs.)
    const amountRegex = /(?:₹|Rs\.?)\s*(\d+(?:\.\d{2})?)/gi;
    const amountMatches = text.match(amountRegex);
    if (amountMatches) {
      const amount = amountMatches[0].replace(/[₹Rs\.\s]/gi, '');
      parsedData.amount = parseFloat(amount);
    }
    
    // Extract date (DD-MM-YYYY, DD/MM/YYYY, etc.)
    const dateRegex = /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/g;
    const dateMatches = text.match(dateRegex);
    if (dateMatches) {
      const dateStr = dateMatches[0];
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
      }
    }
    
    // Extract UPI ID (pattern: user@bank)
    const upiRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)/g;
    const upiMatches = text.match(upiRegex);
    if (upiMatches) {
      parsedData.upiId = upiMatches[0];
      parsedData.paymentMethod = 'upi';
    }
    
    // Extract payment method keywords
    const paymentKeywords = {
      'upi': ['upi', 'gpay', 'phonepe', 'paytm', 'bharatpe'],
      'card': ['card', 'debit', 'credit', 'visa', 'mastercard'],
      'cash': ['cash', 'currency'],
      'net_banking': ['net banking', 'online', 'internet banking']
    };
    
    const lowerText = text.toLowerCase();
    for (const [method, keywords] of Object.entries(paymentKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        if (!parsedData.paymentMethod) {
          parsedData.paymentMethod = method;
        }
        break;
      }
    }
    
    // Extract description (first line or merchant name)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      parsedData.description = lines[0].trim().substring(0, 100);
    }
    
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
      setPreviewUrl('');
    }
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Receipt (Optional)
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
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      {(isUploading || isProcessing) && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              {isUploading ? 'Uploading...' : 'Processing with OCR...'}
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
      
      {/* OCR Processing Indicator */}
      {isProcessing && (
        <div className="mt-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md p-2">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Extracting text from receipt...
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptUpload;

