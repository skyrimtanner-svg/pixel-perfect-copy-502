-- Harden profiles UPDATE policy to also prevent email spoofing
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND tier = (SELECT p.tier FROM public.profiles p WHERE p.user_id = auth.uid())
  AND email = (SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid())
);