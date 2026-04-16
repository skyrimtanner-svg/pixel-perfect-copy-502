-- Append-only enforcement function
CREATE OR REPLACE FUNCTION public.enforce_append_only()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Table %.% is append-only: % operations are not permitted',
    TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

-- trust_ledger: block UPDATE and DELETE
DROP TRIGGER IF EXISTS trust_ledger_no_update ON public.trust_ledger;
CREATE TRIGGER trust_ledger_no_update
  BEFORE UPDATE ON public.trust_ledger
  FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

DROP TRIGGER IF EXISTS trust_ledger_no_delete ON public.trust_ledger;
CREATE TRIGGER trust_ledger_no_delete
  BEFORE DELETE ON public.trust_ledger
  FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

-- latent_log: block UPDATE and DELETE
DROP TRIGGER IF EXISTS latent_log_no_update ON public.latent_log;
CREATE TRIGGER latent_log_no_update
  BEFORE UPDATE ON public.latent_log
  FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

DROP TRIGGER IF EXISTS latent_log_no_delete ON public.latent_log;
CREATE TRIGGER latent_log_no_delete
  BEFORE DELETE ON public.latent_log
  FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

-- analytics_events: block UPDATE and DELETE
DROP TRIGGER IF EXISTS analytics_events_no_update ON public.analytics_events;
CREATE TRIGGER analytics_events_no_update
  BEFORE UPDATE ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

DROP TRIGGER IF EXISTS analytics_events_no_delete ON public.analytics_events;
CREATE TRIGGER analytics_events_no_delete
  BEFORE DELETE ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_append_only();

-- True waitlist position function
CREATE OR REPLACE FUNCTION public.get_next_waitlist_spot()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*), 0)::INTEGER + 1 FROM public.waitlist;
$$;

-- Allow anon and authenticated to call it (they need it to join waitlist)
GRANT EXECUTE ON FUNCTION public.get_next_waitlist_spot() TO anon, authenticated;