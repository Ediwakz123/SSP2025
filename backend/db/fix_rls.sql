-- Enable RLS on business_raw (if not already)
ALTER TABLE public.business_raw ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (optional, but safer)
DROP POLICY IF EXISTS "Enable access for authenticated users" ON public.business_raw;
DROP POLICY IF EXISTS "Service Role Full Access" ON public.business_raw;

-- Re-create Service Role policy
CREATE POLICY "Service Role Full Access" ON public.business_raw
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Create policy for Authenticated Users (Frontend)
CREATE POLICY "Enable access for authenticated users" ON public.business_raw
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
