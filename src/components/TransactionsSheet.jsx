import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getSwal } from '../lib/swal';
import jsPDF from 'jspdf';

// Simple PDF generation - no special characters

const TransactionsSheet = ({ open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchTransactions = async () => {
    try {
      setError('');
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.session?.user?.id;
      if (!uid) throw new Error('Not signed in');

      console.log('TransactionsSheet: Fetching transactions for user:', uid);

      // Fetch last 12 combined transactions (expenses + incomes + income_records)
				const { data: exp } = await supabase
					.from('expenses')
					.select('id, amount, date, description, category')
					.eq('user_id', uid)
					.order('date', { ascending: false })
        .limit(12);

				const { data: inc } = await supabase
					.from('incomes')
					.select('id, amount, date, description, category')
					.eq('user_id', uid)
					.order('date', { ascending: false })
        .limit(12);

				const rows = [
					...(exp || []).map(r => ({ ...r, _type: 'expense' })),
					...(inc || []).map(r => ({ ...r, _type: 'income' })),
      ];
      rows.sort((a, b) => new Date(b.date) - new Date(a.date));
      console.log('TransactionsSheet: Loaded', rows.length, 'transactions');
      setItems(rows.slice(0, 12));
			} catch (e) {
      console.error('TransactionsSheet: Error fetching transactions:', e);
      setError(e.message || 'Failed to load');
			} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTransactions();
    }
  }, [open]);

  // Set up real-time subscriptions when sheet is open
  useEffect(() => {
    if (!open) return;

    console.log('TransactionsSheet: Setting up real-time subscriptions...');
    
    const channel = supabase
      .channel('realtime-transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        console.log('TransactionsSheet: Real-time update - expenses changed', payload);
        fetchTransactions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomes' }, (payload) => {
        console.log('TransactionsSheet: Real-time update - incomes changed', payload);
        fetchTransactions();
      })
      .subscribe((status) => {
        console.log('TransactionsSheet: Subscription status:', status);
      });

    return () => {
      console.log('TransactionsSheet: Cleaning up real-time subscriptions...');
      if (channel) supabase.removeChannel(channel);
    };
  }, [open]);

  // Simple currency formatting - no special characters
  const formatSimpleCurrency = (n) => {
    const value = Number(n || 0);
    return `Rs ${value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const fmt = (n) => {
    const value = Number(n || 0);
    return `Rs ${value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const generatePdf = async () => {
    try {
      const Swal = await getSwal();
      
      // Show loading alert
      Swal.fire({
        title: 'Generating PDF...',
        text: 'Please wait while we prepare your transaction report',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const { data: session } = await supabase.auth.getSession();
      const user = session?.session?.user;
      if (!user) throw new Error('User not authenticated');

      console.log('Generating PDF for user:', user.id);

      // Fetch all transactions for PDF
      const { data: allExp, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (expError) {
        console.error('Error fetching expenses:', expError);
        throw new Error(`Failed to fetch expenses: ${expError.message}`);
      }

      const { data: allInc, error: incError } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (incError) {
        console.error('Error fetching incomes:', incError);
        throw new Error(`Failed to fetch incomes: ${incError.message}`);
      }

      const allTransactions = [
        ...(allExp || []).map(r => ({ ...r, _type: 'Expense' })),
        ...(allInc || []).map(r => ({ ...r, _type: 'Income' })),
      ];
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('Total transactions found:', allTransactions.length);

      // Create PDF with Unicode support
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // Simple PDF setup
      
      // Header - Plain English only
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Transaction History Report', 14, 22);
      
      // Add a simple line
      doc.setLineWidth(1);
      doc.line(14, 26, 100, 26);
      
      // Simple header information
      const currentDate = new Date().toLocaleDateString('en-US');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${currentDate}`, 14, 35);
      doc.text(`User: ${user.email}`, 14, 42);
      doc.text(`Total Transactions: ${allTransactions.length}`, 14, 49);

      // Summary
      const totalExpenses = (allExp || []).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
      const totalIncomes = (allInc || []).reduce((sum, inc) => sum + Number(inc.amount || 0), 0);
      const netBalance = totalIncomes - totalExpenses;

      console.log('PDF Summary values:', {
        totalExpenses,
        totalIncomes,
        netBalance,
        totalExpensesFormatted: fmt(totalExpenses),
        totalIncomesFormatted: fmt(totalIncomes),
        netBalanceFormatted: fmt(netBalance)
      });

      // Financial Summary - Plain English
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('FINANCIAL SUMMARY', 14, 58);
      
      // Add a line under the title
      doc.setLineWidth(0.5);
      doc.line(14, 61, 100, 61);
      
      // Simple summary text
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Total Income: ${formatSimpleCurrency(totalIncomes)}`, 14, 70);
      doc.text(`Total Expenses: ${formatSimpleCurrency(totalExpenses)}`, 14, 78);
      doc.text(`Net Balance: ${formatSimpleCurrency(netBalance)}`, 14, 86);

      // Transactions table - Manual table creation
      let currentY = 110;
      
      // Table header - Simple
      doc.setFillColor(200, 200, 200);
      doc.rect(14, currentY, 180, 8, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      
      doc.text('Type', 16, currentY + 6);
      doc.text('Date', 50, currentY + 6);
      doc.text('Category', 80, currentY + 6);
      doc.text('Description', 120, currentY + 6);
      doc.text('Amount', 165, currentY + 6);
      
      currentY += 10;
      
      // Table rows - Simple
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      allTransactions.forEach((transaction, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(240, 240, 240);
          doc.rect(14, currentY, 180, 8, 'F');
        }
        
        // Simple transaction data
        const cleanType = String(transaction._type || '').trim();
        const cleanDate = String(transaction.date || '').trim();
        const cleanCategory = String(transaction.category || 'N/A').trim().substring(0, 18);
        const cleanDescription = String(transaction.description || 'N/A').trim().substring(0, 22);
        const amount = Number(transaction.amount || 0);
        const cleanAmount = fmt(amount);
        
        doc.setTextColor(0, 0, 0);
        doc.text(cleanType, 16, currentY + 6);
        doc.text(cleanDate, 50, currentY + 6);
        doc.text(cleanCategory, 80, currentY + 6);
        doc.text(cleanDescription, 120, currentY + 6);
        doc.text(cleanAmount, 165, currentY + 6);
        
        currentY += 10;
        
        // Check if we need a new page
        if (currentY > 280) {
          doc.addPage();
          currentY = 20;
        }
      });

      // Simple footer
      const footerY = doc.internal.pageSize.height - 20;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(128, 128, 128);
      doc.text('Generated by Finance Tracker App', 14, footerY);
      doc.text(`Report covers ${allTransactions.length} transactions`, 14, footerY + 6);
      
      // Generate PDF blob for preview
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Close loading alert
      Swal.close();
      
      // Set preview data
      setPdfPreview({
        blob: pdfBlob,
        url: pdfUrl,
        fileName: `transaction_history_${new Date().toISOString().split('T')[0]}.pdf`,
        totalTransactions: allTransactions.length,
        totalIncome: totalIncomes,
        totalExpenses: totalExpenses,
        netBalance: netBalance
      });
      
      setShowPreview(true);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      const Swal = await getSwal();
      Swal.fire({
        icon: 'error',
        title: 'PDF Generation Failed',
        text: error.message || 'Failed to generate PDF. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const downloadPdf = async () => {
    try {
      if (!pdfPreview) {
        await generatePdf();
        return;
      }

      const link = document.createElement('a');
      link.href = pdfPreview.url;
      link.download = pdfPreview.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(pdfPreview.url);
      setPdfPreview(null);
      setShowPreview(false);

      const Swal = await getSwal();
      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded!',
        text: 'Your transaction report has been downloaded successfully.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981'
      });

    } catch (error) {
      console.error('Error downloading PDF:', error);
      const Swal = await getSwal();
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Failed to download PDF. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const closePreview = () => {
    if (pdfPreview?.url) {
      URL.revokeObjectURL(pdfPreview.url);
    }
    setPdfPreview(null);
    setShowPreview(false);
  };

  if (!open) return null;

    return (
    <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
            {/* Sheet */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-gray-600">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <p className="text-gray-600">No transactions found</p>
                <p className="text-sm text-gray-500">Add your first transaction to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={`${item._type}-${item.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item._type === 'expense' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item._type === 'expense' ? 'Expense' : 'Income'}
                        </span>
                        <span className="text-sm text-gray-600">{item.category}</span>
                      </div>
                      <p className="text-sm text-gray-800 mt-1">{item.description}</p>
                      <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                    <div className={`text-sm font-semibold ${
                      item._type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {item._type === 'expense' ? '-' : '+'}{fmt(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with PDF Download */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={generatePdf}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Preview PDF</span>
                </button>
                <button
                  onClick={downloadPdf}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download PDF</span>
                </button>
              </div>
              
              {pdfPreview && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-green-800">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">PDF Ready for Download</span>
					</div>
                  <p className="text-xs text-green-700 mt-1">
                    {pdfPreview.totalTransactions} transactions • {pdfPreview.fileName}
                  </p>
                </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && pdfPreview && (
        <div className="fixed inset-0 z-60 overflow-hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-75" onClick={closePreview} />
          
          {/* Preview Modal */}
          <div className="absolute inset-4 bg-white rounded-lg shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">PDF Preview</h2>
                  <p className="text-sm text-gray-500">{pdfPreview.fileName}</p>
                </div>
                <button
                  onClick={closePreview}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex-1 p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Report Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Transactions:</span>
                      <span className="ml-2 font-medium">{pdfPreview.totalTransactions}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Income:</span>
                      <span className="ml-2 font-medium text-green-600">{fmt(pdfPreview.totalIncome)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Expenses:</span>
                      <span className="ml-2 font-medium text-red-600">{fmt(pdfPreview.totalExpenses)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Net Balance:</span>
                      <span className={`ml-2 font-medium ${pdfPreview.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(pdfPreview.netBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 h-96 overflow-hidden">
                  <iframe
                    src={pdfPreview.url}
                    className="w-full h-full border-0"
                    title="PDF Preview"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Ready to download • {pdfPreview.totalTransactions} transactions
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={closePreview}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={downloadPdf}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsSheet;