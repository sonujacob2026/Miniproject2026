import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';

export const useExpenses = (options = {}) => {
  const { user } = useSupabaseAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    startDate = null,
    endDate = null,
    category = null,
    limit = null,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const loadExpenses = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Build query
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Apply filters
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      setExpenses(data || []);
    } catch (err) {
      console.error('Error loading expenses:', err);
      setError(err.message);
      
      // Fallback to localStorage cache
      try {
        const cached = localStorage.getItem('expenseai_expenses');
        if (cached) {
          const cachedData = JSON.parse(cached);
          setExpenses(cachedData);
        }
      } catch (cacheError) {
        console.error('Error loading cached expenses:', cacheError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, startDate, endDate, category, limit]);

  // Load expenses on mount and when dependencies change
  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !user?.id) return;

    const interval = setInterval(() => {
      loadExpenses(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadExpenses, user?.id]);

  // Add new expense
  const addExpense = useCallback(async (expenseData) => {
    if (!user?.id) return { success: false, error: 'No user ID' };

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expenseData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setExpenses(prev => [data, ...prev]);
      
      // Update localStorage cache
      const updatedExpenses = [data, ...expenses];
      localStorage.setItem('expenseai_expenses', JSON.stringify(updatedExpenses));

      return { success: true, data };
    } catch (err) {
      console.error('Error adding expense:', err);
      return { success: false, error: err.message };
    }
  }, [user?.id, expenses]);

  // Update expense
  const updateExpense = useCallback(async (id, updates) => {
    if (!user?.id) return { success: false, error: 'No user ID' };

    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setExpenses(prev => prev.map(exp => exp.id === id ? data : exp));
      
      // Update localStorage cache
      const updatedExpenses = expenses.map(exp => exp.id === id ? data : exp);
      localStorage.setItem('expenseai_expenses', JSON.stringify(updatedExpenses));

      return { success: true, data };
    } catch (err) {
      console.error('Error updating expense:', err);
      return { success: false, error: err.message };
    }
  }, [user?.id, expenses]);

  // Delete expense
  const deleteExpense = useCallback(async (id) => {
    if (!user?.id) return { success: false, error: 'No user ID' };

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      
      // Update localStorage cache
      const updatedExpenses = expenses.filter(exp => exp.id !== id);
      localStorage.setItem('expenseai_expenses', JSON.stringify(updatedExpenses));

      return { success: true };
    } catch (err) {
      console.error('Error deleting expense:', err);
      return { success: false, error: err.message };
    }
  }, [user?.id, expenses]);

  // Calculate statistics
  const getStats = useCallback(() => {
    const total = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const byCategory = expenses.reduce((acc, exp) => {
      const cat = exp.category || 'Other';
      acc[cat] = (acc[cat] || 0) + (Number(exp.amount) || 0);
      return acc;
    }, {});

    return {
      total,
      count: expenses.length,
      byCategory,
      average: expenses.length > 0 ? total / expenses.length : 0
    };
  }, [expenses]);

  return {
    expenses,
    loading,
    error,
    refreshing,
    addExpense,
    updateExpense,
    deleteExpense,
    refresh: () => loadExpenses(true),
    getStats
  };
};


