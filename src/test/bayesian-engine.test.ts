import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════
// Re-implement core Bayesian engine functions for testing
// (These mirror the edge function logic in milestones-api/index.ts)
// ═══════════════════════════════════════════════════════════════

function logOdds(p: number): number {
  const clamped = Math.max(0.0001, Math.min(0.9999, p));
  return Math.log(clamped / (1 - clamped));
}

function fromLogOdds(lo: number): number {
  return 1 / (1 + Math.exp(-lo));
}

interface EvidenceInput {
  id: string;
  direction: 'supports' | 'contradicts' | 'ambiguous';
  credibility: number;
  recency: number;
  consensus: number;
  criteria_match: number;
}

interface Contribution {
  evidence_id: string;
  composite: number;
  delta_log_odds: number;
}

function computeContributions(evidence: EvidenceInput[]): Contribution[] {
  return evidence.map(ev => {
    const composite = ev.credibility * ev.recency * ev.consensus * ev.criteria_match;
    const sign = ev.direction === 'supports' ? 1 : ev.direction === 'contradicts' ? -1 : 0.1;
    const dlo = sign * composite * 2;
    return { evidence_id: ev.id, composite, delta_log_odds: dlo };
  });
}

function runUpdate(prior: number, evidence: EvidenceInput[]): { prior: number; posterior: number; delta_log_odds: number; contributions: Contribution[] } {
  const priorLO = logOdds(prior);
  const contributions = computeContributions(evidence);
  const totalDeltaLO = contributions.reduce((s, c) => s + c.delta_log_odds, 0);
  const posteriorLO = priorLO + totalDeltaLO;
  const posterior = fromLogOdds(posteriorLO);
  return { prior, posterior, delta_log_odds: totalDeltaLO, contributions };
}

// ═══════════════════════════════════════════════════════════════
// PROPERTY-BASED TESTS
// ═══════════════════════════════════════════════════════════════

describe('Bayesian Engine — Core Properties', () => {
  // Helper: generate supporting evidence
  const supportEvidence = (n: number): EvidenceInput[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `support-${i}`,
      direction: 'supports' as const,
      credibility: 0.8,
      recency: 0.9,
      consensus: 0.7,
      criteria_match: 0.8,
    }));

  const contradictEvidence = (n: number): EvidenceInput[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `contradict-${i}`,
      direction: 'contradicts' as const,
      credibility: 0.8,
      recency: 0.9,
      consensus: 0.7,
      criteria_match: 0.8,
    }));

  it('posterior always moves toward 1 when all evidence supports', () => {
    const priors = [0.1, 0.3, 0.5, 0.7, 0.9];
    for (const prior of priors) {
      const result = runUpdate(prior, supportEvidence(3));
      expect(result.posterior).toBeGreaterThan(prior);
      expect(result.posterior).toBeLessThanOrEqual(1);
    }
  });

  it('posterior always moves toward 0 when all evidence contradicts', () => {
    const priors = [0.1, 0.3, 0.5, 0.7, 0.9];
    for (const prior of priors) {
      const result = runUpdate(prior, contradictEvidence(3));
      expect(result.posterior).toBeLessThan(prior);
      expect(result.posterior).toBeGreaterThanOrEqual(0);
    }
  });

  it('no evidence → posterior equals prior', () => {
    const priors = [0.1, 0.5, 0.9];
    for (const prior of priors) {
      const result = runUpdate(prior, []);
      expect(result.posterior).toBeCloseTo(prior, 10);
      expect(result.delta_log_odds).toBe(0);
    }
  });

  it('more evidence produces larger shifts', () => {
    const prior = 0.5;
    const r1 = runUpdate(prior, supportEvidence(1));
    const r3 = runUpdate(prior, supportEvidence(3));
    const r5 = runUpdate(prior, supportEvidence(5));
    expect(r3.posterior).toBeGreaterThan(r1.posterior);
    expect(r5.posterior).toBeGreaterThan(r3.posterior);
  });

  it('opposing evidence partially cancels out', () => {
    const prior = 0.5;
    const mixed: EvidenceInput[] = [
      ...supportEvidence(2),
      ...contradictEvidence(2),
    ];
    const result = runUpdate(prior, mixed);
    // Net effect should be near zero since equal support/contradict
    expect(Math.abs(result.posterior - prior)).toBeLessThan(0.05);
  });

  it('higher credibility evidence has stronger effect', () => {
    const prior = 0.5;
    const lowCred: EvidenceInput[] = [{
      id: 'low', direction: 'supports', credibility: 0.2, recency: 0.9, consensus: 0.7, criteria_match: 0.8,
    }];
    const highCred: EvidenceInput[] = [{
      id: 'high', direction: 'supports', credibility: 0.95, recency: 0.9, consensus: 0.7, criteria_match: 0.8,
    }];
    const rLow = runUpdate(prior, lowCred);
    const rHigh = runUpdate(prior, highCred);
    expect(rHigh.posterior - prior).toBeGreaterThan(rLow.posterior - prior);
  });

  it('posterior stays bounded in [0, 1] under extreme evidence', () => {
    // 20 strong supporting evidence pieces
    const result = runUpdate(0.99, supportEvidence(20));
    expect(result.posterior).toBeLessThanOrEqual(1);
    expect(result.posterior).toBeGreaterThan(0);

    // 20 strong contradicting pieces from very low prior
    const result2 = runUpdate(0.01, contradictEvidence(20));
    expect(result2.posterior).toBeGreaterThanOrEqual(0);
    expect(result2.posterior).toBeLessThan(1);
  });

  it('ambiguous evidence produces near-zero shift', () => {
    const prior = 0.5;
    const ambig: EvidenceInput[] = Array.from({ length: 5 }, (_, i) => ({
      id: `ambig-${i}`, direction: 'ambiguous' as const,
      credibility: 0.8, recency: 0.9, consensus: 0.7, criteria_match: 0.8,
    }));
    const result = runUpdate(prior, ambig);
    // Ambiguous uses sign=0.1, so effect should be small
    expect(Math.abs(result.posterior - prior)).toBeLessThan(0.15);
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
    const expected = 0.8 * 0.6 * 0.9 * 0.7;
    expect(result.contributions[0].composite).toBeCloseTo(expected, 10);
  });
});

describe('Bayesian Engine — Log-Odds Math', () => {
  it('logOdds and fromLogOdds are inverse functions', () => {
    const probabilities = [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99];
    for (const p of probabilities) {
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
