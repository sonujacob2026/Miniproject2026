import { supabase } from '../lib/supabase';

class IncomeCategoriesService {
  // Get all income categories
  async getAllCategories() {
    try {
      const { data, error } = await supabase
        .from('income_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching income categories:', error);
      throw error;
    }
  }

  // Get subcategories for a specific category
  async getSubcategories(categoryName) {
    try {
      // First get the category ID
      const { data: category, error: categoryError } = await supabase
        .from('income_categories')
        .select('id')
        .eq('name', categoryName)
        .single();

      if (categoryError) throw categoryError;

      // Then get subcategories
      const { data, error } = await supabase
        .from('income_subcategories')
        .select('*')
        .eq('category_id', category.id)
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching income subcategories:', error);
      throw error;
    }
  }

  // Get subcategories by category ID (used by admin dashboard)
  async getSubcategoriesByCategory(categoryId) {
    try {
      const { data, error } = await supabase
        .from('income_subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching income subcategories by category:', error);
      throw error;
    }
  }

  // Add a new income category
  async addCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('income_categories')
        .insert([categoryData])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error adding income category:', error);
      throw error;
    }
  }

  // Add a new income subcategory
  async addSubcategory(subcategoryData) {
    try {
      const { data, error } = await supabase
        .from('income_subcategories')
        .insert([subcategoryData])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error adding income subcategory:', error);
      throw error;
    }
  }

  // Update income category
  async updateCategory(id, updates) {
    try {
      const { data, error } = await supabase
        .from('income_categories')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating income category:', error);
      throw error;
    }
  }

  // Update income subcategory
  async updateSubcategory(id, updates) {
    try {
      const { data, error } = await supabase
        .from('income_subcategories')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error updating income subcategory:', error);
      throw error;
    }
  }

  // Delete income category (soft delete)
  async deleteCategory(id) {
    try {
      const { data, error } = await supabase
        .from('income_categories')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error deleting income category:', error);
      throw error;
    }
  }

  // Delete income subcategory (soft delete)
  async deleteSubcategory(id) {
    try {
      const { data, error } = await supabase
        .from('income_subcategories')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error deleting income subcategory:', error);
      throw error;
    }
  }
}

export default new IncomeCategoriesService();