import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useMode } from '@/contexts/ModeContext';
import { glassPanelStrong, glassInner, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { ChevronDown, ChevronRight, Layers, Loader2 } from 'lucide-react';
import { logOdds, fromLogOdds } from '@/lib/bayesian';

interface TrustLedgerEntry {
  id: string;
  milestone_id: string;
  prior: number;
  posterior: number;
  prior_log_odds: number | null;
  posterior_log_odds: number | null;
  delta_log_odds: number | null;
  evidence_id: string | null;
  snapshot_type: string;
  contributions: any[] | null;
  propagation: any[] | null;
  full_state: any;
  created_at: string;
  sha256_hash: string;
  prev_hash: string | null;
}

interface ReplayStep {
  label: string;
  value: string;
  color: string;
  detail?: string;
}

function buildReplaySteps(entry: TrustLedgerEntry): ReplayStep[] {
  const steps: ReplayStep[] = [];

  // Step 1: Prior
  steps.push({
    label: 'Prior',
    value: `${(entry.prior * 100).toFixed(1)}%`,
    color: 'hsl(218, 15%, 68%)',
    detail: entry.prior_log_odds != null ? `LO: ${entry.prior_log_odds.toFixed(3)}` : undefined,
  });

  // Step 2: Evidence contributions
  const contribs = entry.contributions || [];
  if (contribs.length > 0) {
    for (const c of contribs) {
      const dir = (c as any).direction || 'ambiguous';
      const dirColor = dir === 'supports' ? 'hsl(43, 96%, 56%)' : dir === 'contradicts' ? 'hsl(0, 72%, 58%)' : 'hsl(218, 15%, 68%)';
      steps.push({
        label: `Evidence: ${(c as any).source || 'unknown'}`,
        value: `Δ ${((c as any).delta_log_odds || 0) >= 0 ? '+' : ''}${((c as any).delta_log_odds || 0).toFixed(3)} LO`,
        color: dirColor,
        detail: `cred: ${((c as any).credibility || 0).toFixed(2)} · rec: ${((c as any).recency || 0).toFixed(2)} · cons: ${((c as any).consensus || 0).toFixed(2)}`,
      });
    }
  } else if (entry.delta_log_odds != null) {
    steps.push({
      label: 'Δ Log-Odds',
      value: `${entry.delta_log_odds >= 0 ? '+' : ''}${entry.delta_log_odds.toFixed(3)}`,
      color: entry.delta_log_odds >= 0 ? 'hsl(43, 96%, 56%)' : 'hsl(0, 72%, 58%)',
    });
  }

  // Step 3: Propagation
  const props = entry.propagation || [];
  if (props.length > 0) {
    for (const p of props) {
      steps.push({
        label: `Coupling → ${(p as any).target || 'unknown'}`,
        value: `Δ ${((p as any).delta || 0).toFixed(4)} LO`,
        color: 'hsl(268, 90%, 68%)',
        detail: `α = ${((p as any).alpha || 0.07).toFixed(3)}`,
      });
    }
  }

  // Step 4: Posterior
  steps.push({
    label: 'Posterior',
    value: `${(entry.posterior * 100).toFixed(1)}%`,
    color: 'hsl(43, 96%, 56%)',
    detail: entry.posterior_log_odds != null ? `LO: ${entry.posterior_log_odds.toFixed(3)}` : undefined,
  });

  return steps;
}

function TraceReplayRow({ entry }: { entry: TrustLedgerEntry }) {
  const [expanded, setExpanded] = useState(false);
  const steps = useMemo(() => buildReplaySteps(entry), [entry]);
  const delta = entry.delta_log_odds ?? (entry.posterior - entry.prior);
  const isPositive = delta >= 0;

  return (
    <div className="rounded-lg overflow-hidden" style={{
      ...glassInner,
      borderColor: 'hsla(220, 12%, 70%, 0.08)',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-3 py-2 flex items-center gap-3 text-left group"
      >
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </motion.div>
        <span className="text-[9px] font-mono text-muted-foreground truncate max-w-[180px]">
          {entry.milestone_id}
        </span>
        <span className="text-[9px] font-mono tabular-nums" style={{
          color: isPositive ? 'hsl(43, 96%, 56%)' : 'hsl(0, 72%, 58%)',
        }}>
          {(entry.prior * 100).toFixed(0)}% → {(entry.posterior * 100).toFixed(0)}%
        </span>
        <span className="text-[9px] font-mono tabular-nums" style={{
          color: isPositive ? 'hsl(43, 96%, 56%)' : 'hsl(0, 72%, 58%)',
        }}>
          ({isPositive ? '+' : ''}{(delta * 100).toFixed(1)}pp)
        </span>
        <span className="text-[8px] font-mono text-muted-foreground/50 ml-auto">
          {entry.snapshot_type}
        </span>
        <span className="text-[8px] font-mono text-muted-foreground/40">
          {new Date(entry.created_at).toLocaleDateString()}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1">
              {/* Step-by-step replay pipeline */}
              <div className="flex items-start gap-0 relative">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center">
                    {/* Step node */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.08, type: 'spring', stiffness: 500, damping: 30 }}
                      className="flex flex-col items-center min-w-[72px] max-w-[100px]"
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-mono font-bold mb-1"
                        style={{
                          background: `${step.color.replace('hsl', 'hsla').replace(')', ', 0.12)')}`,
                          border: `1px solid ${step.color.replace('hsl', 'hsla').replace(')', ', 0.3)')}`,
                          color: step.color,
                          boxShadow: `0 0 8px ${step.color.replace('hsl', 'hsla').replace(')', ', 0.2)')}`,
                        }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[8px] font-mono text-center leading-tight truncate w-full" style={{ color: step.color }}>
                        {step.label}
                      </span>
                      <span className="text-[10px] font-mono font-bold tabular-nums mt-0.5" style={{ color: step.color }}>
                        {step.value}
                      </span>
                      {step.detail && (
                        <span className="text-[7px] font-mono text-muted-foreground/60 text-center mt-0.5">
                          {step.detail}
                        </span>
                      )}
                    </motion.div>

                    {/* Connector arrow */}
                    {i < steps.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.08 + 0.04 }}
                        className="h-px w-4 shrink-0 mt-3"
                        style={{
                          background: `linear-gradient(90deg, ${step.color.replace('hsl', 'hsla').replace(')', ', 0.4)')}, ${steps[i + 1].color.replace('hsl', 'hsla').replace(')', ', 0.4)')})`,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Hash chain */}
              <div className="flex items-center gap-2 mt-3 pt-2" style={{ borderTop: '1px solid hsla(220, 12%, 70%, 0.06)' }}>
                <span className="text-[7px] font-mono text-muted-foreground/40">
                  SHA256: {entry.sha256_hash.slice(0, 16)}…
                </span>
                {entry.prev_hash && (
                  <span className="text-[7px] font-mono text-muted-foreground/30">
                    ← {entry.prev_hash.slice(0, 12)}…
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TraceReplayPanel() {
  const [entries, setEntries] = useState<TrustLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('trust_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) setEntries(data as TrustLedgerEntry[]);
      setLoading(false);
    }
    load();
  }, []);

  if (!loading && entries.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6 rounded-xl overflow-hidden relative"
      style={glassPanelStrong}
    >
      <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
      <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl pointer-events-none" style={specularReflection} />

      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left relative z-10"
      >
        <Layers className="w-4 h-4" style={{
          color: 'hsl(43, 96%, 56%)',
          filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.4))',
        }} />
        <div className="flex-1">
          <span className="text-xs font-mono font-semibold" style={{
            background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%))',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            TRACE REPLAY
          </span>
          <span className="text-[10px] font-mono text-muted-foreground ml-2">
            {loading ? 'loading…' : `${entries.length} ledger entries`}
          </span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                entries.map(entry => (
                  <TraceReplayRow key={entry.id} entry={entry} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
