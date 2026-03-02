
-- Milestones table
CREATE TABLE public.milestones (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('compute','energy','connectivity','manufacturing','biology')),
  tier TEXT NOT NULL CHECK (tier IN ('historical','active','plausible','speculative')),
  status TEXT NOT NULL DEFAULT 'projected',
  magnitude INTEGER NOT NULL DEFAULT 5,
  prior DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  posterior DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  delta_log_odds DOUBLE PRECISION NOT NULL DEFAULT 0,
  success_criteria TEXT,
  falsification TEXT,
  dependencies TEXT[] DEFAULT '{}',
  description TEXT,
  triage_score DOUBLE PRECISION DEFAULT 0,
  archetype TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evidence table
CREATE TABLE public.evidence (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  milestone_id TEXT NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  type TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('supports','contradicts','ambiguous')),
  credibility DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  recency DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  consensus DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  criteria_match DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  composite DOUBLE PRECISION NOT NULL DEFAULT 0,
  delta_log_odds DOUBLE PRECISION NOT NULL DEFAULT 0,
  date TEXT,
  summary TEXT,
  raw_sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evidence_milestone ON public.evidence(milestone_id);

-- Latent state per milestone
CREATE TABLE public.latent_states (
  milestone_id TEXT PRIMARY KEY REFERENCES public.milestones(id) ON DELETE CASCADE,
  mu DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  sigma DOUBLE PRECISION NOT NULL DEFAULT 0.25,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Latent update log (for momentum, diagnostics)
CREATE TABLE public.latent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id TEXT NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  domain TEXT,
  prior_mu DOUBLE PRECISION,
  post_mu DOUBLE PRECISION,
  mu_delta DOUBLE PRECISION,
  prior_sigma DOUBLE PRECISION,
  post_sigma DOUBLE PRECISION,
  z_hat DOUBLE PRECISION,
  tau DOUBLE PRECISION,
  adjusted_confidence DOUBLE PRECISION,
  was_conflict_shock_applied BOOLEAN DEFAULT false,
  hysteresis_blocked BOOLEAN DEFAULT false,
  boundary_crossed BOOLEAN DEFAULT false,
  wire_cap_activated BOOLEAN DEFAULT false,
  derived_source_count INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_latent_log_milestone ON public.latent_log(milestone_id);

-- Trust Ledger: immutable snapshots with SHA-256 hash
CREATE TABLE public.trust_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id TEXT NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL DEFAULT 'evidence_update',
  prior DOUBLE PRECISION NOT NULL,
  posterior DOUBLE PRECISION NOT NULL,
  prior_log_odds DOUBLE PRECISION,
  posterior_log_odds DOUBLE PRECISION,
  delta_log_odds DOUBLE PRECISION,
  evidence_id TEXT,
  contributions JSONB DEFAULT '[]',
  propagation JSONB DEFAULT '[]',
  calibration_snapshot JSONB,
  full_state JSONB NOT NULL,
  sha256_hash TEXT NOT NULL,
  prev_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trust_ledger_milestone ON public.trust_ledger(milestone_id);
CREATE INDEX idx_trust_ledger_hash ON public.trust_ledger(sha256_hash);

-- Enable RLS on all tables
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.latent_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.latent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_ledger ENABLE ROW LEVEL SECURITY;

-- Public read for all tables (observatory data is public)
CREATE POLICY "Public read milestones" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "Public read evidence" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "Public read latent_states" ON public.latent_states FOR SELECT USING (true);
CREATE POLICY "Public read latent_log" ON public.latent_log FOR SELECT USING (true);
CREATE POLICY "Public read trust_ledger" ON public.trust_ledger FOR SELECT USING (true);

-- Service role only for writes (edge functions use service role)
CREATE POLICY "Service insert milestones" ON public.milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update milestones" ON public.milestones FOR UPDATE USING (true);
CREATE POLICY "Service insert evidence" ON public.evidence FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert latent_states" ON public.latent_states FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update latent_states" ON public.latent_states FOR UPDATE USING (true);
CREATE POLICY "Service insert latent_log" ON public.latent_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert trust_ledger" ON public.trust_ledger FOR INSERT WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
