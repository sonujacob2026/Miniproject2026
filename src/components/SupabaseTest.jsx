import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Simple component to test Supabase connectivity
 * Add this to your admin dashboard temporarily to diagnose issues
 */
const SupabaseTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test, status, message, data = null) => {
    setTestResults(prev => [...prev, { test, status, message, data, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    console.log('=== SUPABASE CONNECTIVITY TEST ===');

    // Test 1: Check Supabase client initialization
    try {
      addResult('Client Init', 'info', 'Checking Supabase client...');
      if (supabase) {
        addResult('Client Init', 'success', 'Supabase client initialized ✅');
      } else {
        addResult('Client Init', 'error', 'Supabase client not initialized ❌');
        setTesting(false);
        return;
      }
    } catch (err) {
      addResult('Client Init', 'error', `Error: ${err.message}`);
      setTesting(false);
      return;
    }

    // Test 2: Check auth session
    try {
      addResult('Auth Session', 'info', 'Checking authentication session...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addResult('Auth Session', 'error', `Session error: ${sessionError.message}`);
      } else if (sessionData?.session) {
        addResult('Auth Session', 'success', `Authenticated as: ${sessionData.session.user.email} ✅`, sessionData.session.user);
      } else {
        addResult('Auth Session', 'warning', 'No active session (not authenticated) ⚠️');
      }
    } catch (err) {
      addResult('Auth Session', 'error', `Exception: ${err.message}`);
    }

    // Test 3: Simple query (count)
    try {
      addResult('Database Query', 'info', 'Testing database connectivity with COUNT query...');
      
      const startTime = performance.now();
      const { count, error: countError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      const endTime = performance.now();
      
      if (countError) {
        addResult('Database Query', 'error', `Query failed: ${countError.message}`, countError);
      } else {
        addResult('Database Query', 'success', `Query successful! Found ${count} rows in ${(endTime - startTime).toFixed(2)}ms ✅`, { count, responseTime: `${(endTime - startTime).toFixed(2)}ms` });
      }
    } catch (err) {
      addResult('Database Query', 'error', `Exception: ${err.message}`);
    }

    // Test 4: Fetch actual data
    try {
      addResult('Data Fetch', 'info', 'Fetching user_profiles data...');
      
      const startTime = performance.now();
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, email, full_name, created_at')
        .limit(5);
      const endTime = performance.now();
      
      if (profilesError) {
        addResult('Data Fetch', 'error', `Fetch failed: ${profilesError.message}`, profilesError);
      } else if (profiles && profiles.length > 0) {
        addResult('Data Fetch', 'success', `Fetched ${profiles.length} profiles in ${(endTime - startTime).toFixed(2)}ms ✅`, profiles);
      } else {
        addResult('Data Fetch', 'warning', 'Query succeeded but returned 0 rows ⚠️');
      }
    } catch (err) {
      addResult('Data Fetch', 'error', `Exception: ${err.message}`);
    }

    // Test 5: Check RLS status
    try {
      addResult('RLS Check', 'info', 'Checking Row Level Security status...');
      
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('check_rls_status', { table_name: 'user_profiles' })
        .single();
      
      if (rlsError) {
        addResult('RLS Check', 'warning', 'Could not check RLS (function may not exist)', rlsError);
      } else {
        addResult('RLS Check', 'info', `RLS Status: ${rlsData}`, rlsData);
      }
    } catch (err) {
      addResult('RLS Check', 'warning', 'RLS check skipped (function not available)');
    }

    console.log('=== TEST COMPLETE ===');
    setTesting(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 border-green-500 text-green-800';
      case 'error': return 'bg-red-100 border-red-500 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'info': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">🔧 Supabase Connectivity Test</h3>
        <button
          onClick={runTests}
          disabled={testing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? '🔄 Testing...' : '▶️ Run Tests'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-3">
          {testResults.map((result, index) => (
            <div key={index} className={`border-l-4 p-4 rounded-r-lg ${getStatusColor(result.status)}`}>
              <div className="flex items-start">
                <span className="text-xl mr-3">{getStatusIcon(result.status)}</span>
                <div className="flex-1">
                  <div className="font-semibold">{result.test}</div>
                  <div className="text-sm mt-1">{result.message}</div>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer hover:underline">View Details</summary>
                      <pre className="text-xs mt-2 p-2 bg-white/50 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {testResults.length === 0 && !testing && (
        <div className="text-center py-8 text-gray-500">
          <p>Click "Run Tests" to check Supabase connectivity</p>
        </div>
      )}
    </div>
  );
};

export default SupabaseTest;