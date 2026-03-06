CREATE TABLE public.socratic_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id text DEFAULT NULL,
  topic_title text NOT NULL,
  socratic_question text NOT NULL,
  cynical_lens text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.socratic_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read socratic_topics" ON public.socratic_topics FOR SELECT USING (true);
CREATE POLICY "Service insert socratic_topics" ON public.socratic_topics FOR INSERT WITH CHECK (true);