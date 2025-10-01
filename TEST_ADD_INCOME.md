# 🧪 Add Income Component Test

## **Quick Test Steps**

### **1. Database Setup (Required First)**
Before testing, you need to run these SQL scripts in Supabase:

1. **Go to Supabase Dashboard → SQL Editor**
2. **Run `INCOME_TABLE_SCHEMA.sql`** - Creates the income_records table
3. **Run `RECEIPTS_STORAGE_SETUP.sql`** - Creates storage bucket for receipts

### **2. Test the Basic Form**
1. **Start the development server**: `npm run dev`
2. **Open your browser** to `http://localhost:5173`
3. **Login to your account**
4. **Click "Add Income" button** in the dashboard
5. **Fill out the form**:
   - Amount: `50000` (or any positive number)
   - Source: `Property Sale` (or any text)
   - Date: Today's date (or any date)
   - Payment Method: Select any method
   - Description: Optional text
   - Receipt: Upload PNG, JPEG, or PDF file (optional)

### **3. Expected Results**
✅ **Form should open** in a modal
✅ **All fields should be visible** and functional
✅ **Validation should work** (try submitting with empty fields)
✅ **Amount validation** should prevent zero/negative values
✅ **File upload** should accept PNG, JPEG, and PDF files
✅ **OCR processing** should work for image files (PNG, JPEG)
✅ **PDF files** should upload but show "OCR not available" message
✅ **Success message** should appear after submission
✅ **Form should reset** after successful submission
✅ **Modal should close** automatically after 2 seconds

### **4. Database Verification**
After successful submission:
1. **Go to Supabase Dashboard → Table Editor**
2. **Select `income_records` table**
3. **Verify your record appears** with correct data
4. **Check that `user_id` matches your account**

## **🔧 Troubleshooting**

### **If Form Doesn't Open:**
- Check browser console for errors
- Verify the component is imported correctly
- Make sure the button click handler is working

### **If Database Error Occurs:**
- Verify `income_records` table exists
- Check RLS policies are set correctly
- Ensure user is authenticated

### **If Validation Fails:**
- Check that required fields are marked with *
- Verify amount input accepts decimal values
- Test with different input combinations

## **📋 Test Checklist**

- [ ] Database table created successfully
- [ ] Development server running
- [ ] Add Income button visible in dashboard
- [ ] Modal opens when button clicked
- [ ] All form fields are present and functional
- [ ] Amount validation works (prevents ≤ 0)
- [ ] Required field validation works
- [ ] Form submission works
- [ ] Success message appears
- [ ] Data saved to database
- [ ] Form resets after submission
- [ ] Modal closes automatically

## **🎯 Success Criteria**

The Add Income feature is working correctly if:
1. **All form fields are present** and functional
2. **Validation prevents invalid submissions**
3. **Data is successfully saved** to the database
4. **User gets clear feedback** on success/failure
5. **Form resets** for next entry
6. **Modal closes** automatically

## **📝 Test Data Examples**

### **Valid Test Cases:**
```
Amount: 50000
Source: Property Sale
Date: 2024-01-15
Payment Method: Bank Transfer
Description: Sold apartment in Mumbai
Receipt: property_sale_receipt.png
```

```
Amount: 15000
Source: Freelance Web Development
Date: 2024-01-14
Payment Method: UPI
Description: Website development project
Receipt: invoice.pdf
```

### **Invalid Test Cases (Should Show Errors):**
```
Amount: 0 (should show error)
Amount: -100 (should show error)
Source: "" (empty - should show error)
File: document.txt (should show "PNG, JPEG, or PDF" error)
File: large_image.jpg (over 10MB - should show size error)
```

## **🚀 Next Steps After Basic Test**

Once the basic form works:
1. **Test receipt upload** (if using full AddIncome component)
2. **Test OCR functionality** (if using full AddIncome component)
3. **Add income analytics** to dashboard
4. **Create income reports** and summaries
