import React from 'react';
import { format } from 'date-fns';

const IncomeList = ({ incomes, onDelete, onEdit }) => {
  if (!incomes || incomes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Transactions</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <p className="text-gray-500">No income transactions yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first income transaction to get started</p>
        </div>
      </div>
    );
  }

  const getPaymentIcon = (method) => {
    const icons = {
      'UPI': '📱',
      'Card': '💳',
      'Cash': '💵',
      'Bank Transfer': '🏦'
    };
    return icons[method] || '💰';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Salary': '💼',
      'Freelance': '💻',
      'Business': '🏢',
      'Investments': '📈',
      'Rental Income': '🏠',
      'Sales': '🛒',
      'Bonus': '🎁',
      'Other': '💰'
    };
    return icons[category] || '💰';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Income Transactions</h3>
        <p className="text-sm text-gray-500 mt-1">{incomes.length} transaction{incomes.length !== 1 ? 's' : ''}</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {incomes.map((income) => (
          <div key={income.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">{getCategoryIcon(income.category)}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{income.category}</h4>
                    {income.subcategory && (
                      <span className="text-sm text-gray-500">• {income.subcategory}</span>
                    )}
                  </div>
                  
                  {income.description && (
                    <p className="text-sm text-gray-600 mt-1">{income.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <span>{getPaymentIcon(income.payment_method)}</span>
                      <span>{income.payment_method}</span>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {format(new Date(income.date), 'MMM dd, yyyy')}
                    </div>
                    
                    {income.is_recurring && (
                      <div className="flex items-center space-x-1 text-sm text-blue-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{income.recurring_frequency}</span>
                      </div>
                    )}
                  </div>
                  
                  {income.tags && income.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {income.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">
                  +₹{parseFloat(income.amount).toLocaleString('en-IN')}
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(income.id, income)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={() => onDelete(income.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {income.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{income.notes}</p>
              </div>
            )}
            
            {income.receipt_url && (
              <div className="mt-3">
                <a
                  href={income.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>View Receipt</span>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeList;
