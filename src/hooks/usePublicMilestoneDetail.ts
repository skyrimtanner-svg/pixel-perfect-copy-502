import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logOdds, fromLogOdds, computeContributions, runUpdate, type EvidenceInput } from '@/lib/bayesian';

export interface PublicEvidence {
  id: string;
  milestone_id: string;
  source: string;
  type: string;
  direction: 'supports' | 'contradicts' | 'ambiguous';
  credibility: number;
  recency: number;
  consensus: number;
  criteria_match: number;
  composite: number;
  delta_log_odds: number;
  date: string | null;
  summary: string | null;
}

export interface PublicLedgerEntry {
  id: string;
  snapshot_type: string;
  posterior: number;
  prior: number;
  delta_log_odds: number | null;
  sha256_hash: string;
  created_at: string;
}

export interface PublicLatentState {
  milestone_id: string;
  mu: number;
  sigma: number;
  updated_at: string;
}

export interface PublicMilestoneBundle {
  milestone: any;
  evidence: PublicEvidence[];
  latent: PublicLatentState | null;
  ledger: PublicLedgerEntry[];
  computed: {
    prior: number;
    posterior: number;
    delta_log_odds: number;
    contributions: { evidence_id: string; composite: number; delta_log_odds: number }[];
  };
}

export interface PublicError {
  table: string;
  message: string;
  hint: string;
}

export function usePublicMilestoneDetail(milestoneId: string | null) {
  const [bundle, setBundle] = useState<PublicMilestoneBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PublicError | null>(null);

  useEffect(() => {
    if (!milestoneId) { setBundle(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const m = await supabase.from('milestones').select('*').eq('id', milestoneId).maybeSingle();
      if (m.error) {
        if (!cancelled) setError({ table: 'milestones', message: m.error.message, hint: 'Verify public read RLS on milestones.' });
        if (!cancelled) setLoading(false);
        return;
      }
      if (!m.data) {
        if (!cancelled) { setError({ table: 'milestones', message: 'Milestone not found', hint: 'Check that the milestone id exists.' }); setLoading(false); }
        return;
      }

      const ev = await supabase.from('evidence').select('*').eq('milestone_id', milestoneId).order('created_at', { ascending: true });
      if (ev.error) {
        if (!cancelled) setError({ table: 'evidence', message: ev.error.message, hint: 'Verify public read RLS on evidence.' });
      }

      const latent = await supabase.from('latent_states').select('*').eq('milestone_id', milestoneId).maybeSingle();
      const ledger = await supabase.from('trust_ledger').select('id,snapshot_type,posterior,prior,delta_log_odds,sha256_hash,created_at')
        .eq('milestone_id', milestoneId).order('created_at', { ascending: false }).limit(8);

      const evidenceList = (ev.data ?? []) as PublicEvidence[];
      const prior = Number(m.data.prior ?? 0.5);
      const inputs: EvidenceInput[] = evidenceList.map(e => ({
        id: e.id,
        direction: e.direction,
        credibility: e.credibility,
        recency: e.recency,
        consensus: e.consensus,
        criteria_match: e.criteria_match,
      }));
      const upd = runUpdate(prior, inputs);

      if (cancelled) return;
      setBundle({
        milestone: m.data,
        evidence: evidenceList,
        latent: (latent.data ?? null) as PublicLatentState | null,
        ledger: (ledger.data ?? []) as PublicLedgerEntry[],
        computed: {
          prior,
          posterior: upd.posterior,
          delta_log_odds: upd.delta_log_odds,
          contributions: upd.contributions,
        },
      });
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [milestoneId]);

  /** Simulate what-if locally without writing to Supabase. */
  const simulate = useCallback((excludeIds: Set<string>) => {
    if (!bundle) return null;
    const remaining = bundle.evidence.filter(e => !excludeIds.has(e.id));
    const inputs: EvidenceInput[] = remaining.map(e => ({
      id: e.id, direction: e.direction, credibility: e.credibility, recency: e.recency,
      consensus: e.consensus, criteria_match: e.criteria_match,
    }));
    const upd = runUpdate(bundle.computed.prior, inputs);
    return {
      prior: bundle.computed.prior,
      posterior: upd.posterior,
      delta_log_odds: upd.delta_log_odds,
      excluded_count: excludeIds.size,
      remaining_count: remaining.length,
    };
  }, [bundle]);

  return { bundle, loading, error, simulate };
}

export { logOdds, fromLogOdds, computeContributions };
