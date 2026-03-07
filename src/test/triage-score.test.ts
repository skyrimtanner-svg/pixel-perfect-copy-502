import { describe, it, expect } from 'vitest';
import { computeTriageScore } from '@/lib/triage-score';

describe('Triage Score Computation', () => {
  it('historical milestones return magnitude directly', () => {
    const score = computeTriageScore({ posterior: 1.0, delta_log_odds: 10, magnitude: 9, year: 1712, tier: 'historical' });
    expect(score).toBe(9);
  });

  it('scores are bounded between 1 and 99', () => {
    const high = computeTriageScore({ posterior: 0.5, delta_log_odds: 5, magnitude: 10, year: new Date().getFullYear() + 1, tier: 'active' });
    expect(high).toBeLessThanOrEqual(99);
    expect(high).toBeGreaterThanOrEqual(1);

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
