
-- Add evidence queue automation columns
ALTER TABLE public.pending_evidence
  ADD COLUMN IF NOT EXISTS queue_reason text DEFAULT 'scout_queued',
  ADD COLUMN IF NOT EXISTS contradiction_pressure double precision DEFAULT 0,
  ADD COLUMN IF NOT EXISTS decayed_score double precision,
  ADD COLUMN IF NOT EXISTS decay_applied_at timestamp with time zone;

-- Backfill decayed_score from composite_score for existing rows
UPDATE public.pending_evidence
SET decayed_score = composite_score
WHERE decayed_score IS NULL;

-- Set default for decayed_score going forward
ALTER TABLE public.pending_evidence
  ALTER COLUMN decayed_score SET DEFAULT 0;
