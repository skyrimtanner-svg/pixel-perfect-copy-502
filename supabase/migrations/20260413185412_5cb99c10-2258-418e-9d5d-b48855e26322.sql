
-- Remove dead anon policy on waitlist
DROP POLICY IF EXISTS "Anon can check own email" ON public.waitlist;

-- Harden profile INSERT to enforce tier = 'free'
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND tier = 'free');
