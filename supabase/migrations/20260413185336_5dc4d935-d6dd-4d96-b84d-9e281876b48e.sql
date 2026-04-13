
-- Fix waitlist spot_number: auto-assign server-side, ignore client value
CREATE OR REPLACE FUNCTION public.assign_waitlist_spot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.spot_number := (SELECT COALESCE(MAX(spot_number), 0) + 1 FROM public.waitlist);
  RETURN NEW;
END;
$$;

CREATE TRIGGER waitlist_auto_spot
BEFORE INSERT ON public.waitlist
FOR EACH ROW
EXECUTE FUNCTION public.assign_waitlist_spot();
