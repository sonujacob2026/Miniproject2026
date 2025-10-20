import React, { useState, useEffect } from 'react';
import incomeCategoriesService from '../services/incomeCategoriesService';
import { getSwal } from '../lib/swal';

const IncomeCategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [showAddSubcategoryForm, setShowAddSubcategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  
  const [categoryFormData, setCategoryFormData] = useState({
    name: ''
  });
  
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    category_id: '',
    name: '',
    is_recurring: false
  });

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
    
    if (name.trim().length > 100) {
      await Swal.fire({
        title: 'Validation Error',
        text: `${fieldName} must be less than 100 characters`,
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return false;
    }
    
    // Validate name contains only letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name.trim())) {
      await Swal.fire({
        title: 'Validation Error',
        text: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
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
      const data = await incomeCategoriesService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Error',
        text: 'Failed to load income categories. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const data = await incomeCategoriesService.getSubcategoriesByCategory(categoryId);
      setSubcategories(data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Error',
        text: 'Failed to load subcategories. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    const isValid = await validateName(categoryFormData.name, 'category name');
    if (!isValid) return;

    try {
      const newCategory = await incomeCategoriesService.createCategory(categoryFormData);
      setCategories([...categories, newCategory]);
      setCategoryFormData({ name: '' });
      setShowAddCategoryForm(false);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Success',
        text: 'Income category created successfully!',
        icon: 'success',
        confirmButtonColor: '#3b82f6'
      });
    } catch (error) {
      console.error('Error creating category:', error);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to create income category. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    
    const isValid = await validateName(categoryFormData.name, 'category name');
    if (!isValid) return;

    try {
      const updatedCategory = await incomeCategoriesService.updateCategory(editingCategory.id, categoryFormData);
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? updatedCategory : cat
      ));
      setCategoryFormData({ name: '' });
      setEditingCategory(null);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Success',
        text: 'Income category updated successfully!',
        icon: 'success',
        confirmButtonColor: '#3b82f6'
      });
    } catch (error) {
      console.error('Error updating category:', error);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to update income category. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const Swal = await getSwal();
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the category and all its subcategories. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await incomeCategoriesService.deleteCategory(categoryId);
        setCategories(categories.filter(cat => cat.id !== categoryId));
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Income category has been deleted.',
          icon: 'success',
          confirmButtonColor: '#3b82f6'
        });
      } catch (error) {
        console.error('Error deleting category:', error);
        
        await Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to delete income category. Please try again.',
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    
    const isValid = await validateName(subcategoryFormData.name, 'subcategory name');
    if (!isValid) return;

    if (!subcategoryFormData.category_id) {
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Validation Error',
        text: 'Please select a category',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    try {
      const newSubcategory = await incomeCategoriesService.createSubcategory(subcategoryFormData);
      setSubcategories([...subcategories, newSubcategory]);
      setSubcategoryFormData({ category_id: '', name: '', is_recurring: false });
      setShowAddSubcategoryForm(false);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Success',
        text: 'Income subcategory created successfully!',
        icon: 'success',
        confirmButtonColor: '#3b82f6'
      });
    } catch (error) {
      console.error('Error creating subcategory:', error);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to create income subcategory. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const handleEditSubcategory = async (e) => {
    e.preventDefault();
    
    const isValid = await validateName(subcategoryFormData.name, 'subcategory name');
    if (!isValid) return;

    if (!subcategoryFormData.category_id) {
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Validation Error',
        text: 'Please select a category',
        icon: 'warning',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    try {
      const updatedSubcategory = await incomeCategoriesService.updateSubcategory(editingSubcategory.id, subcategoryFormData);
      setSubcategories(subcategories.map(sub => 
        sub.id === editingSubcategory.id ? updatedSubcategory : sub
      ));
      setSubcategoryFormData({ category_id: '', name: '', is_recurring: false });
      setEditingSubcategory(null);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Success',
        text: 'Income subcategory updated successfully!',
        icon: 'success',
        confirmButtonColor: '#3b82f6'
      });
    } catch (error) {
      console.error('Error updating subcategory:', error);
      
      const Swal = await getSwal();
      await Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to update income subcategory. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    const Swal = await getSwal();
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the subcategory. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await incomeCategoriesService.deleteSubcategory(subcategoryId);
        setSubcategories(subcategories.filter(sub => sub.id !== subcategoryId));
        
        await Swal.fire({
          title: 'Deleted!',
          text: 'Income subcategory has been deleted.',
          icon: 'success',
          confirmButtonColor: '#3b82f6'
        });
      } catch (error) {
        console.error('Error deleting subcategory:', error);
        
        await Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to delete income subcategory. Please try again.',
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  };

  const startEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({ name: category.name });
    setShowAddCategoryForm(true);
  };

  const startEditSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryFormData({
      category_id: subcategory.category_id,
      name: subcategory.name,
      is_recurring: subcategory.is_recurring
    });
    setShowAddSubcategoryForm(true);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditingSubcategory(null);
    setCategoryFormData({ name: '' });
    setSubcategoryFormData({ category_id: '', name: '', is_recurring: false });
    setShowAddCategoryForm(false);
    setShowAddSubcategoryForm(false);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
    if (categoryId) {
      fetchSubcategories(categoryId);
    } else {
      setSubcategories([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Categories Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Income Categories</h2>
              <p className="text-sm text-gray-500">Manage income categories</p>
            </div>
            <button
              onClick={() => {
                setShowAddCategoryForm(true);
                setEditingCategory(null);
                setCategoryFormData({ name: '' });
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              + Add Category
            </button>
          </div>
        </div>

        <div className="p-6">
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">No income categories found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => startEditCategory(category)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subcategories Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Income Subcategories</h2>
              <p className="text-sm text-gray-500">Manage income subcategories</p>
            </div>
            <div className="flex space-x-4">
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (!selectedCategoryId) {
                    getSwal().then(Swal => {
                      Swal.fire({
                        title: 'Select Category',
                        text: 'Please select a category first',
                        icon: 'warning',
                        confirmButtonColor: '#3b82f6'
                      });
                    });
                    return;
                  }
                  setShowAddSubcategoryForm(true);
                  setEditingSubcategory(null);
                  setSubcategoryFormData({ 
                    category_id: selectedCategoryId, 
                    name: '', 
                    is_recurring: false 
                  });
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                + Add Subcategory
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!selectedCategoryId ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">Select a category to view its subcategories</p>
            </div>
          ) : subcategories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">No subcategories found for this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subcategories.map((subcategory) => (
                <div key={subcategory.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{subcategory.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          subcategory.is_recurring 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subcategory.is_recurring ? 'Recurring' : 'One-time'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => startEditSubcategory(subcategory)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSubcategory(subcategory.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showAddCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={editingCategory ? handleEditCategory : handleAddCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Character-only validation
                    const characterOnlyRegex = /^[a-zA-Z\s\-']*$/;
                    if (characterOnlyRegex.test(value)) {
                      setCategoryFormData({ ...categoryFormData, name: value });
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter category name"
                  required
                  pattern="[a-zA-Z\s\-']+"
                  title="Only letters, spaces, hyphens, and apostrophes are allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Only letters, spaces, hyphens, and apostrophes allowed</p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Subcategory Modal */}
      {showAddSubcategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
            </h3>
            <form onSubmit={editingSubcategory ? handleEditSubcategory : handleAddSubcategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={subcategoryFormData.category_id}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, category_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory Name
                </label>
                <input
                  type="text"
                  value={subcategoryFormData.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Character-only validation
                    const characterOnlyRegex = /^[a-zA-Z\s\-']*$/;
                    if (characterOnlyRegex.test(value)) {
                      setSubcategoryFormData({ ...subcategoryFormData, name: value });
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter subcategory name"
                  required
                  pattern="[a-zA-Z\s\-']+"
                  title="Only letters, spaces, hyphens, and apostrophes are allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Only letters, spaces, hyphens, and apostrophes allowed</p>
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={subcategoryFormData.is_recurring}
                    onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, is_recurring: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Recurring Income</span>
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {editingSubcategory ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeCategoriesManager;

