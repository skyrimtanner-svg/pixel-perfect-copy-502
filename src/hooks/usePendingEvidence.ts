import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logOdds, fromLogOdds } from '@/lib/bayesian';

export interface PendingItem {
  id: string;
  milestone_id: string;
  milestone_title?: string;
  milestone_posterior?: number;
  source: string;
  source_url: string | null;
  summary: string | null;
  direction: 'supports' | 'contradicts' | 'ambiguous';
  composite_score: number;
  credibility: number;
  recency: number;
  consensus: number;
  criteria_match: number;
  created_at: string;
  /** Simulated Δ log-odds if this evidence were approved */
  simulated_delta_lo: number;
  /** Simulated posterior if this evidence were approved */
  simulated_posterior: number;
}

export function usePendingEvidence() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  const fetchPending = useCallback(async () => {
    if (!isAdmin) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Fetch pending evidence + milestone data for shadow computation
    const { data: pending, error } = await supabase
      .from('pending_evidence')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !pending) {
      console.error('Failed to fetch pending evidence:', error);
      setLoading(false);
      return;
    }

    // Get milestone data for shadow Bayesian computation
    const milestoneIds = [...new Set(pending.map(p => p.milestone_id))];
    const { data: milestones } = await supabase
      .from('milestones')
      .select('id, title, posterior')
      .in('id', milestoneIds.length > 0 ? milestoneIds : ['__none__']);

    const milestoneMap = new Map(
      (milestones || []).map(m => [m.id, { title: m.title, posterior: m.posterior }])
    );

    const enriched: PendingItem[] = pending.map(p => {
      const ms = milestoneMap.get(p.milestone_id);
      const currentPosterior = ms?.posterior ?? 0.5;

      // Shadow Bayesian update: compute what would change
      const composite = p.credibility * p.recency * p.consensus * p.criteria_match;
      const sign = p.direction === 'supports' ? 1 : p.direction === 'contradicts' ? -1 : 0.1;
      const deltaLO = sign * composite * 2;
      const currentLO = logOdds(currentPosterior);
      const newPosterior = fromLogOdds(currentLO + deltaLO);

      return {
        id: p.id,
        milestone_id: p.milestone_id,
        milestone_title: ms?.title,
        milestone_posterior: currentPosterior,
        source: p.source,
        source_url: p.source_url,
        summary: p.summary,
        direction: p.direction as PendingItem['direction'],
        composite_score: p.composite_score,
        credibility: p.credibility,
        recency: p.recency,
        consensus: p.consensus,
        criteria_match: p.criteria_match,
        created_at: p.created_at,
        simulated_delta_lo: deltaLO,
        simulated_posterior: newPosterior,
      };
    });

    setItems(enriched);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchPending();

    // Realtime subscription for pending_evidence changes
    const channel = supabase
      .channel('pending-evidence-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pending_evidence' },
        () => fetchPending()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPending]);

  const approve = useCallback(async (pendingId: string) => {
    setActing(pendingId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke('approve-evidence', {
        body: { action: 'approve', pending_id: pendingId },
      });

      if (error) console.error('Approve failed:', error);
      else setItems(prev => prev.filter(i => i.id !== pendingId));
    } finally {
      setActing(null);
    }
  }, []);

  const reject = useCallback(async (pendingId: string) => {
    setActing(pendingId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke('approve-evidence', {
        body: { action: 'reject', pending_id: pendingId },
      });

      if (error) console.error('Reject failed:', error);
      else setItems(prev => prev.filter(i => i.id !== pendingId));
    } finally {
      setActing(null);
    }
  }, []);

  return { items, loading, acting, approve, reject, refetch: fetchPending };
}
