ALTER TABLE public.socratic_comments ADD COLUMN is_ai boolean NOT NULL DEFAULT false;
ALTER TABLE public.socratic_comments ALTER COLUMN user_id DROP NOT NULL;