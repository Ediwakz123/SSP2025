-- Step 1: Fix RLS Policies for business_raw
ALTER TABLE public.business_raw ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable access for authenticated users" ON public.business_raw;
DROP POLICY IF EXISTS "Service Role Full Access" ON public.business_raw;

CREATE POLICY "Service Role Full Access" ON public.business_raw
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable access for authenticated users" ON public.business_raw
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Step 2: Enable Realtime and Triggers
CREATE OR REPLACE FUNCTION notify_business_raw_change()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'business_raw changed: % on row %', TG_OP, COALESCE(NEW.business_id, OLD.business_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_raw_change_trigger ON public.business_raw;
CREATE TRIGGER business_raw_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.business_raw
  FOR EACH ROW
  EXECUTE FUNCTION notify_business_raw_change();

-- Enable Realtime on businesses table
ALTER PUBLICATION supabase_realtime ADD TABLE businesses;
