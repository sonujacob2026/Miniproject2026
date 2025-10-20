import React, { useState } from 'react';
import AddIncome from './AddIncome';

const AddIncomeTest = () => {
  const [showTest, setShowTest] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const handleIncomeAdded = (income) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      message: 'Income added successfully!',
      data: income
    }]);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Add Income Component Test</h1>
      
      <button
        onClick={() => setShowTest(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Test Add Income Form
      </button>

      {testResults.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
          {testResults.map(result => (
            <div key={result.id} className="bg-green-100 p-3 rounded-lg mb-2">
              <p className="text-green-800">{result.message}</p>
              <pre className="text-xs text-gray-600 mt-1">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      {showTest && (
        <AddIncome
          onIncomeAdded={handleIncomeAdded}
          onClose={() => setShowTest(false)}
        />
      )}
    </div>
  );
};

export default AddIncomeTest;









