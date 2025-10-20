-- Income Tracking Table Schema
-- This table stores additional income sources beyond monthly income
-- such as selling property, vehicles, freelance work, etc.

CREATE TABLE IF NOT EXISTS public.income_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    source VARCHAR(100) NOT NULL, -- e.g., "Property Sale", "Car Sale", "Freelance Work"
    category VARCHAR(50) NOT NULL, -- e.g., "Property", "Vehicle", "Business", "Investment", "Other"
    description TEXT,
    receipt_url TEXT, -- URL to uploaded receipt image
    receipt_text TEXT, -- OCR extracted text from receipt
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'Bank Transfer', -- e.g., "Bank Transfer", "Cash", "UPI", "Cheque"
    is_verified BOOLEAN DEFAULT false, -- Whether the income is verified with receipt
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_income_records_user_id ON income_records(user_id);
CREATE INDEX IF NOT EXISTS idx_income_records_date ON income_records(date);
CREATE INDEX IF NOT EXISTS idx_income_records_category ON income_records(category);
CREATE INDEX IF NOT EXISTS idx_income_records_created_at ON income_records(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_income_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_income_records_updated_at
    BEFORE UPDATE ON income_records
    FOR EACH ROW
    EXECUTE FUNCTION update_income_records_updated_at();

-- Enable Row Level Security
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own income records" ON income_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income records" ON income_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income records" ON income_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own income records" ON income_records
    FOR DELETE USING (auth.uid() = user_id);

-- Create a view for income summary
CREATE OR REPLACE VIEW income_summary AS
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    MAX(amount) as highest_amount,
    MIN(amount) as lowest_amount
FROM income_records
GROUP BY user_id, DATE_TRUNC('month', date)
ORDER BY month DESC;

-- Grant permissions
GRANT ALL ON income_records TO authenticated;
GRANT SELECT ON income_summary TO authenticated;

-- Insert sample categories for reference
INSERT INTO income_records (user_id, amount, source, category, description, date, payment_method, is_verified)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 0, 'Sample', 'Other', 'This is a sample record - delete after setup', CURRENT_DATE, 'Bank Transfer', false)
ON CONFLICT DO NOTHING;

-- Delete the sample record
DELETE FROM income_records WHERE user_id = '00000000-0000-0000-0000-000000000000';









