import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Sparkles, FileSearch, GitMerge } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { glassInner, specularReflection } from '@/lib/glass-styles';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

interface LedgerEntry {
  id: string;
  snapshot_type: string;
  posterior: number;
  created_at: string;
  delta_log_odds: number | null;
}

interface DecisionProvenanceProps {
  milestoneId: string;
}

const SNAPSHOT_META: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Sparkles }> = {
  bulk_recalculate: {
    label: 'Bulk Recalculate',
    color: 'hsl(220, 14%, 88%)',
    bg: 'hsla(220, 14%, 60%, 0.12)',
    border: 'hsla(220, 14%, 70%, 0.3)',
    icon: GitMerge,
  },
  evidence_update: {
    label: 'Evidence Update',
    color: 'hsl(43, 96%, 60%)',
    bg: 'hsla(43, 96%, 56%, 0.12)',
    border: 'hsla(43, 96%, 56%, 0.3)',
    icon: FileSearch,
  },
  auto_commit: {
    label: 'Auto Commit',
    color: 'hsl(155, 82%, 60%)',
    bg: 'hsla(155, 82%, 50%, 0.12)',
    border: 'hsla(155, 82%, 50%, 0.3)',
    icon: Sparkles,
  },
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function DecisionProvenance({ milestoneId }: DecisionProvenanceProps) {
  const [entries, setEntries] = useState<LedgerEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('trust_ledger')
      .select('id, snapshot_type, posterior, created_at, delta_log_odds')
      .eq('milestone_id', milestoneId)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to load trust_ledger:', error);
          setEntries([]);
        } else {
          setEntries((data ?? []) as LedgerEntry[]);
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [milestoneId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl p-4 relative overflow-hidden"
      style={{
        ...glassInner,
        border: '1px solid hsla(220, 10%, 72%, 0.12)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl" style={specularReflection} />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <h4 className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold flex items-center gap-1.5" style={goldGradientStyle}>
          <History className="w-3 h-3" style={{ color: 'hsl(43, 96%, 56%)' }} />
          Decision Provenance
        </h4>
        <span className="text-[9px] font-mono text-muted-foreground">
          {entries?.length ?? 0} recent snapshot{(entries?.length ?? 0) === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2 relative z-10">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'hsla(220, 10%, 30%, 0.15)' }} />
          ))}
        </div>
      ) : entries && entries.length > 0 ? (
        <ul className="space-y-1.5 relative z-10">
          {entries.map((entry, idx) => {
            const meta = SNAPSHOT_META[entry.snapshot_type] ?? {
              label: entry.snapshot_type,
              color: 'hsl(220, 10%, 70%)',
              bg: 'hsla(220, 10%, 50%, 0.1)',
              border: 'hsla(220, 10%, 50%, 0.25)',
              icon: History,
            };
            const Icon = meta.icon;
            const delta = entry.delta_log_odds ?? 0;
            return (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.25 }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                style={{
                  background: 'rgba(8, 10, 28, 0.5)',
                  border: '1px solid hsla(220, 10%, 72%, 0.08)',
                }}
              >
                <Badge
                  variant="outline"
                  className="shrink-0 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider gap-1 border"
                  style={{
                    color: meta.color,
                    background: meta.bg,
                    borderColor: meta.border,
                  }}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {meta.label}
                </Badge>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
                    {formatRelative(entry.created_at)}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {delta !== 0 && (
                      <span
                        className="text-[9px] font-mono tabular-nums"
                        style={{ color: delta > 0 ? 'hsl(155, 82%, 55%)' : 'hsl(0, 72%, 60%)' }}
                      >
                        {delta > 0 ? '+' : ''}{delta.toFixed(2)} LO
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-bold tabular-nums" style={goldGradientStyle}>
                      {(entry.posterior * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[10px] font-mono text-muted-foreground italic px-1 py-2 relative z-10">
          No ledger snapshots recorded yet.
        </p>
      )}
    </motion.div>
  );
}
