import { describe, it, expect } from 'vitest';
import {
  logOdds,
  fromLogOdds,
  computeContributions,
  runUpdate,
  type EvidenceInput,
} from '@/lib/bayesian';

// ═══════════════════════════════════════════════════════════════
// PROPERTY-BASED TESTS — importing production code directly
// ═══════════════════════════════════════════════════════════════

describe('Bayesian Engine — Core Properties', () => {
  const supportEvidence = (n: number): EvidenceInput[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `support-${i}`,
      direction: 'supports' as const,
      credibility: 0.8, recency: 0.9, consensus: 0.7, criteria_match: 0.8,
    }));

  const contradictEvidence = (n: number): EvidenceInput[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `contradict-${i}`,
      direction: 'contradicts' as const,
      credibility: 0.8, recency: 0.9, consensus: 0.7, criteria_match: 0.8,
    }));

  it('posterior always moves toward 1 when all evidence supports', () => {
    for (const prior of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const result = runUpdate(prior, supportEvidence(3));
      expect(result.posterior).toBeGreaterThan(prior);
      expect(result.posterior).toBeLessThanOrEqual(1);
    }
  });

  it('posterior always moves toward 0 when all evidence contradicts', () => {
    for (const prior of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const result = runUpdate(prior, contradictEvidence(3));
      expect(result.posterior).toBeLessThan(prior);
      expect(result.posterior).toBeGreaterThanOrEqual(0);
    }
  });

  it('no evidence → posterior equals prior', () => {
    for (const prior of [0.1, 0.5, 0.9]) {
      const result = runUpdate(prior, []);
      expect(result.posterior).toBeCloseTo(prior, 10);
      expect(result.delta_log_odds).toBe(0);
    }
  });

  it('more evidence produces larger shifts', () => {
    const r1 = runUpdate(0.5, supportEvidence(1));
    const r3 = runUpdate(0.5, supportEvidence(3));
    const r5 = runUpdate(0.5, supportEvidence(5));
    expect(r3.posterior).toBeGreaterThan(r1.posterior);
    expect(r5.posterior).toBeGreaterThan(r3.posterior);
  });

  it('opposing evidence partially cancels out', () => {
    const mixed: EvidenceInput[] = [...supportEvidence(2), ...contradictEvidence(2)];
    const result = runUpdate(0.5, mixed);
    expect(Math.abs(result.posterior - 0.5)).toBeLessThan(0.05);
  });

  it('higher credibility evidence has stronger effect', () => {
    const lowCred: EvidenceInput[] = [{
      id: 'low', direction: 'supports', credibility: 0.2, recency: 0.9, consensus: 0.7, criteria_match: 0.8,
    }];
    const highCred: EvidenceInput[] = [{
      id: 'high', direction: 'supports', credibility: 0.95, recency: 0.9, consensus: 0.7, criteria_match: 0.8,
    }];
    const rLow = runUpdate(0.5, lowCred);
    const rHigh = runUpdate(0.5, highCred);
    expect(rHigh.posterior - 0.5).toBeGreaterThan(rLow.posterior - 0.5);
  });

  it('posterior stays bounded in [0, 1] under extreme evidence', () => {
    const result = runUpdate(0.99, supportEvidence(20));
    expect(result.posterior).toBeLessThanOrEqual(1);
    expect(result.posterior).toBeGreaterThan(0);

    const result2 = runUpdate(0.01, contradictEvidence(20));
    expect(result2.posterior).toBeGreaterThanOrEqual(0);
    expect(result2.posterior).toBeLessThan(1);
  });

  it('ambiguous evidence produces near-zero shift', () => {
    const ambig: EvidenceInput[] = Array.from({ length: 5 }, (_, i) => ({
      id: `ambig-${i}`, direction: 'ambiguous' as const,
      credibility: 0.8, recency: 0.9, consensus: 0.7, criteria_match: 0.8,
    }));
    const result = runUpdate(0.5, ambig);
    expect(Math.abs(result.posterior - 0.5)).toBeLessThan(0.15);
  });

  it('delta_log_odds is additive (sum of contributions)', () => {
    const result = runUpdate(0.5, supportEvidence(3));
    const sumContribs = result.contributions.reduce((s, c) => s + c.delta_log_odds, 0);
    expect(result.delta_log_odds).toBeCloseTo(sumContribs, 10);
  });

  it('composite = credibility × recency × consensus × criteria_match', () => {
    const ev: EvidenceInput = {
      id: 'test', direction: 'supports',
      credibility: 0.8, recency: 0.6, consensus: 0.9, criteria_match: 0.7,
    };
    const result = runUpdate(0.5, [ev]);
    expect(result.contributions[0].composite).toBeCloseTo(0.8 * 0.6 * 0.9 * 0.7, 10);
  });
});

describe('Bayesian Engine — Log-Odds Math', () => {
  it('logOdds and fromLogOdds are inverse functions', () => {
    for (const p of [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) {
      expect(fromLogOdds(logOdds(p))).toBeCloseTo(p, 8);
    }
  });

  it('logOdds(0.5) = 0', () => {
    expect(logOdds(0.5)).toBeCloseTo(0, 10);
  });

  it('logOdds is monotonically increasing', () => {
    const probs = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    for (let i = 1; i < probs.length; i++) {
      expect(logOdds(probs[i])).toBeGreaterThan(logOdds(probs[i - 1]));
    }
  });

  it('fromLogOdds handles extreme values without NaN', () => {
    expect(fromLogOdds(100)).toBeCloseTo(1, 5);
    expect(fromLogOdds(-100)).toBeCloseTo(0, 5);
    expect(fromLogOdds(0)).toBeCloseTo(0.5, 10);
    expect(Number.isNaN(fromLogOdds(1000))).toBe(false);
    expect(Number.isNaN(fromLogOdds(-1000))).toBe(false);
  });
});
