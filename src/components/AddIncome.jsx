import React, { useState, useRef } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';

const AddIncome = ({ onIncomeAdded, onClose }) => {
  const { user } = useSupabaseAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer'
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  const paymentMethods = [
    'Bank Transfer',
    'Cash',
    'UPI',
    'Cheque',
    'Online Payment'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setMessage(''); // Clear any previous messages
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type - allow images and PDFs
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Please upload a PNG, JPEG, or PDF file');
      return;
    }

    // Validate file size (max 10MB for PDFs, 5MB for images)
    const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage(`File size must be less than ${file.type === 'application/pdf' ? '10MB' : '5MB'}`);
      return;
    }

    setUploadedFile(file);
    setMessage('');

    // Create preview (only for images, not PDFs)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }

    // Process OCR
    await processOCR(file);
  };

  const processOCR = async (file) => {
    setIsProcessingOcr(true);
    try {
      // Only process OCR for images, not PDFs
      if (file.type.startsWith('image/')) {
        // Using Tesseract.js for OCR
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker();
        
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        
        const { data: { text } } = await worker.recognize(file);
        
        setOcrText(text);
        
        // Try to extract amount from OCR text
        const amountMatch = text.match(/₹?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
        if (amountMatch) {
          const extractedAmount = amountMatch[1].replace(/,/g, '');
          if (!formData.amount) {
            setFormData(prev => ({ ...prev, amount: extractedAmount }));
          }
        }

        // Try to extract date from OCR text
        const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
        if (dateMatch && !formData.date) {
          const extractedDate = dateMatch[1];
          // Convert to YYYY-MM-DD format
          const parts = extractedDate.split(/[\/\-]/);
          if (parts.length === 3) {
            let day = parts[0];
            let month = parts[1];
            let year = parts[2];
            
            // Handle 2-digit years
            if (year.length === 2) {
              year = '20' + year;
            }
            
            // Ensure proper formatting
            if (day.length === 1) day = '0' + day;
            if (month.length === 1) month = '0' + month;
            
            const formattedDate = `${year}-${month}-${day}`;
            setFormData(prev => ({ ...prev, date: formattedDate }));
          }
        }

        await worker.terminate();
      } else {
        // For PDFs, just set a message that OCR is not available
        setOcrText('PDF uploaded - OCR not available for PDF files');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      setMessage('OCR processing failed. You can still fill the form manually.');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const uploadReceiptToStorage = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setMessage('Please enter a valid amount greater than 0');
      return;
    }

    if (!formData.source.trim()) {
      setMessage('Please enter the income source');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      let receiptUrl = null;
      
      // Upload receipt if provided
      if (uploadedFile) {
        receiptUrl = await uploadReceiptToStorage(uploadedFile);
      }

      const incomeData = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        source: formData.source.trim(),
        category: 'Other', // Default category since we removed the dropdown
        description: formData.description.trim() || null,
        receipt_url: receiptUrl,
        receipt_text: ocrText || null,
        date: formData.date,
        payment_method: formData.paymentMethod,
        is_verified: !!receiptUrl
      };

      const { data, error } = await supabase
        .from('income_records')
        .insert([incomeData])
        .select();

      if (error) {
        console.error('Error adding income:', error);
        setMessage('Error adding income record. Please try again.');
        return;
      }

      // Success
      setMessage('Income record added successfully!');
      
      // Reset form
      setFormData({
        amount: '',
        source: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer'
      });
      setUploadedFile(null);
      setReceiptPreview(null);
      setOcrText('');
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onIncomeAdded) {
        onIncomeAdded(data[0]);
      }

      // Auto close after 2 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);

    } catch (error) {
      console.error('Exception adding income:', error);
      setMessage('Error adding income record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeReceipt = () => {
    setUploadedFile(null);
    setReceiptPreview(null);
    setOcrText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Income</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter amount"
                required
              />
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Income Source *
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Property Sale, Car Sale, Freelance Work"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows="3"
                placeholder="Additional details about this income..."
              />
            </div>

            {/* Receipt Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Receipt (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  {uploadedFile ? 'Change Receipt' : 'Choose Receipt Image'}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPEG, or PDF up to 10MB. OCR will extract text from images.
                </p>
              </div>

              {/* Receipt Preview */}
              {uploadedFile && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      {uploadedFile.type.startsWith('image/') ? 'Receipt Preview' : 'Uploaded File'}
                    </h4>
                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  {receiptPreview ? (
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="max-w-full h-48 object-contain border rounded-lg"
                    />
                  ) : (
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">
                        📄 {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                      </p>
                    </div>
                  )}
                  
                  {/* OCR Status */}
                  {isProcessingOcr && (
                    <div className="mt-2 text-sm text-blue-600">
                      🔍 Processing receipt text...
                    </div>
                  )}
                  
                  {ocrText && (
                    <div className="mt-2">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Extracted Text:</h5>
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border max-h-20 overflow-y-auto">
                        {ocrText}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-lg ${
                message.includes('successfully') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {loading ? 'Adding...' : 'Add Income'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddIncome;
