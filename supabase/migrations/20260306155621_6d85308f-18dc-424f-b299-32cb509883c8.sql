
-- Harden RLS write policies: restrict to service_role only
-- This prevents malicious clients from bypassing edge functions to write directly

-- === EVIDENCE table ===
DROP POLICY IF EXISTS "Service insert evidence" ON public.evidence;
CREATE POLICY "Service insert evidence" ON public.evidence
  FOR INSERT TO service_role
  WITH CHECK (true);

-- === MILESTONES table ===
DROP POLICY IF EXISTS "Service insert milestones" ON public.milestones;
CREATE POLICY "Service insert milestones" ON public.milestones
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service update milestones" ON public.milestones;
CREATE POLICY "Service update milestones" ON public.milestones
  FOR UPDATE TO service_role
  USING (true);

-- === TRUST_LEDGER table ===
DROP POLICY IF EXISTS "Service insert trust_ledger" ON public.trust_ledger;
CREATE POLICY "Service insert trust_ledger" ON public.trust_ledger
  FOR INSERT TO service_role
  WITH CHECK (true);

-- === LATENT_STATES table ===
DROP POLICY IF EXISTS "Service insert latent_states" ON public.latent_states;
CREATE POLICY "Service insert latent_states" ON public.latent_states
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service update latent_states" ON public.latent_states;
CREATE POLICY "Service update latent_states" ON public.latent_states
  FOR UPDATE TO service_role
  USING (true);

-- === LATENT_LOG table ===
DROP POLICY IF EXISTS "Service insert latent_log" ON public.latent_log;
CREATE POLICY "Service insert latent_log" ON public.latent_log
  FOR INSERT TO service_role
  WITH CHECK (true);

-- === SCOUT_LOGS table ===
DROP POLICY IF EXISTS "Service can insert scout logs" ON public.scout_logs;
CREATE POLICY "Service can insert scout logs" ON public.scout_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- === SOCRATIC_COMMENTS: service role insert for AI comments ===
DROP POLICY IF EXISTS "Service can insert AI comments" ON public.socratic_comments;
CREATE POLICY "Service can insert AI comments" ON public.socratic_comments
  FOR INSERT TO service_role
  WITH CHECK (true);

-- === SOCRATIC_TOPICS table ===
DROP POLICY IF EXISTS "Service insert socratic_topics" ON public.socratic_topics;
CREATE POLICY "Service insert socratic_topics" ON public.socratic_topics
  FOR INSERT TO service_role
  WITH CHECK (true);

-- === PENDING_EVIDENCE: service role insert ===
DROP POLICY IF EXISTS "Service can insert pending evidence" ON public.pending_evidence;
CREATE POLICY "Service can insert pending evidence" ON public.pending_evidence
  FOR INSERT TO service_role
  WITH CHECK (true);
