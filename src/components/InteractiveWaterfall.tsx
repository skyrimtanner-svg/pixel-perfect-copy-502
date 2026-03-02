import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Clock, Users, Crosshair, ToggleLeft, ToggleRight, Beaker, Hash } from 'lucide-react';
import { glassInner, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { Contribution, EvidenceItem, WhatIfResult } from '@/hooks/useMilestoneAPI';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

const chromeGradientStyle = {
  background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 78%), hsl(220, 16%, 92%), hsl(220, 14%, 80%), hsl(220, 10%, 56%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

interface InteractiveWaterfallProps {
  prior: number;
  contributions: Contribution[];
  evidence: EvidenceItem[];
  milestoneId: string;
  onWhatIf: (milestoneId: string, excludeIds: string[]) => Promise<WhatIfResult | null>;
  whatIfResult: WhatIfResult | null;
  whatIfLoading: boolean;
  ledgerHash?: string;
}

function logOddsToProb(lo: number): number {
  return 1 / (1 + Math.exp(-lo));
}

export function InteractiveWaterfall({
  prior, contributions, evidence, milestoneId,
  onWhatIf, whatIfResult, whatIfLoading, ledgerHash,
}: InteractiveWaterfallProps) {
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [simMode, setSimMode] = useState(false);

  const toggleEvidence = useCallback((evidenceId: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(evidenceId)) next.delete(evidenceId);
      else next.add(evidenceId);
      return next;
    });
  }, []);

  // Auto-trigger whatif when exclusions change
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!simMode) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (excludedIds.size > 0) {
        onWhatIf(milestoneId, Array.from(excludedIds));
      }
    }, 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [excludedIds, simMode, milestoneId, onWhatIf]);

  // Use whatif contributions or original
  const activeContribs = whatIfResult?.update_result.contributions ?? contributions;
  const activePrior = whatIfResult?.update_result.prior ?? prior;
  const activePosterior = whatIfResult?.update_result.posterior ?? null;

  // Compute waterfall blocks
  const blocks = useMemo(() => {
    let cumLO = Math.log(activePrior / (1 - activePrior));
    return activeContribs.map(c => {
      const startLO = cumLO;
      const excluded = excludedIds.has(c.evidence_id);
      if (!excluded) cumLO += c.delta_log_odds;
      const endLO = cumLO;
      return {
        contribution: c,
        startLO, endLO,
        startProb: logOddsToProb(startLO),
        endProb: logOddsToProb(endLO),
        excluded,
        ev: evidence.find(e => e.id === c.evidence_id),
      };
    });
  }, [activeContribs, activePrior, excludedIds, evidence]);

  const finalPosterior = activePosterior ?? (blocks.length > 0 ? blocks[blocks.length - 1].endProb : prior);
  const maxAbsDelta = Math.max(...activeContribs.map(c => Math.abs(c.delta_log_odds)), 0.5);
  const posteriorDelta = finalPosterior - prior;
  const isDropping = whatIfResult && (whatIfResult.update_result.posterior < prior);

  if (contributions.length === 0) {
    return <p className="text-muted-foreground text-sm">Historical milestone — no Bayesian evidence trail.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Simulation header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Beaker className="w-3.5 h-3.5" style={{
            color: simMode ? 'hsl(192, 95%, 55%)' : 'hsl(220, 10%, 55%)',
            filter: simMode ? 'drop-shadow(0 0 8px hsla(192, 95%, 50%, 0.5))' : 'none',
            transition: 'all 0.3s',
          }} />
          <span className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold" style={{
            ...(simMode ? {
              background: 'linear-gradient(135deg, hsl(192, 90%, 45%), hsl(192, 95%, 65%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            } : chromeGradientStyle),
          }}>
            {simMode ? '⚡ SIMULATE REMOVING EVIDENCE' : 'EVIDENCE WATERFALL'}
          </span>
        </div>
        <button
          onClick={() => {
            setSimMode(!simMode);
            if (simMode) { setExcludedIds(new Set()); }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all duration-300 hover:scale-105"
          style={{
            ...glassInner,
            border: simMode ? '1px solid hsla(192, 95%, 50%, 0.3)' : '1px solid hsla(220, 12%, 70%, 0.12)',
            boxShadow: simMode ? '0 0 16px -4px hsla(192, 95%, 50%, 0.3)' : 'none',
          }}
        >
          {simMode ? <ToggleRight className="w-3 h-3" style={{ color: 'hsl(192, 95%, 55%)' }} /> : <ToggleLeft className="w-3 h-3" style={{ color: 'hsl(220, 10%, 55%)' }} />}
          <span style={simMode ? { color: 'hsl(192, 95%, 65%)' } : { color: 'hsl(220, 10%, 55%)' }}>
            {simMode ? 'EXIT SIM' : 'WHAT-IF'}
          </span>
        </button>
      </div>

      {/* Trust Ledger hash */}
      {ledgerHash && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{
          ...glassInner,
          border: '1px solid hsla(43, 96%, 56%, 0.12)',
        }}>
          <Hash className="w-2.5 h-2.5" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.4))' }} />
          <span className="text-[9px] font-mono text-muted-foreground">LEDGER</span>
          <span className="text-[9px] font-mono font-bold tabular-nums" style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
          }}>{ledgerHash.slice(0, 16)}…</span>
        </div>
      )}

      {/* Prior bar */}
      <div className="flex items-center gap-3 py-1.5">
        <div className="w-32 text-[10px] font-mono font-bold truncate uppercase tracking-wider" style={chromeGradientStyle}>Base Prior</div>
        <div className="flex-1 h-9 rounded-lg relative overflow-hidden" style={{
          background: 'rgba(8, 10, 28, 0.6)',
          border: '1px solid hsla(220, 10%, 72%, 0.1)',
          boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.04), inset 0 -1px 0 hsla(232, 30%, 2%, 0.3)',
        }}>
          <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
          <motion.div
            className="absolute left-0 top-0 h-full rounded-lg"
            style={{
              background: 'linear-gradient(90deg, hsla(220, 14%, 70%, 0.22), hsla(220, 14%, 80%, 0.1), hsla(220, 12%, 70%, 0.06))',
              boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.08)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${activePrior * 100}%` }}
            transition={{ duration: 0.6 }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs font-bold tabular-nums" style={chromeGradientStyle}>
            {(activePrior * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Evidence contribution blocks */}
      <AnimatePresence mode="popLayout">
        {blocks.map((block, i) => {
          const widthPct = Math.min(Math.abs(block.contribution.delta_log_odds) / maxAbsDelta * 60, 80);
          const meta = block.contribution.evidence_meta;
          const isSupport = meta.direction === 'supports';
          const isContradict = meta.direction === 'contradicts';
          const excluded = block.excluded;

          const barBg = excluded
            ? 'linear-gradient(90deg, hsla(220, 10%, 50%, 0.15), hsla(220, 10%, 50%, 0.05))'
            : isSupport
            ? 'linear-gradient(90deg, hsla(155, 82%, 38%, 0.6), hsla(155, 82%, 55%, 0.4), hsla(155, 82%, 65%, 0.2))'
            : isContradict
            ? 'linear-gradient(90deg, hsla(0, 72%, 40%, 0.6), hsla(0, 72%, 55%, 0.4), hsla(0, 72%, 65%, 0.2))'
            : 'linear-gradient(90deg, hsla(220, 10%, 50%, 0.4), hsla(220, 10%, 50%, 0.15))';

          const barGlow = excluded ? 'none' : isSupport
            ? '0 0 22px -4px hsla(155, 82%, 48%, 0.35), inset 0 1px 0 hsla(155, 82%, 70%, 0.18)'
            : isContradict
            ? '0 0 22px -4px hsla(0, 72%, 55%, 0.35), inset 0 1px 0 hsla(0, 72%, 70%, 0.18)'
            : 'none';

          return (
            <motion.div
              key={block.contribution.evidence_id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: excluded ? 0.4 : 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
              className="group"
            >
              <div className="flex items-center gap-3 py-1">
                {/* Toggle button (sim mode) */}
                {simMode && (
                  <button
                    onClick={() => toggleEvidence(block.contribution.evidence_id)}
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all duration-200"
                    style={{
                      background: excluded
                        ? 'hsla(0, 72%, 50%, 0.2)'
                        : 'hsla(155, 82%, 48%, 0.15)',
                      border: `1px solid ${excluded ? 'hsla(0, 72%, 55%, 0.3)' : 'hsla(155, 82%, 48%, 0.25)'}`,
                    }}
                  >
                    <span className="text-[8px] font-bold" style={{
                      color: excluded ? 'hsl(0, 72%, 60%)' : 'hsl(155, 82%, 55%)',
                    }}>
                      {excluded ? '✕' : '✓'}
                    </span>
                  </button>
                )}
                <div className={`${simMode ? 'w-24' : 'w-32'} text-[10px] text-muted-foreground truncate font-mono`} title={block.ev?.source}>
                  {block.ev?.source || block.contribution.evidence_id}
                </div>
                <div className="flex-1 h-9 rounded-lg relative overflow-hidden" style={{
                  background: 'rgba(8, 10, 28, 0.5)',
                  border: `1px solid ${excluded ? 'hsla(0, 72%, 55%, 0.1)' : 'hsla(220, 10%, 72%, 0.06)'}`,
                  boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.03)',
                }}>
                  <motion.div
                    className="absolute top-0 h-full rounded-lg"
                    style={{
                      left: isContradict ? `${50 - widthPct}%` : '50%',
                      background: barBg,
                      boxShadow: barGlow,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: excluded ? '0%' : `${widthPct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 h-full w-px" style={{ background: 'hsla(220, 10%, 72%, 0.08)' }} />
                  {/* Strikethrough for excluded */}
                  {excluded && (
                    <motion.div
                      className="absolute top-1/2 left-[10%] right-[10%] h-px"
                      style={{ background: 'hsla(0, 72%, 55%, 0.4)' }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>
                <div className={`w-20 text-right font-mono text-[10px] font-bold tabular-nums ${excluded ? 'line-through' : ''}`}
                  style={excluded ? { color: 'hsl(220, 10%, 40%)' } : isSupport ? {
                    background: 'linear-gradient(135deg, hsl(155, 70%, 40%), hsl(155, 82%, 58%))',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  } : isContradict ? {
                    background: 'linear-gradient(135deg, hsl(0, 60%, 42%), hsl(0, 72%, 62%))',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  } : { color: 'hsl(218, 15%, 46%)' }}
                >
                  {block.contribution.delta_log_odds > 0 ? '+' : ''}{block.contribution.delta_log_odds.toFixed(2)} LO
                </div>
              </div>

              {/* Hover detail — provenance badges */}
              <div className="hidden group-hover:block ml-[2rem] mb-2 rounded-xl p-3 text-xs space-y-1.5 relative overflow-hidden"
                style={{
                  ...glassInner,
                  backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
                  border: '1px solid hsla(43, 96%, 56%, 0.15)',
                  boxShadow: 'inset 0 1px 0 hsla(220, 14%, 88%, 0.08), inset 0 -1px 0 hsla(232, 30%, 2%, 0.4), 0 8px 24px -6px hsla(232, 30%, 2%, 0.8)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[35%] rounded-t-xl" style={specularReflection} />
                <div className="absolute top-0 left-4 right-4 h-px" style={goldChromeLine} />
                <p className="text-foreground relative z-10">{block.ev?.summary}</p>
                <div className="flex gap-2.5 font-mono text-[10px] text-muted-foreground relative z-10 flex-wrap">
                  <MetaBadge icon={<Shield className="w-2.5 h-2.5" />} label="Cred" value={meta.credibility.toFixed(2)} />
                  <MetaBadge icon={<Clock className="w-2.5 h-2.5" />} label="Decay" value={meta.decay.toFixed(2)} />
                  <MetaBadge icon={<Users className="w-2.5 h-2.5" />} label="Cons" value={meta.consensus.toFixed(2)} />
                  <MetaBadge icon={<Crosshair className="w-2.5 h-2.5" />} label="Match" value={meta.criteria_match.toFixed(2)} />
                  <span className="font-bold" style={{
                    ...goldGradientStyle, filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))',
                  }}>E={block.contribution.composite.toFixed(3)}</span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground relative z-10">
                  <span className="text-gold-num font-bold tabular-nums">{(block.startProb * 100).toFixed(1)}%</span>
                  <span className="mx-1" style={{ color: 'hsl(43, 82%, 55%)' }}>→</span>
                  <span className="text-gold-num font-bold tabular-nums">{(block.endProb * 100).toFixed(1)}%</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Posterior bar — dramatic */}
      <motion.div
        className="flex items-center gap-3 py-1.5 mt-2 pt-3"
        style={{ borderTop: '1px solid hsla(43, 96%, 56%, 0.15)' }}
        animate={whatIfResult ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.4 }}
      >
        <div className="w-32 text-[10px] font-mono font-bold uppercase tracking-wider" style={{
          ...(isDropping ? {
            background: 'linear-gradient(135deg, hsl(0, 60%, 40%), hsl(0, 72%, 60%), hsl(0, 60%, 48%))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          } : {
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))',
          }),
        }}>
          {whatIfResult ? 'SIM POSTERIOR' : 'Posterior'}
        </div>
        <div className="flex-1 h-9 rounded-lg relative overflow-hidden" style={{
          background: 'rgba(8, 10, 28, 0.6)',
          border: `1px solid ${isDropping ? 'hsla(0, 72%, 55%, 0.3)' : 'hsla(43, 96%, 56%, 0.22)'}`,
          boxShadow: isDropping
            ? '0 0 30px -6px hsla(0, 72%, 55%, 0.35), inset 0 1px 0 hsla(0, 72%, 70%, 0.08)'
            : 'inset 0 1px 0 hsla(43, 96%, 56%, 0.08), 0 0 20px -6px hsla(43, 96%, 56%, 0.12)',
          transition: 'all 0.5s',
        }}>
          <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
          <motion.div
            className="absolute left-0 top-0 h-full rounded-lg"
            style={{
              background: isDropping
                ? 'linear-gradient(90deg, hsla(0, 72%, 55%, 0.35), hsla(0, 72%, 65%, 0.2), hsla(0, 72%, 55%, 0.08))'
                : 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.35), hsla(48, 100%, 72%, 0.2), hsla(48, 100%, 67%, 0.08))',
              boxShadow: isDropping
                ? '0 0 32px -6px hsla(0, 72%, 55%, 0.4)'
                : '0 0 32px -6px hsla(43, 96%, 56%, 0.3), inset 0 1px 0 hsla(48, 100%, 80%, 0.12)',
            }}
            animate={{ width: `${finalPosterior * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs font-bold tabular-nums"
            style={isDropping ? {
              background: 'linear-gradient(135deg, hsl(0, 60%, 42%), hsl(0, 72%, 62%))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 0 6px hsla(0, 72%, 55%, 0.4))',
            } : {
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.3))',
            }}
            key={finalPosterior.toFixed(3)}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {(finalPosterior * 100).toFixed(1)}%
          </motion.span>
        </div>
      </motion.div>

      {/* WhatIf delta display */}
      {whatIfResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-3 py-2 rounded-xl"
          style={{
            ...glassInner,
            border: `1px solid ${isDropping ? 'hsla(0, 72%, 55%, 0.2)' : 'hsla(192, 95%, 50%, 0.2)'}`,
          }}
        >
          <span className="text-[10px] font-mono text-muted-foreground">
            {excludedIds.size} evidence excluded • {whatIfResult.remaining_evidence_count} remaining
          </span>
          <span className="font-mono text-xs font-bold tabular-nums" style={isDropping ? {
            color: 'hsl(0, 72%, 58%)',
            textShadow: '0 0 12px hsla(0, 72%, 55%, 0.5)',
          } : {
            color: 'hsl(155, 82%, 55%)',
            textShadow: '0 0 8px hsla(155, 82%, 48%, 0.3)',
          }}>
            Δ {posteriorDelta > 0 ? '+' : ''}{(posteriorDelta * 100).toFixed(1)}pp
          </span>
        </motion.div>
      )}

      {/* Loading indicator */}
      {whatIfLoading && (
        <motion.div
          className="h-0.5 rounded-full overflow-hidden"
          style={{ background: 'hsla(192, 95%, 50%, 0.1)' }}
        >
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(90deg, hsl(192, 95%, 50%), hsl(43, 96%, 56%))' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.div>
      )}
    </div>
  );
}

function MetaBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1">
      <span style={{
        background: 'linear-gradient(135deg, hsl(220, 10%, 55%), hsl(220, 14%, 82%))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>{icon}</span>
      <span>{label}:</span>
      <span className="font-bold tabular-nums" style={{
        ...goldGradientStyle,
        filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
      }}>{value}</span>
    </span>
  );
}
