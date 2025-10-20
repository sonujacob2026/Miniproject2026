import { supabase } from '../lib/supabase';

// Payment methods constants
export const PAYMENT_METHODS = [
  { name: 'Cash', icon: '💵', type: 'cash' },
  { name: 'UPI', icon: '📱', type: 'upi' },
  { name: 'Credit Card', icon: '💳', type: 'credit_card' },
  { name: 'Debit Card', icon: '💳', type: 'debit_card' },
  { name: 'Net Banking', icon: '🏦', type: 'net_banking' },
  { name: 'Wallet', icon: '👛', type: 'wallet' }
];

// Recurring frequencies constants
export const RECURRING_FREQUENCIES = [
  { value: 'daily', label: 'Daily', icon: '📅' },
  { value: 'weekly', label: 'Weekly', icon: '📅' },
  { value: 'monthly', label: 'Monthly', icon: '📅' },
  { value: '2monthly', label: '2 Monthly', icon: '📅' },
  { value: 'halfyearly', label: 'Half Yearly', icon: '📅' },
  { value: 'yearly', label: 'Yearly', icon: '📅' }
];

/**
 * Frontend service for managing expense categories and subcategories
 */
class ExpenseCategoriesService {
  /**
   * Fetch all expense categories from the database
   * @returns {Promise<Array>} Array of category objects
   */
  async getAllCategories() {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) {
        console.error('Error fetching expense categories:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getAllCategories:', error);
      throw error;
    }
  }

  /**
   * Get subcategories for a specific category
   * @param {string} categoryName - Name of the category
   * @returns {Promise<Array>} Array of subcategory objects
   */
  async getSubcategories(categoryName) {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('subcategories')
        .eq('category', categoryName)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching subcategories:', error);
        return [];
      }

      return data?.subcategories || [];
    } catch (error) {
      console.error('Exception in getSubcategories:', error);
      return [];
    }
  }

  /**
   * Add a new expense category (Admin only)
   * @param {Object} categoryData - Category data
   * @param {string} categoryData.category - Category name
   * @param {string} categoryData.icon - Category icon
   * @param {Array} categoryData.subcategories - Array of subcategories
   * @returns {Promise<Object>} Created category object
   */
  async addCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        console.error('Error adding category:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Exception in addCategory:', error);
      throw error;
    }
  }

  /**
   * Update an existing expense category (Admin only)
   * @param {string} categoryId - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated category object
   */
  async updateCategory(categoryId, updateData) {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .update(updateData)
        .eq('id', categoryId)
        .select();

      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Category not found or no changes made');
      }

      if (data.length > 1) {
        console.warn('Multiple categories updated:', data.length);
      }

      return data[0]; // Return the first (and should be only) updated category
    } catch (error) {
      console.error('Exception in updateCategory:', error);
      throw error;
    }
  }

  /**
   * Delete an expense category (Admin only - soft delete)
   * @param {string} categoryId - Category ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCategory(categoryId) {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({ is_active: false })
        .eq('id', categoryId);

      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Exception in deleteCategory:', error);
      throw error;
    }
  }

  /**
   * Add a subcategory to an existing category (Admin only)
   * @param {string} categoryId - Category ID
   * @param {Object} subcategoryData - Subcategory data
   * @returns {Promise<Object>} Updated category object
   */
  async addSubcategory(categoryId, subcategoryData) {
    try {
      // First get the current category
      const { data: category, error: fetchError } = await supabase
        .from('expense_categories')
        .select('subcategories')
        .eq('id', categoryId);

      if (fetchError) {
        console.error('Error fetching category for subcategory addition:', fetchError);
        throw fetchError;
      }

      if (!category || category.length === 0) {
        throw new Error('Category not found');
      }

      // Add new subcategory to the array
      const updatedSubcategories = [...(category[0].subcategories || []), subcategoryData];

      // Update the category
      const { data, error } = await supabase
        .from('expense_categories')
        .update({ subcategories: updatedSubcategories })
        .eq('id', categoryId)
        .select();

      if (error) {
        console.error('Error adding subcategory:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Failed to update category');
      }

      return data[0];
    } catch (error) {
      console.error('Exception in addSubcategory:', error);
      throw error;
    }
  }

  /**
   * Update a subcategory in an existing category (Admin only)
   * @param {string} categoryId - Category ID
   * @param {string} subcategoryName - Name of the subcategory to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated category object
   */
  async updateSubcategory(categoryId, subcategoryName, updateData) {
    try {
      // First get the current category
      const { data: category, error: fetchError } = await supabase
        .from('expense_categories')
        .select('subcategories')
        .eq('id', categoryId);

      if (fetchError) {
        console.error('Error fetching category for subcategory update:', fetchError);
        throw fetchError;
      }

      if (!category || category.length === 0) {
        throw new Error('Category not found');
      }

      // Update the specific subcategory
      const updatedSubcategories = (category[0].subcategories || []).map(sub => 
        sub.name === subcategoryName ? { ...sub, ...updateData } : sub
      );

      // Update the category
      const { data, error } = await supabase
        .from('expense_categories')
        .update({ subcategories: updatedSubcategories })
        .eq('id', categoryId)
        .select();

      if (error) {
        console.error('Error updating subcategory:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Failed to update category');
      }

      return data[0];
    } catch (error) {
      console.error('Exception in updateSubcategory:', error);
      throw error;
    }
  }

  /**
   * Delete a subcategory from an existing category (Admin only)
   * @param {string} categoryId - Category ID
   * @param {string} subcategoryName - Name of the subcategory to delete
   * @returns {Promise<Object>} Updated category object
   */
  async deleteSubcategory(categoryId, subcategoryName) {
    try {
      // First get the current category
      const { data: category, error: fetchError } = await supabase
        .from('expense_categories')
        .select('subcategories')
        .eq('id', categoryId);

      if (fetchError) {
        console.error('Error fetching category for subcategory deletion:', fetchError);
        throw fetchError;
      }

      if (!category || category.length === 0) {
        throw new Error('Category not found');
      }

      // Remove the specific subcategory
      const updatedSubcategories = (category[0].subcategories || []).filter(
        sub => sub.name !== subcategoryName
      );

      // Update the category
      const { data, error } = await supabase
        .from('expense_categories')
        .update({ subcategories: updatedSubcategories })
        .eq('id', categoryId)
        .select();

      if (error) {
        console.error('Error deleting subcategory:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Failed to update category');
      }

      return data[0];
    } catch (error) {
      console.error('Exception in deleteSubcategory:', error);
      throw error;
    }
  }
}

export default new ExpenseCategoriesService();