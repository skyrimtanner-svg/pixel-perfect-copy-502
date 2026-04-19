-- ─── 1. app_config table (singleton, service-role only) ────────────────────
CREATE TABLE IF NOT EXISTS public.app_config (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  admin_email TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT app_config_singleton CHECK (id = TRUE)
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to app_config" ON public.app_config;
CREATE POLICY "Service role full access to app_config"
ON public.app_config
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Seed current admin email (idempotent)
INSERT INTO public.app_config (id, admin_email)
VALUES (TRUE, 'skyrimtanner@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Replace assign_admin_on_signup to read from app_config ─────────────
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _admin_email TEXT;
BEGIN
  SELECT admin_email INTO _admin_email FROM public.app_config WHERE id = TRUE LIMIT 1;

  IF _admin_email IS NOT NULL AND NEW.email = _admin_email THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- ─── 3. Waitlist 60-second per-email duplicate guard ───────────────────────
CREATE OR REPLACE FUNCTION public.guard_waitlist_email_rate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.waitlist
    WHERE email = NEW.email
      AND created_at > (now() - INTERVAL '60 seconds')
  ) THEN
    RAISE EXCEPTION 'Please wait at least 60 seconds before resubmitting this email'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_waitlist_email_rate_trigger ON public.waitlist;
CREATE TRIGGER guard_waitlist_email_rate_trigger
BEFORE INSERT ON public.waitlist
FOR EACH ROW
EXECUTE FUNCTION public.guard_waitlist_email_rate();