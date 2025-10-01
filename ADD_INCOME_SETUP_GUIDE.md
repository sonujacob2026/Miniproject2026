# 💰 Add Income Feature Setup Guide

## **Overview**
This guide will help you set up the new "Add Income" feature that allows users to record additional income sources beyond their monthly income, such as property sales, vehicle sales, freelance work, etc. The feature includes receipt upload and OCR text extraction.

## **🔧 Database Setup**

### **1. Create Income Records Table**
1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `INCOME_TABLE_SCHEMA.sql`
3. Click **Run** to execute the script

This will create:
- ✅ **income_records table** with all required fields
- ✅ **Row Level Security (RLS)** policies
- ✅ **Indexes** for better performance
- ✅ **Triggers** for automatic timestamp updates
- ✅ **Income summary view** for analytics

### **2. Setup Receipt Storage**
1. In **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `RECEIPTS_STORAGE_SETUP.sql`
3. Click **Run** to execute the script

This will create:
- ✅ **Storage bucket** for receipt images
- ✅ **Storage policies** for secure file access
- ✅ **User-specific folders** for organized storage

## **📦 Dependencies Setup**

### **Install Tesseract.js for OCR**
Run this command in your project directory:

```bash
npm install tesseract.js
```

## **📱 Features Included**

### **Income Form Fields:**
- **Amount (₹)** - Required, numeric with validation (must be > 0)
- **Income Source** - Text field (e.g., "Property Sale", "Car Sale", "Freelance Work")
- **Category** - Dropdown with 9 options:
  - 🏠 Property Sale
  - 🚗 Vehicle Sale
  - 💼 Business Income
  - 💻 Freelance Work
  - 📈 Investment Returns
  - 🎁 Gift/Inheritance
  - 🏘️ Rental Income
  - 💡 Consulting
  - 📋 Other

- **Date** - Date picker (defaults to today)
- **Payment Method** - Dropdown with 5 options:
  - 🏦 Bank Transfer
  - 💵 Cash
  - 📱 UPI
  - 📄 Cheque
  - 💳 Online Payment

- **Description** - Optional text area for additional details

### **Receipt Upload & OCR:**
- ✅ **Image upload** (JPG, PNG up to 5MB)
- ✅ **OCR text extraction** using Tesseract.js
- ✅ **Automatic field filling** from extracted text
- ✅ **Receipt preview** with extracted text display
- ✅ **Secure storage** in Supabase Storage

### **Validation & Security:**
- ✅ **Amount validation** (must be positive)
- ✅ **Required field validation**
- ✅ **File type validation** (images only)
- ✅ **File size validation** (max 5MB)
- ✅ **Row Level Security** (users see only their data)
- ✅ **Secure file storage** with user-specific folders

## **🚀 How to Use**

### **1. Add New Income:**
1. Click **"Add Income"** button in the dashboard
2. Fill in the **Amount** (required)
3. Enter the **Income Source** (required)
4. Select a **Category** (required)
5. Choose the **Date** and **Payment Method**
6. Add optional **Description**
7. **Upload receipt** (optional) - OCR will extract text automatically
8. Click **"Add Income"**

### **2. Receipt OCR Features:**
- Upload any receipt image
- OCR automatically extracts text
- Amount and date are auto-filled if detected
- View extracted text in the preview
- Remove or change receipt as needed

### **3. View Income Records:**
- Income records are stored in the `income_records` table
- Each record includes receipt URL and extracted text
- Records are marked as verified if receipt is uploaded

## **🔒 Security Features**

### **Row Level Security (RLS):**
- Users can only see their own income records
- Users can only upload receipts to their own folders
- Automatic user_id assignment on insert
- Secure file access with proper policies

### **Data Validation:**
- Amount must be positive number
- Required fields validation
- File type and size validation
- Date format validation

## **📊 Database Schema**

```sql
income_records table:
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key to auth.users)
├── amount (DECIMAL(12,2), Required, > 0)
├── source (VARCHAR(100), Required)
├── category (VARCHAR(50), Required)
├── description (TEXT, Optional)
├── receipt_url (TEXT, Optional)
├── receipt_text (TEXT, Optional - OCR extracted)
├── date (DATE, Required, Default: today)
├── payment_method (VARCHAR(50), Default: Bank Transfer)
├── is_verified (BOOLEAN, Default: false)
├── created_at (TIMESTAMP, Auto)
└── updated_at (TIMESTAMP, Auto-updated)
```

## **🎨 UI/UX Features**

### **Visual Elements:**
- **Clean modal design** with proper spacing
- **Form validation** with clear error messages
- **Receipt preview** with extracted text display
- **Loading states** for OCR processing
- **Success confirmations** after adding income
- **Responsive design** for mobile and desktop

### **User Experience:**
- **Auto-fill from OCR** for amount and date
- **Drag & drop** file upload interface
- **Real-time validation** with helpful messages
- **Easy form reset** after successful submission
- **Intuitive category selection**

## **🔍 Troubleshooting**

### **Common Issues:**

#### **1. "Table doesn't exist" Error**
- Make sure you ran the `INCOME_TABLE_SCHEMA.sql` script
- Check if the table was created in Table Editor

#### **2. "Storage bucket doesn't exist" Error**
- Make sure you ran the `RECEIPTS_STORAGE_SETUP.sql` script
- Check Storage section in Supabase dashboard

#### **3. OCR Not Working**
- Ensure `tesseract.js` is installed: `npm install tesseract.js`
- Check browser console for errors
- Try with a clearer image

#### **4. File Upload Fails**
- Check file size (must be < 5MB)
- Ensure file is an image (JPG, PNG, etc.)
- Verify storage policies are set correctly

#### **5. Form Validation Errors**
- Amount must be greater than 0
- All required fields must be filled
- Date must be valid

## **📈 Next Steps**

After setup, you can:
1. **Test the feature** by adding sample income records
2. **View records** in the Supabase table editor
3. **Extend functionality** by adding income reports/analytics
4. **Customize categories** based on your needs

## **🎯 Benefits**

- **Complete income tracking** beyond monthly salary
- **Receipt management** with OCR text extraction
- **Automatic data entry** from receipt images
- **Secure storage** with proper access controls
- **User-friendly interface** with validation
- **Scalable design** for future enhancements



