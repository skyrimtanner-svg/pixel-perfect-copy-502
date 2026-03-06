CREATE TABLE public.socratic_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.socratic_topics(id) ON DELETE CASCADE,
  milestone_id text NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.socratic_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comments" ON public.socratic_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comments" ON public.socratic_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.socratic_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.socratic_comments;