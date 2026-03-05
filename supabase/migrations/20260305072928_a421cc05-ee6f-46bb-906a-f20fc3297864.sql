
-- Pending evidence queue for admin review
CREATE TABLE public.pending_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id text NOT NULL,
  source text NOT NULL,
  source_url text,
  direction text NOT NULL DEFAULT 'ambiguous',
  evidence_type text NOT NULL DEFAULT 'unknown',
  publisher_tier integer NOT NULL DEFAULT 4,
  credibility double precision NOT NULL DEFAULT 0.5,
  consensus double precision NOT NULL DEFAULT 0.5,
  criteria_match double precision NOT NULL DEFAULT 0.5,
  recency double precision NOT NULL DEFAULT 0.5,
  composite_score double precision NOT NULL DEFAULT 0,
  summary text,
  raw_snippet text,
  status text NOT NULL DEFAULT 'pending',
  scout_run_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

-- Scout action logs
CREATE TABLE public.scout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  action text NOT NULL,
  detail jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for pending_evidence
ALTER TABLE public.pending_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pending evidence"
ON public.pending_evidence FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert pending evidence"
ON public.pending_evidence FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS for scout_logs
ALTER TABLE public.scout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view scout logs"
ON public.scout_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert scout logs"
ON public.scout_logs FOR INSERT
TO authenticated
WITH CHECK (true);
