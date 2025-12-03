-- 1. Fix ALL missing columns in profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Restore the clean trigger function (removing the debug try-catch)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_first_name text;
  meta_last_name text;
  meta_full_name text;
  final_full_name text;
BEGIN
  -- Extract metadata
  meta_first_name := new.raw_user_meta_data->>'first_name';
  meta_last_name := new.raw_user_meta_data->>'last_name';
  meta_full_name := new.raw_user_meta_data->>'full_name';
  
  -- Determine full name
  IF meta_full_name IS NOT NULL THEN
    final_full_name := meta_full_name;
  ELSIF meta_first_name IS NOT NULL AND meta_last_name IS NOT NULL THEN
    final_full_name := meta_first_name || ' ' || meta_last_name;
  ELSE
    final_full_name := 'Unknown User';
  END IF;

  -- Insert into profiles
  INSERT INTO public.profiles (
    id, 
    full_name, 
    first_name, 
    last_name, 
    email, 
    avatar_url, 
    role, 
    analyses_count,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    final_full_name,
    meta_first_name,
    meta_last_name,
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    updated_at = NOW();
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
