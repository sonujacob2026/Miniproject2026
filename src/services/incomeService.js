import { supabase } from '../lib/supabase';

class IncomeService {
  // Get all incomes for a user
  async getIncomes(userId) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select(`
          *,
          income_categories (
            name,
            icon
          ),
          income_subcategories (
            name,
            icon
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching incomes:', error);
      throw error;
    }
  }

  // Get incomes for a specific date range
  async getIncomesByDateRange(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select(`
          *,
          income_categories (
            name,
            icon
          ),
          income_subcategories (
            name,
            icon
          )
        `)
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching incomes by date range:', error);
      throw error;
    }
  }

  // Get incomes by category
  async getIncomesByCategory(userId, category) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select(`
          *,
          income_categories (
            name,
            icon
          ),
          income_subcategories (
            name,
            icon
          )
        `)
        .eq('user_id', userId)
        .eq('category', category)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching incomes by category:', error);
      throw error;
    }
  }

  // Add a new income
  async addIncome(incomeData) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .insert([incomeData])
        .select(`
          *,
          income_categories (
            name,
            icon
          ),
          income_subcategories (
            name,
            icon
          )
        `);

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  }

  // Update an income
  async updateIncome(id, updates) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          income_categories (
            name,
            icon
          ),
          income_subcategories (
            name,
            icon
          )
        `);

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    }
  }

  // Delete an income
  async deleteIncome(id) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  }

  // Get income statistics
  async getIncomeStats(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select('amount, category, date')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Calculate statistics
      const totalIncome = data.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      
      const categoryStats = data.reduce((acc, income) => {
        const category = income.category;
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0 };
        }
        acc[category].total += parseFloat(income.amount);
        acc[category].count += 1;
        return acc;
      }, {});

      const averageIncome = data.length > 0 ? totalIncome / data.length : 0;

      return {
        totalIncome,
        averageIncome,
        transactionCount: data.length,
        categoryStats,
        incomes: data
      };
    } catch (error) {
      console.error('Error fetching income stats:', error);
      throw error;
    }
  }

  // Get recurring incomes
  async getRecurringIncomes(userId) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select(`
          *,
          income_categories (
            name,
            icon
          ),
          income_subcategories (
            name,
            icon
          )
        `)
        .eq('user_id', userId)
        .eq('is_recurring', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching recurring incomes:', error);
      throw error;
    }
  }

  // Get monthly income summary
  async getMonthlyIncomeSummary(userId, year, month) {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

      const { data, error } = await supabase
        .from('incomes')
        .select('amount, category, date')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const totalIncome = data.reduce((sum, income) => sum + parseFloat(income.amount), 0);
      const categoryBreakdown = data.reduce((acc, income) => {
        const category = income.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += parseFloat(income.amount);
        return acc;
      }, {});

      return {
        totalIncome,
        transactionCount: data.length,
        categoryBreakdown,
        incomes: data
      };
    } catch (error) {
      console.error('Error fetching monthly income summary:', error);
      throw error;
    }
  }
}

export default new IncomeService();
