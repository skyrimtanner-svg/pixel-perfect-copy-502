import { useMemo } from 'react';
import type { Milestone } from '@/data/milestones';

/**
 * useNebulaPulse — Computes an "activity factor" (0–1) from milestone data
 * that drives nebula breathing intensity and speed via CSS custom properties.
 *
 * Activity is derived from:
 *  - Absolute probability deltas across active milestones
 *  - Number of distinct active domains
 *  - Magnitude-weighted triage scores
 *
 * Higher activity → faster, more intense nebula breathing.
 * Zero milestones or all-historical data → baseline (0).
 */
export function useNebulaPulse(milestones: Milestone[]) {
  return useMemo(() => {
    if (!milestones.length) {
      return {
        activityFactor: 0,
        nebulaStyle: {
          '--nebula-pulse-scale': '0',
          '--nebula-pulse-speed': '1',
        } as React.CSSProperties,
      };
    }

    // Only consider non-historical milestones for activity
    const active = milestones.filter(m => m.tier !== 'historical');
    if (!active.length) {
      return {
        activityFactor: 0,
        nebulaStyle: {
          '--nebula-pulse-scale': '0',
          '--nebula-pulse-speed': '1',
        } as React.CSSProperties,
      };
    }

    // 1. Average absolute delta (probability shift magnitude)
    const avgAbsDelta = active.reduce((sum, m) => sum + Math.abs(m.posterior - m.prior), 0) / active.length;

    // 2. Domain diversity factor (more active domains = more "alive")
    const activeDomains = new Set(active.map(m => m.domain)).size;
    const domainFactor = Math.min(activeDomains / 5, 1); // max 5 domains

    // 3. Magnitude-weighted urgency
    const avgMagnitude = active.reduce((sum, m) => sum + m.magnitude, 0) / active.length;
    const magnitudeFactor = avgMagnitude / 10;

    // Combine: weight delta most heavily (it reflects actual evidence activity)
    const raw = avgAbsDelta * 3.5 + domainFactor * 0.25 + magnitudeFactor * 0.15;
    const activityFactor = Math.min(Math.max(raw, 0), 1);

    // Scale: 0 = baseline breathing, 1 = intense pulsing
    // Speed: 1 = normal (20s), up to 2.2 = fast (≈9s)
    const speedMultiplier = 1 + activityFactor * 1.2;

    return {
      activityFactor,
      nebulaStyle: {
        '--nebula-pulse-scale': activityFactor.toFixed(3),
        '--nebula-pulse-speed': speedMultiplier.toFixed(3),
      } as React.CSSProperties,
    };
  }, [milestones]);
}
