/**
 * v3.0 Triage Score computation.
 * Canonical implementation — imported by useMilestones and tests.
 *
 * urgency  = |delta_log_odds| × 0.6 + uncertainty × 0.4
 * proximity = 1 / √(yearsOut)
 * score    = urgency × proximity × (magnitude/10) × tierMultiplier × 100
 */
export function computeTriageScore(m: {
  posterior: number;
  delta_log_odds: number;
  magnitude: number;
  year: number;
  tier: string;
}): number {
  const now = new Date().getFullYear();
  const yearsOut = Math.max(0.5, m.year - now);
  const proximity = Math.max(0.1, 1 / Math.sqrt(yearsOut));
  const uncertainty = 1 - Math.abs(m.posterior - 0.5) * 2;
  const urgency = Math.min(3, Math.abs(m.delta_log_odds)) * 0.6 + uncertainty * 0.4;
  const tierMul = m.tier === 'active' ? 1.3
    : m.tier === 'plausible' ? 1.0
    : m.tier === 'speculative' ? 0.7
    : 0.2;
  if (m.tier === 'historical') return Math.round(m.magnitude);
  const raw = urgency * proximity * (m.magnitude / 10) * tierMul * 100;
  return Math.round(Math.min(99, Math.max(1, raw)));
}
