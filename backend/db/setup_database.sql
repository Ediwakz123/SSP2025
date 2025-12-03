-- ============================================================================
-- DATABASE SETUP SCRIPT
-- ============================================================================
-- This script creates the business_raw table and sets up necessary security policies.
-- Run this in your Supabase SQL Editor.

-- 1. Create the table
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

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.business_raw ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Service Role Full Access" ON public.business_raw;
DROP POLICY IF EXISTS "Enable access for authenticated users" ON public.business_raw;
DROP POLICY IF EXISTS "Anon Read Access" ON public.business_raw;

-- Policy: Service Role (Backend/Scripts) - Full Access
CREATE POLICY "Service Role Full Access" ON public.business_raw
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy: Authenticated Users (Frontend Admin) - Full Access
CREATE POLICY "Enable access for authenticated users" ON public.business_raw
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Anonymous Users (Public) - Read Only (Optional, uncomment if needed)
-- CREATE POLICY "Anon Read Access" ON public.business_raw
--     FOR SELECT
--     TO anon
--     USING (true);

-- 4. Notify PostgREST to reload schema cache (fixes PGRST205 error)
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT COUNT(*) as table_created FROM public.business_raw;
