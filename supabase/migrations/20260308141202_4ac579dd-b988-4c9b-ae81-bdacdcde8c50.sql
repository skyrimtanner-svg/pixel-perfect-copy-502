
CREATE TABLE public.scout_directives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scout_directives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scout directives"
  ON public.scout_directives FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read scout directives"
  ON public.scout_directives FOR SELECT
  TO authenticated
  USING (true);

-- Seed default directives
INSERT INTO public.scout_directives (key, value, description) VALUES
  ('search_focus', E'## Search Focus\n\n- Prioritize peer-reviewed publications and preprints\n- Weight recent conference proceedings (NeurIPS, ICML, Nature, Science)\n- Track patent filings from major tech companies\n- Monitor clinical trial registrations for biology milestones', 'Controls which sources and topics the Evidence Scout prioritizes during search.'),
  ('scoring_weights', E'## Scoring Weights\n\n- credibility: 0.35 (publisher tier, citation count)\n- recency: 0.25 (prefer last 90 days)\n- consensus: 0.20 (corroboration across sources)\n- criteria_match: 0.20 (alignment with milestone success criteria)', 'Defines the relative importance of each scoring dimension.'),
  ('auto_commit_rules', E'## Auto-Commit Rules\n\n- composite_score >= 0.75: auto-commit to live evidence\n- composite_score 0.35-0.74: route to pending queue for review\n- composite_score < 0.35: discard as low-signal\n- Never auto-commit contradicting evidence without admin review', 'Thresholds and rules for automatic evidence commitment.'),
  ('domain_priorities', E'## Domain Priorities\n\n- compute: HIGH (fast-moving, many signals)\n- biology: HIGH (clinical trials, regulatory filings)\n- energy: MEDIUM (longer cycles, fewer signals)\n- connectivity: MEDIUM\n- manufacturing: LOW (sparse public data)', 'Per-domain priority levels that affect scan frequency and depth.');
