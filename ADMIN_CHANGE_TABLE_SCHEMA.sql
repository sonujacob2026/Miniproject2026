-- Admin Change Table Schema
-- This table stores all admin configuration changes and settings

CREATE TABLE IF NOT EXISTS public.admin_change (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_name VARCHAR(255) DEFAULT 'ExpenseAI',
    version VARCHAR(50) DEFAULT '1.0.0',
    two_factor_enabled BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 30, -- in minutes
    password_change_required BOOLEAN DEFAULT false,
    email_change_required BOOLEAN DEFAULT false,
    last_password_change TIMESTAMP WITH TIME ZONE,
    last_email_change TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255) DEFAULT 'admin@gmail.com'
);

-- Insert default settings if table is empty
INSERT INTO public.admin_change (
    application_name,
    version,
    two_factor_enabled,
    session_timeout,
    password_change_required,
    email_change_required
) VALUES (
    'ExpenseAI',
    '1.0.0',
    false,
    30,
    false,
    false
) ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_change_updated_at ON public.admin_change(updated_at DESC);

-- Grant necessary permissions (adjust as needed for your RLS setup)
-- ALTER TABLE public.admin_change ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (uncomment if using RLS)
-- CREATE POLICY "Admin can manage settings" ON public.admin_change
-- FOR ALL
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM auth.users 
--     WHERE auth.users.id = auth.uid() 
--     AND auth.users.email = 'admin@gmail.com'
--   )
-- );
