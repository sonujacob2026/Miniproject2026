import React, { useState } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';

const AddIncomeSimple = ({ onIncomeAdded, onClose }) => {
  const { user } = useSupabaseAuth();
  
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer'
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      const incomeData = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        source: formData.source.trim(),
        category: 'Other', // Default category since we removed the dropdown
        description: formData.description.trim() || null,
        receipt_url: null,
        receipt_text: null,
        date: formData.date,
        payment_method: formData.paymentMethod,
        is_verified: false
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

export default AddIncomeSimple;
