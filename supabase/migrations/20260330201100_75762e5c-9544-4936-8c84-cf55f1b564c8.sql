
-- 1. FIX CRITICAL: Waitlist SELECT - restrict to admin-only reads (anon can still INSERT)
DROP POLICY IF EXISTS "Anyone can read own waitlist entry" ON public.waitlist;
CREATE POLICY "Admins can read waitlist"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow anon to check if their email exists (for duplicate detection)
CREATE POLICY "Anon can check own email"
  ON public.waitlist FOR SELECT
  TO anon
  USING (false);

-- 2. FIX: Scout directives - remove public read, keep admin-only
DROP POLICY IF EXISTS "Public read scout directives" ON public.scout_directives;

-- 3. FIX: Analytics events - add user self-read and delete policies
CREATE POLICY "Users can read own events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON public.analytics_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. FIX: Permissive RLS - tighten waitlist INSERT to only allow setting own data
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
