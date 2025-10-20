# Admin Dashboard Navigation Guide

## 🎯 How to Access Expense Categories Management

### **Step 1: Access Admin Dashboard**
1. Go to your application
2. Look for "Admin" or "Admin Login" option
3. Login with admin credentials

### **Step 2: Navigate to Settings**
1. In the Admin Dashboard, you'll see 3 tabs at the top:
   - **Overview** (currently selected)
   - **User Management** 
   - **Settings** ← Click this one

### **Step 3: Access Expense Categories**
1. In the Settings page, you'll see 3 sub-tabs:
   - **General Settings** (currently selected)
   - **Expense Categories** ← Click this one
   - **Security**

### **Step 4: Manage Categories**
Once you click "Expense Categories", you'll see:
- ✅ **List of all categories** with icons
- ✅ **Add New Category** button
- ✅ **Edit** button for each category
- ✅ **Delete** button for each category
- ✅ **Refresh** button to reload categories
- ✅ **Subcategories management** for each category

## 🔧 Features Available

### **Category Management:**
- Add new categories with custom icons
- Edit existing categories
- Delete categories
- Set category as active/inactive

### **Subcategory Management:**
- Add subcategories to each category
- Set subcategories as recurring
- Set recurring frequency (daily, weekly, monthly, etc.)
- Edit subcategory details
- Delete subcategories

### **Database Integration:**
- All data is stored in `expense_categories` table
- Real-time updates across all forms
- Proper validation and error handling

## 🚨 Troubleshooting

### **If you can't see the Settings tab:**
1. Make sure you're logged in as admin
2. Check if you have admin permissions
3. Refresh the page

### **If categories don't load:**
1. Check browser console for errors
2. Verify database connection
3. Click the "Refresh" button
4. Make sure `expense_categories` table exists in Supabase

### **If you can't add/edit categories:**
1. Check database permissions
2. Verify you're logged in as admin
3. Check for validation errors

## 📍 Exact Location in Code

**File:** `Finance/src/components/SystemSettings.jsx`
**Lines:** 599-604
```jsx
{/* Expense Categories Section */}
{activeSection === 'categories' && (
  <div className="mt-6">
    <ExpenseCategoriesManager />
  </div>
)}
```

**Component:** `Finance/src/components/ExpenseCategoriesManager.jsx`
**Features:** Full CRUD operations for categories and subcategories



