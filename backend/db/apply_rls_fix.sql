-- ============================================================================
-- FIX: Dashboard Stats Not Loading - RLS Policy Update
-- ============================================================================
-- This script adds RLS policies to allow frontend (anon/authenticated) access
-- to the business_raw table so dashboard stats can load correctly.
--
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- 5. Refresh your frontend dashboard page
-- ============================================================================

-- Enable RLS on business_raw (if not already)
ALTER TABLE public.business_raw ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable access for authenticated users" ON public.business_raw;
DROP POLICY IF EXISTS "Service Role Full Access" ON public.business_raw;
DROP POLICY IF EXISTS "Anon Read Access" ON public.business_raw;

-- Re-create Service Role policy (for backend operations)
CREATE POLICY "Service Role Full Access" ON public.business_raw
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Create policy for Authenticated Users (logged-in admin users)
CREATE POLICY "Enable access for authenticated users" ON public.business_raw
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Optional: Create policy for Anonymous users (if needed for public access)
-- Uncomment the lines below if you want anonymous (non-logged-in) users to read data
-- CREATE POLICY "Anon Read Access" ON public.business_raw
--     FOR SELECT
--     TO anon
--     USING (true);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- After running the above, test with this query to verify data is accessible:

SELECT 
    COUNT(*) as total_businesses,
    COUNT(DISTINCT general_category) as total_categories,
    COUNT(DISTINCT zone_type) as total_zones
FROM public.business_raw;

-- Expected results:
-- - total_businesses: (your actual count)
-- - total_categories: 5 (as per your confirmation)
-- - total_zones: (your actual unique zone count)
-- ============================================================================
