-- Create business_raw table
CREATE TABLE IF NOT EXISTS public.business_raw (
    business_id BIGINT PRIMARY KEY,
    business_name TEXT,
    general_category TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    street TEXT,
    zone_type TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.business_raw ENABLE ROW LEVEL SECURITY;

-- Create policy for Service Role (full access)
CREATE POLICY "Service Role Full Access" ON public.business_raw
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Optional: Create policy for Anon (read-only if needed, or none)
-- CREATE POLICY "Anon Read Access" ON public.business_raw FOR SELECT USING (true);
