
-- 1. Fix profiles tier escalation: replace UPDATE policy to prevent tier changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND tier = (SELECT p.tier FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 2. Fix socratic_comments AI spoofing: replace INSERT policy to enforce is_ai = false
DROP POLICY IF EXISTS "Users can insert own comments" ON public.socratic_comments;
CREATE POLICY "Users can insert own comments" ON public.socratic_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_ai = false);

-- 3. Tighten waitlist INSERT: validate email format via WITH CHECK
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) <= 255
    AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  );
