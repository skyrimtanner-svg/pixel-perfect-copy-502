import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Milestone, Domain, Tier, Status, Archetype } from '@/data/milestones';
import { computeTriageScore } from '@/lib/triage-score';


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
