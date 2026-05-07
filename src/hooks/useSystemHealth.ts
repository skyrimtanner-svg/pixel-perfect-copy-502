import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SystemHealth {
  supabaseStatus: 'ok' | 'error' | 'checking';
  supabaseError?: string;
  authState: 'anonymous' | 'demo' | 'authenticated';
  milestoneCount: number | null;
  evidenceCount: number | null;
  pendingEvidenceCount: number | 'admin-only' | null;
  latestLedgerAt: string | null;
  latestLedgerHash: string | null;
  latestScoutAt: string | 'admin-only' | null;
  buildMode: string;
  demoMode: boolean;
}

export function useSystemHealth(): SystemHealth {
  const { user } = useAuth();
  const [state, setState] = useState<SystemHealth>({
    supabaseStatus: 'checking',
    authState: user ? 'authenticated' : 'demo',
    milestoneCount: null,
    evidenceCount: null,
    pendingEvidenceCount: null,
    latestLedgerAt: null,
    latestLedgerHash: null,
    latestScoutAt: null,
    buildMode: import.meta.env.MODE,
    demoMode: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, e, l] = await Promise.all([
          supabase.from('milestones').select('id', { count: 'exact', head: true }),
          supabase.from('evidence').select('id', { count: 'exact', head: true }),
          supabase.from('trust_ledger').select('created_at,sha256_hash').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (cancelled) return;
        const errorMsg = m.error?.message || e.error?.message || l.error?.message;

        let pending: number | 'admin-only' = 'admin-only';
        let scoutAt: string | 'admin-only' = 'admin-only';
        if (user) {
          const p = await supabase.from('pending_evidence').select('id', { count: 'exact', head: true });
          if (!p.error && p.count !== null) pending = p.count;
          const s = await supabase.from('scout_logs').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (!s.error && s.data?.created_at) scoutAt = s.data.created_at;
        }

        setState(s => ({
          ...s,
          supabaseStatus: errorMsg ? 'error' : 'ok',
          supabaseError: errorMsg,
          authState: user ? 'authenticated' : 'demo',
          milestoneCount: m.count ?? null,
          evidenceCount: e.count ?? null,
          pendingEvidenceCount: pending,
          latestLedgerAt: l.data?.created_at ?? null,
          latestLedgerHash: l.data?.sha256_hash ?? null,
          latestScoutAt: scoutAt,
        }));
      } catch (err: any) {
        if (cancelled) return;
        setState(s => ({ ...s, supabaseStatus: 'error', supabaseError: err.message }));
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return state;
}
