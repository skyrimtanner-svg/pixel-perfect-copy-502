/**
 * Core Bayesian math functions used across the application.
 * These are the canonical implementations — tests import from here.
 * The edge function (milestones-api) maintains its own copy for Deno compatibility.
 */

/** Convert probability to log-odds. Clamps to avoid ±Infinity. */
export function logOdds(p: number): number {
  const clamped = Math.max(0.0001, Math.min(0.9999, p));
  return Math.log(clamped / (1 - clamped));
}

/** Convert log-odds back to probability. */
export function fromLogOdds(lo: number): number {
  return 1 / (1 + Math.exp(-lo));
}

export interface EvidenceInput {
  id: string;
  direction: 'supports' | 'contradicts' | 'ambiguous';
  credibility: number;
  recency: number;
  consensus: number;
  criteria_match: number;
}

export interface Contribution {
  evidence_id: string;
  composite: number;
  delta_log_odds: number;
}

/** Compute per-evidence contributions as composite × direction sign × 2. */
export function computeContributions(evidence: EvidenceInput[]): Contribution[] {
  return evidence.map(ev => {
    const composite = ev.credibility * ev.recency * ev.consensus * ev.criteria_match;
    const sign = ev.direction === 'supports' ? 1 : ev.direction === 'contradicts' ? -1 : 0.1;
    const dlo = sign * composite * 2;
    return { evidence_id: ev.id, composite, delta_log_odds: dlo };
  });
}

/** Run a full Bayesian update: prior + evidence → posterior. */
export function runUpdate(prior: number, evidence: EvidenceInput[]) {
  const priorLO = logOdds(prior);
  const contributions = computeContributions(evidence);
  const totalDeltaLO = contributions.reduce((s, c) => s + c.delta_log_odds, 0);
  const posteriorLO = priorLO + totalDeltaLO;
  const posterior = fromLogOdds(posteriorLO);
  return { prior, posterior, delta_log_odds: totalDeltaLO, contributions };
}
