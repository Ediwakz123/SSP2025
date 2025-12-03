-- 1. Create a logs table to capture trigger errors
CREATE TABLE IF NOT EXISTS public.error_logs (
    id SERIAL PRIMARY KEY,
    function_name TEXT,
    error_message TEXT,
    error_detail TEXT,
    error_hint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant access to this table
GRANT ALL ON public.error_logs TO postgres, service_role, authenticated, anon;

-- 2. Update the function to catch errors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_first_name text;
  meta_last_name text;
  meta_full_name text;
  final_full_name text;
BEGIN
  -- Wrap everything in a block to catch errors
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
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        updated_at = NOW();
        
  EXCEPTION WHEN OTHERS THEN
      -- Log the error and continue. This prevents the 500 error.
      INSERT INTO public.error_logs (function_name, error_message, error_detail, error_hint)
      VALUES ('handle_new_user', SQLERRM, SQLSTATE, 'Trigger failed but swallowed error to allow signup');
      
      -- We still return NEW so the user is created in auth.users
      RETURN new;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure the trigger is definitely set
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
