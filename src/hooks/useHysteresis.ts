import { useState, useCallback, useRef } from 'react';

/**
 * Client-side hysteresis tracker for what-if simulations.
 * Tracks consecutive low-confidence updates and triggers demotion after threshold.
 * 
 * v3.0 rule: 3 consecutive low-confidence updates → demote archetype
 */

const DEMOTION_THRESHOLD = 3;

interface HysteresisState {
  consecutiveDrops: number;
  shouldDemote: boolean;
  demotedArchetype: string | null;
  originalArchetype: string | null;
}

const DEMOTION_MAP: Record<string, string> = {
  breakthrough: 'bottleneck',
  convergence: 'bottleneck',
  sleeper: 'bottleneck',
  wildcard: 'bottleneck',
  anchor: 'bottleneck',
};

export function useHysteresis() {
  const [state, setState] = useState<HysteresisState>({
    consecutiveDrops: 0,
    shouldDemote: false,
    demotedArchetype: null,
    originalArchetype: null,
  });
  const prevPosteriorRef = useRef<number | null>(null);

  const recordUpdate = useCallback((posterior: number, prior: number, archetype: string) => {
    const isLowConfidence = posterior < prior;
    
    setState(prev => {
      const newDrops = isLowConfidence ? prev.consecutiveDrops + 1 : 0;
      const shouldDemote = newDrops >= DEMOTION_THRESHOLD;
      const demoted = shouldDemote && DEMOTION_MAP[archetype] ? DEMOTION_MAP[archetype] : null;

      return {
        consecutiveDrops: newDrops,
        shouldDemote,
        demotedArchetype: demoted,
        originalArchetype: shouldDemote ? archetype : null,
      };
    });

    prevPosteriorRef.current = posterior;
  }, []);

  const reset = useCallback(() => {
    setState({
      consecutiveDrops: 0,
      shouldDemote: false,
      demotedArchetype: null,
      originalArchetype: null,
    });
    prevPosteriorRef.current = null;
  }, []);

  return { ...state, recordUpdate, reset };
}
