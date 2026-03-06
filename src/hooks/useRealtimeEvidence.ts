import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

interface EvidencePulse {
  milestoneId: string;
  deltaLogOdds: number;
  composite: number;
  direction: 'supports' | 'contradicts' | 'ambiguous';
  timestamp: number;
}

interface ScoutSignal {
  count: number;
  lastRunMinAgo: number;
  details: string[];
}

const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;
const SIX_H = 6 * 60 * 60 * 1000;

export function useRealtimeEvidence(milestoneIds: string[]) {
  const [pulses, setPulses] = useState<Map<string, EvidencePulse>>(new Map());
  const [scoutSignal, setScoutSignal] = useState<ScoutSignal | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idSet = useMemo(() => new Set(milestoneIds), [milestoneIds]);

  // Initial fetch: recent evidence from last 24h
  useEffect(() => {
    if (milestoneIds.length === 0) return;
    const cutoff = new Date(Date.now() - TWENTY_FOUR_H).toISOString();

    supabase
      .from('evidence')
      .select('milestone_id, delta_log_odds, composite, direction, created_at')
      .gte('created_at', cutoff)
      .then(({ data }) => {
        if (!data) return;
        const map = new Map<string, EvidencePulse>();
        for (const e of data) {
          if (!idSet.has(e.milestone_id)) continue;
          const existing = map.get(e.milestone_id);
          const ts = new Date(e.created_at).getTime();
          if (!existing || ts > existing.timestamp) {
            map.set(e.milestone_id, {
              milestoneId: e.milestone_id,
              deltaLogOdds: e.delta_log_odds,
              composite: e.composite,
              direction: e.direction as EvidencePulse['direction'],
              timestamp: ts,
            });
          }
        }
        setPulses(map);
      });
  }, [milestoneIds, idSet]);

  // Initial fetch: scout logs from last 6h
  useEffect(() => {
    const cutoff = new Date(Date.now() - SIX_H).toISOString();
    supabase
      .from('scout_logs')
      .select('action, detail, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data || data.length === 0) { setScoutSignal(null); return; }
        const lastRun = new Date(data[0].created_at).getTime();
        const minAgo = Math.round((Date.now() - lastRun) / 60000);
        // Build summary details from scout log actions
        const details: string[] = [];
        const seen = new Set<string>();
        for (const log of data) {
          const d = log.detail as any;
          if (d?.milestone_id && d?.direction && !seen.has(d.milestone_id)) {
            seen.add(d.milestone_id);
            const arrow = d.direction === 'supports' ? '↑' : d.direction === 'contradicts' ? '↓' : '↔';
            details.push(`${arrow} ${d.milestone_title || d.milestone_id} (${d.source || ''})`);
          }
        }
        setScoutSignal({ count: data.length, lastRunMinAgo: minAgo, details });
      });
  }, []);

  // Realtime subscription with 300ms debounce
  useEffect(() => {
    const channel = supabase
      .channel('evidence-pulse')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'evidence' }, (payload: RealtimePostgresInsertPayload<Database['public']['Tables']['evidence']['Row']>) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          const e = payload.new;
          if (!idSet.has(e.milestone_id)) return;
          setPulses(prev => {
            const next = new Map(prev);
            next.set(e.milestone_id, {
              milestoneId: e.milestone_id,
              deltaLogOdds: e.delta_log_odds,
              composite: e.composite,
              direction: e.direction as EvidencePulse['direction'],
              timestamp: Date.now(),
            });
            return next;
          });
          setRefreshToken(t => t + 1);
        }, 300);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scout_logs' }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setScoutSignal(prev => ({
            count: (prev?.count || 0) + 1,
            lastRunMinAgo: 0,
            details: prev?.details || [],
          }));
          setRefreshToken(t => t + 1);
        }, 300);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pending_evidence' }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setRefreshToken(t => t + 1);
        }, 300);
      })
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };

  return { pulses, scoutSignal, refreshToken };
}
