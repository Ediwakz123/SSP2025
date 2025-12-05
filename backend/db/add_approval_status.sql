-- =============================================================================
-- Add approval_status column to profiles table
-- Migration for user approval workflow
-- =============================================================================

-- 1. Add approval_status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- 2. Add check constraint for valid statuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_approval_status'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT valid_approval_status 
    CHECK (approval_status IN ('pending', 'approved', 'declined', 'flagged'));
  END IF;
END $$;

-- 3. Approve all existing users (so they don't get locked out)
UPDATE public.profiles 
SET approval_status = 'approved' 
WHERE approval_status IS NULL OR approval_status = 'pending';

-- 4. Update the handle_new_user trigger function to set initial status based on address
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_address TEXT;
  v_status TEXT;
  v_is_flagged BOOLEAN;
BEGIN
  v_address := LOWER(COALESCE(new.raw_user_meta_data->>'address', ''));
  v_is_flagged := COALESCE((new.raw_user_meta_data->>'address_flagged')::boolean, false);
  
  -- If frontend explicitly flagged the address, or check server-side
  IF v_is_flagged THEN
    v_status := 'flagged';
  ELSIF (v_address LIKE '%sta. cruz%' OR v_address LIKE '%sta cruz%' OR v_address LIKE '%santa cruz%')
     AND v_address LIKE '%santa maria%'
     AND v_address LIKE '%bulacan%' THEN
    v_status := 'pending';
  ELSE
    v_status := 'flagged';
  END IF;
  
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    full_name, 
    email, 
    contact_number, 
    address, 
    gender, 
    date_of_birth, 
    role, 
    approval_status, 
    analyses_count,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'contact_number',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'gender',
    NULLIF(new.raw_user_meta_data->>'date_of_birth', '')::date,
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    v_status,
    0,
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Update the users_view to include approval_status if it exists
-- (This may already be a view - checking if it needs update)
DO $$
BEGIN
  -- If users_view exists, we might need to recreate it
  -- For now, we assume the frontend queries profiles directly for approval_status
  NULL;
END $$;

-- 7. Log this migration
INSERT INTO public.activity_logs (action, details, metadata)
VALUES (
  'database_migration', 
  'Added approval_status column for user approval workflow',
  '{"migration": "add_approval_status", "version": "1.0"}'::jsonb
);
