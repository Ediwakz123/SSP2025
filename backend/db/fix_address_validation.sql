-- =============================================================================
-- Fix address validation in handle_new_user trigger
-- Makes validation more flexible to accept common address variations
-- =============================================================================

-- Update the handle_new_user trigger function with improved address validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_address TEXT;
  v_normalized TEXT;
  v_status TEXT;
  v_is_flagged BOOLEAN;
  v_has_sta_cruz BOOLEAN;
  v_has_santa_maria BOOLEAN;
  v_has_bulacan BOOLEAN;
BEGIN
  v_address := LOWER(COALESCE(new.raw_user_meta_data->>'address', ''));
  v_is_flagged := COALESCE((new.raw_user_meta_data->>'address_flagged')::boolean, false);
  
  -- Normalize address: remove extra punctuation and whitespace
  v_normalized := REGEXP_REPLACE(v_address, '[.,]+', ' ', 'g');
  v_normalized := REGEXP_REPLACE(v_normalized, '\s+', ' ', 'g');
  
  -- Check for Sta. Cruz / Santa Cruz (Barangay)
  -- Accept: "sta cruz", "sta. cruz", "santa cruz", "brgy sta cruz", etc.
  v_has_sta_cruz := (
    v_normalized LIKE '%sta cruz%' OR
    v_normalized LIKE '%santa cruz%' OR
    v_address LIKE '%sta. cruz%' OR
    v_address LIKE '%sta.cruz%'
  );
  
  -- Check for Santa Maria / Sta. Maria (Municipality)
  -- Accept: "santa maria", "sta maria", "sta. maria", etc.
  v_has_santa_maria := (
    v_normalized LIKE '%santa maria%' OR
    v_normalized LIKE '%sta maria%' OR
    v_address LIKE '%sta. maria%' OR
    v_address LIKE '%sta.maria%'
  );
  
  -- Check for Bulacan (Province)
  v_has_bulacan := v_normalized LIKE '%bulacan%';
  
  -- If frontend explicitly flagged the address, use that
  IF v_is_flagged THEN
    v_status := 'flagged';
  -- Otherwise check if address is in target area
  ELSIF v_has_sta_cruz AND v_has_santa_maria AND v_has_bulacan THEN
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- FIX EXISTING FLAGGED USERS WITH VALID ADDRESSES
-- This will update users who have valid addresses but were incorrectly flagged
-- =============================================================================

-- Update existing users with valid addresses from 'flagged' to 'pending'
UPDATE public.profiles
SET approval_status = 'pending', updated_at = now()
WHERE approval_status = 'flagged'
  AND (
    -- Normalize and check address
    (
      (LOWER(address) LIKE '%sta. cruz%' OR LOWER(address) LIKE '%sta cruz%' OR LOWER(address) LIKE '%santa cruz%')
      AND (LOWER(address) LIKE '%santa maria%' OR LOWER(address) LIKE '%sta. maria%' OR LOWER(address) LIKE '%sta maria%')
      AND LOWER(address) LIKE '%bulacan%'
    )
  );

-- Log the migration
INSERT INTO public.activity_logs (action, details, metadata)
VALUES (
  'database_migration', 
  'Fixed address validation to accept more variations (sta. maria, sta maria, etc.)',
  '{"migration": "fix_address_validation", "version": "1.1"}'::jsonb
);

-- Show affected users
SELECT id, full_name, email, address, approval_status 
FROM public.profiles 
WHERE approval_status = 'pending' 
  AND updated_at > now() - interval '1 minute';
