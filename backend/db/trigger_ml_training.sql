-- Alternative: Use Supabase Webhooks instead of pg_net
-- This trigger will be replaced by a Supabase Webhook configuration

-- For now, create a simple notification trigger
CREATE OR REPLACE FUNCTION notify_business_raw_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Just log the change for now
  -- The actual ML training will be triggered via Supabase Webhooks
  RAISE NOTICE 'business_raw table changed: % on row %', TG_OP, COALESCE(NEW.business_id, OLD.business_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS business_raw_change_trigger ON public.business_raw;

-- Create trigger
CREATE TRIGGER business_raw_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.business_raw
  FOR EACH ROW
  EXECUTE FUNCTION notify_business_raw_change();

-- Enable Realtime on businesses table
ALTER PUBLICATION supabase_realtime ADD TABLE businesses;

-- Note: To complete the automation, configure a Supabase Webhook:
-- 1. Go to Supabase Dashboard > Database > Webhooks
-- 2. Create webhook for table: business_raw
-- 3. Events: INSERT, UPDATE, DELETE
-- 4. HTTP Request: POST to http://localhost:8000/train
-- 5. This will automatically trigger ML training on any change
