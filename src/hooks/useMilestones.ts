import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Milestone, Domain, Tier, Status, Archetype } from '@/data/milestones';

/**
 * v3.0 Triage Score: urgency × proximity × magnitude
 * urgency = |delta_log_odds| + abs(posterior - 0.5) inversion (milestones near 50% are more uncertain)
 * proximity = 1 / max(1, year - currentYear) (closer milestones rank higher)
 */
function computeTriageScore(m: { posterior: number; delta_log_odds: number; magnitude: number; year: number; tier: string }): number {
  const now = new Date().getFullYear();
  const yearsOut = Math.max(0.5, m.year - now);
  // Proximity: closer milestones score higher, with diminishing returns
  const proximity = Math.max(0.1, 1 / Math.sqrt(yearsOut));
  // Uncertainty: milestones near 50% are most uncertain/interesting
  const uncertainty = 1 - Math.abs(m.posterior - 0.5) * 2;
  // Urgency: combines absolute log-odds shift with uncertainty
  const urgency = Math.min(3, Math.abs(m.delta_log_odds)) * 0.6 + uncertainty * 0.4;
  // Tier multiplier
  const tierMul = m.tier === 'active' ? 1.3 : m.tier === 'plausible' ? 1.0 : m.tier === 'speculative' ? 0.7 : 0.2;
  // Historical milestones get minimal scores
  if (m.tier === 'historical') return Math.round(m.magnitude);
  const raw = urgency * proximity * (m.magnitude / 10) * tierMul * 100;
  return Math.round(Math.min(99, Math.max(1, raw)));
}

function dbToMilestone(row: any): Milestone {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    domain: row.domain as Domain,
    tier: row.tier as Tier,
    status: row.status as Status,
    magnitude: row.magnitude,
    prior: row.prior,
    posterior: row.posterior,
    delta_log_odds: row.delta_log_odds,
    evidence: [],
    success_criteria: row.success_criteria || '',
    falsification: row.falsification || '',
    dependencies: row.dependencies || [],
    description: row.description || '',
    triageScore: row.triage_score || computeTriageScore(row),
    archetype: (row.archetype || 'convergence') as Archetype,
  };
}

export function useMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestones = useCallback(async () => {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch milestones:', error);
      return;
    }

    if (data) {
      const mapped = data.map(row => {
        const m = dbToMilestone(row);
        // Recompute triage score from live data
        m.triageScore = computeTriageScore(row);
        return m;
      });
      setMilestones(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMilestones();

    // Real-time subscription
    const channel = supabase
      .channel('milestones-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'milestones' },
        () => {
          // Refetch all on any change for consistency
          fetchMilestones();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMilestones]);

  const sorted = useMemo(() => 
    [...milestones].sort((a, b) => b.triageScore - a.triageScore),
    [milestones]
  );

  return { milestones: sorted, loading, refetch: fetchMilestones };
}
