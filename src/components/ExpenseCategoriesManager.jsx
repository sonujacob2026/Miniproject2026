import React, { useState, useEffect } from 'react';
import expenseCategoriesService from '../services/expenseCategoriesService';
import { getSwal } from '../lib/swal';

const ExpenseCategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    icon: '📝',
    subcategories: []
  });
  const [newSubcategory, setNewSubcategory] = useState({
    name: '',
    icon: '📝',
    isRecurring: false,
    frequency: 'monthly'
  });
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editingSubcategoryIndex, setEditingSubcategoryIndex] = useState(-1);

  // Validation helper function
  const validateName = async (name, fieldName) => {
    const Swal = await getSwal();
    
    if (!name.trim()) {
      await Swal.fire({
        title: 'Validation Error',
        text: `Please enter a ${fieldName}`,
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }
    
    if (name.trim().length < 2) {
      await Swal.fire({
        title: 'Validation Error',
        text: `${fieldName} must be at least 2 characters long`,
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }
    
    if (name.trim().length > 50) {
      await Swal.fire({
        title: 'Validation Error',
        text: `${fieldName} must be less than 50 characters`,
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }
    
    // Validate name contains only letters and spaces
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name.trim())) {
      await Swal.fire({
        title: 'Validation Error',
        text: `${fieldName} can only contain letters and spaces`,
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Refresh categories when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCategories();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await expenseCategoriesService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      // Show specific error message
      let errorMessage = 'Failed to load categories. ';
      if (error.message) {
        if (error.message.includes('relation "expense_categories" does not exist')) {
          errorMessage += 'Database table not found. Please run the database setup script first.';
        } else if (error.message.includes('permission denied')) {
          errorMessage += 'Permission denied. Please check your database permissions.';
        } else {
          errorMessage += error.message;
        }
      }
      
      // Show error message to user
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Error Loading Categories',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      setCategories([]); // Set empty array to prevent crashes
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubcategoryChange = (field, value) => {
    setNewSubcategory(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSubcategory = async () => {
    // Validation using helper function
    if (!(await validateName(newSubcategory.name, 'subcategory name'))) {
      return;
    }
    
    // Check for duplicates
    const isDuplicate = formData.subcategories.some((sub, index) => 
      sub.name.toLowerCase() === newSubcategory.name.toLowerCase() && 
      index !== editingSubcategoryIndex
    );
    
    if (isDuplicate) {
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Duplicate Subcategory',
        text: 'A subcategory with this name already exists',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }
    
    if (editingSubcategoryIndex >= 0) {
      // Update existing subcategory
      setFormData(prev => ({
        ...prev,
        subcategories: prev.subcategories.map((sub, index) => 
          index === editingSubcategoryIndex ? { ...newSubcategory } : sub
        )
      }));
      
      // Reset editing state
      setEditingSubcategoryIndex(-1);
      setEditingSubcategory(null);
    } else {
      // Add new subcategory
      setFormData(prev => ({
        ...prev,
        subcategories: [...prev.subcategories, { ...newSubcategory }]
      }));
    }
    
    // Reset form
    setNewSubcategory({
      name: '',
      icon: '📝',
      isRecurring: false,
      frequency: 'monthly'
    });
  };

  const removeSubcategory = (index) => {
    setFormData(prev => ({
      ...prev,
      subcategories: prev.subcategories.filter((_, i) => i !== index)
    }));
  };

  const editSubcategory = (index) => {
    const subcategory = formData.subcategories[index];
    setNewSubcategory({ ...subcategory });
    setEditingSubcategory(subcategory);
    setEditingSubcategoryIndex(index);
  };

  const cancelEdit = () => {
    setNewSubcategory({
      name: '',
      icon: '📝',
      isRecurring: false,
      frequency: 'monthly'
    });
    setEditingSubcategory(null);
    setEditingSubcategoryIndex(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation using helper function
    if (!(await validateName(formData.category, 'category name'))) {
      return;
    }
    
    // Check for duplicate category names (only when adding new category)
    if (!editingCategory) {
      const isDuplicate = categories.some(cat => 
        cat.category.toLowerCase() === formData.category.toLowerCase()
      );
      
      if (isDuplicate) {
        const Swal = await getSwal();
        await Swal.fire({
          title: 'Duplicate Category',
          text: 'A category with this name already exists',
          icon: 'warning',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    }

    try {
      if (editingCategory) {
        await expenseCategoriesService.updateCategory(editingCategory.id, formData);
      } else {
        await expenseCategoriesService.addCategory(formData);
      }
      
      await fetchCategories();
      resetForm();
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Success!',
        text: editingCategory ? 'Category updated successfully!' : 'Category added successfully!',
        icon: 'success',
        confirmButtonColor: '#10b981'
      });
    } catch (error) {
      console.error('Error saving category:', error);
      
      // Show more specific error messages
      let errorMessage = 'Error saving category. Please try again.';
      
      if (error.message) {
        if (error.message.includes('relation "expense_categories" does not exist')) {
          errorMessage = 'Database table not found. Please run the database setup script first.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Permission denied. Please check your database permissions.';
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'Category already exists. Please choose a different name.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      category: category.category,
      icon: category.icon,
      subcategories: category.subcategories || []
    });
    setShowAddForm(true);
  };

  const handleDelete = async (categoryId) => {
    const Swal = await getSwal();
    
    const result = await Swal.fire({
      title: 'Delete Category',
      text: 'Are you sure you want to delete this category? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await expenseCategoriesService.deleteCategory(categoryId);
        await fetchCategories();
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Category has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#10b981'
        });
      } catch (error) {
        console.error('Error deleting category:', error);
        
        await Swal.fire({
          title: 'Error',
          text: 'Error deleting category. Please try again.',
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      icon: '📝',
      subcategories: []
    });
    setNewSubcategory({
      name: '',
      icon: '📝',
      isRecurring: false,
      frequency: 'monthly'
    });
    setShowAddForm(false);
    setEditingCategory(null);
    setEditingSubcategory(null);
    setEditingSubcategoryIndex(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Expense Categories Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={fetchCategories}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add New Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {category.icon} {category.category}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Subcategories:</h4>
              {category.subcategories && category.subcategories.length > 0 ? (
                <ul className="space-y-1">
                  {category.subcategories.map((sub, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">{sub.icon}</span>
                      {sub.name}
                      {sub.isRecurring && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Recurring
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No subcategories</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Utilities"
                  required
                />
              </div>

              {/* Category Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Icon (Optional)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., ⚡ (optional)"
                />
              </div>

              {/* Subcategories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategories
                </label>
                
                {/* Add Subcategory Form */}
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <input
                      type="text"
                      value={newSubcategory.name}
                      onChange={(e) => handleSubcategoryChange('name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Subcategory name"
                    />
                    <input
                      type="text"
                      value={newSubcategory.icon}
                      onChange={(e) => handleSubcategoryChange('icon', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Icon (optional)"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newSubcategory.isRecurring}
                        onChange={(e) => handleSubcategoryChange('isRecurring', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Recurring</span>
                    </label>
                    
                    {newSubcategory.isRecurring && (
                      <select
                        value={newSubcategory.frequency}
                        onChange={(e) => handleSubcategoryChange('frequency', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="2monthly">2 Monthly</option>
                        <option value="halfyearly">Half Yearly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={addSubcategory}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      {editingSubcategoryIndex >= 0 ? 'Update Subcategory' : 'Add Subcategory'}
                    </button>
                    
                    {editingSubcategoryIndex >= 0 && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Existing Subcategories */}
                {formData.subcategories.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Current Subcategories:</h4>
                    {formData.subcategories.map((sub, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
                        <div className="flex items-center">
                          <span className="mr-2">{sub.icon}</span>
                          <span className="text-sm">{sub.name}</span>
                          {sub.isRecurring && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {sub.frequency}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => editSubcategory(index)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSubcategory(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCategoriesManager;
