import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════
// Triage Score computation — mirrors useMilestones.ts logic
// ═══════════════════════════════════════════════════════════════

function computeTriageScore(m: { posterior: number; delta_log_odds: number; magnitude: number; year: number; tier: string }): number {
  const now = new Date().getFullYear();
  const yearsOut = Math.max(0.5, m.year - now);
  const proximity = Math.max(0.1, 1 / Math.sqrt(yearsOut));
  const uncertainty = 1 - Math.abs(m.posterior - 0.5) * 2;
  const urgency = Math.min(3, Math.abs(m.delta_log_odds)) * 0.6 + uncertainty * 0.4;
  const tierMul = m.tier === 'active' ? 1.3 : m.tier === 'plausible' ? 1.0 : m.tier === 'speculative' ? 0.7 : 0.2;
  if (m.tier === 'historical') return Math.round(m.magnitude);
  const raw = urgency * proximity * (m.magnitude / 10) * tierMul * 100;
  return Math.round(Math.min(99, Math.max(1, raw)));
}

describe('Triage Score Computation', () => {
  it('historical milestones return magnitude directly', () => {
    const score = computeTriageScore({ posterior: 1.0, delta_log_odds: 10, magnitude: 9, year: 1712, tier: 'historical' });
    expect(score).toBe(9);
  });

  it('scores are bounded between 1 and 99', () => {
    // Extreme high case
    const high = computeTriageScore({ posterior: 0.5, delta_log_odds: 5, magnitude: 10, year: new Date().getFullYear() + 1, tier: 'active' });
    expect(high).toBeLessThanOrEqual(99);
    expect(high).toBeGreaterThanOrEqual(1);

    // Extreme low case
    const low = computeTriageScore({ posterior: 0.01, delta_log_odds: 0, magnitude: 1, year: new Date().getFullYear() + 50, tier: 'speculative' });
    expect(low).toBeLessThanOrEqual(99);
    expect(low).toBeGreaterThanOrEqual(1);
  });

  it('closer milestones score higher than distant ones (same params)', () => {
    const base = { posterior: 0.5, delta_log_odds: 1.0, magnitude: 8, tier: 'active' };
    const close = computeTriageScore({ ...base, year: new Date().getFullYear() + 2 });
    const far = computeTriageScore({ ...base, year: new Date().getFullYear() + 20 });
    expect(close).toBeGreaterThan(far);
  });

  it('active tier scores higher than speculative (same params)', () => {
    const base = { posterior: 0.5, delta_log_odds: 1.0, magnitude: 8, year: new Date().getFullYear() + 5 };
    const active = computeTriageScore({ ...base, tier: 'active' });
    const spec = computeTriageScore({ ...base, tier: 'speculative' });
    expect(active).toBeGreaterThan(spec);
  });

  it('higher magnitude produces higher score', () => {
    const base = { posterior: 0.5, delta_log_odds: 1.0, year: new Date().getFullYear() + 5, tier: 'active' };
    const low = computeTriageScore({ ...base, magnitude: 3 });
    const high = computeTriageScore({ ...base, magnitude: 10 });
    expect(high).toBeGreaterThan(low);
  });

  it('milestones near 50% posterior score higher (more uncertain)', () => {
    const base = { delta_log_odds: 1.0, magnitude: 8, year: new Date().getFullYear() + 5, tier: 'active' };
    const uncertain = computeTriageScore({ ...base, posterior: 0.5 });
    const certain = computeTriageScore({ ...base, posterior: 0.95 });
    expect(uncertain).toBeGreaterThan(certain);
  });
});
