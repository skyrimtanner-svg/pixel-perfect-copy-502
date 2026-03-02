import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Clock, Users, Crosshair, Beaker, Hash, ExternalLink, Sparkles, RotateCcw } from 'lucide-react';
import { glassInner, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { Contribution, EvidenceItem, WhatIfResult } from '@/hooks/useMilestoneAPI';
import { useMode } from '@/contexts/ModeContext';
import { EvidenceToggle } from '@/components/EvidenceToggle';
import { toast } from '@/hooks/use-toast';

/* ═══ SPEC COLORS ═══ */
const COLORS = {
  supports: 'hsl(123, 38%, 57%)',
  contradicts: 'hsl(4, 82%, 63%)',
  ambiguous: 'hsl(220, 10%, 45%)',
  supportsBg: 'hsla(123, 38%, 57%, 0.55)',
  contradictsBg: 'hsla(4, 82%, 63%, 0.55)',
  ambiguousBg: 'hsla(220, 10%, 45%, 0.35)',
  supportsGlow: '0 0 22px -4px hsla(123, 38%, 57%, 0.4), inset 0 1px 0 hsla(123, 50%, 70%, 0.18)',
  contradictsGlow: '0 0 22px -4px hsla(4, 82%, 63%, 0.4), inset 0 1px 0 hsla(4, 82%, 75%, 0.18)',
};

const TIER_COLORS: Record<string, string> = {
  historical: 'hsl(220, 10%, 55%)',
  active: 'hsl(192, 95%, 55%)',
  plausible: 'hsl(43, 96%, 56%)',
  speculative: 'hsl(270, 90%, 68%)',
};

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const, backgroundClip: 'text' as const,
};

const chromeGradientStyle = {
  background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 78%), hsl(220, 16%, 92%), hsl(220, 14%, 80%), hsl(220, 10%, 56%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const, backgroundClip: 'text' as const,
};

interface InteractiveWaterfallProps {
  prior: number;
  contributions: Contribution[];
  evidence: EvidenceItem[];
  milestoneId: string;
  tier?: string;
  onWhatIf: (milestoneId: string, excludeIds: string[]) => Promise<WhatIfResult | null>;
  whatIfResult: WhatIfResult | null;
  whatIfLoading: boolean;
  ledgerHash?: string;
  onNegativeShift?: (isNegative: boolean, posterior: number) => void;
  onEvidenceClick?: (evidenceId: string) => void;
}

function logOddsToProb(lo: number): number {
  return 1 / (1 + Math.exp(-lo));
}

async function generateSnapshotHash(data: object): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(data)));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function shorten(s: string, maxLen = 28): string {
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
}

export function InteractiveWaterfall({
  prior, contributions, evidence, milestoneId, tier = 'active',
  onWhatIf, whatIfResult, whatIfLoading, ledgerHash: externalHash,
  onNegativeShift, onEvidenceClick,
}: InteractiveWaterfallProps) {
  const { isWonder } = useMode();
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [snapshotHash, setSnapshotHash] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [particleBurst, setParticleBurst] = useState<string | null>(null);
  const prevPosteriorRef = useRef<number | null>(null);

  const isSimActive = excludedIds.size > 0;

  const toggleEvidence = useCallback((evidenceId: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      const wasExcluded = next.has(evidenceId);
      if (wasExcluded) next.delete(evidenceId); else next.add(evidenceId);
      // Trigger particle burst in Wonder mode when excluding
      if (!wasExcluded && isWonder) {
        setParticleBurst(evidenceId);
        setTimeout(() => setParticleBurst(null), 800);
      }
      return next;
    });
  }, [isWonder]);

  const resetToCanonical = useCallback(() => {
    setExcludedIds(new Set());
    setSnapshotHash(null);
    setShowReceipt(false);
  }, []);

  // Auto-trigger whatif when excludedIds change
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (excludedIds.size > 0) {
      debounceRef.current = setTimeout(() => {
        onWhatIf(milestoneId, Array.from(excludedIds));
      }, 150);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [excludedIds, milestoneId, onWhatIf]);

  // Generate snapshot hash (sandbox only — no Trust Ledger snapshot)
  useEffect(() => {
    if (whatIfResult) {
      generateSnapshotHash({
        milestone_id: milestoneId, timestamp: new Date().toISOString(),
        prior: whatIfResult.update_result.prior, posterior: whatIfResult.update_result.posterior,
        excluded: Array.from(excludedIds), delta_log_odds: whatIfResult.update_result.delta_log_odds,
      }).then(setSnapshotHash);
    } else { setSnapshotHash(null); }
  }, [whatIfResult, milestoneId, excludedIds]);

  // Wonder mode toast on significant shift
  useEffect(() => {
    if (!whatIfResult || !isWonder) return;
    const newPosterior = whatIfResult.update_result.posterior;
    const prevP = prevPosteriorRef.current;
    if (prevP !== null && Math.abs(newPosterior - prevP) > 0.08) {
      const delta = newPosterior - prevP;
      toast({
        title: delta < 0 ? "🌊 Whoa!" : "🚀 Boom!",
        description: delta < 0
          ? `Removing that evidence changed everything! Probability dropped ${Math.abs(delta * 100).toFixed(0)}pp!`
          : `Adding it back boosted probability by ${Math.abs(delta * 100).toFixed(0)}pp!`,
      });
    }
    prevPosteriorRef.current = newPosterior;
  }, [whatIfResult, isWonder]);

  // Reset prevPosterior when no whatif
  useEffect(() => {
    if (!whatIfResult) prevPosteriorRef.current = null;
  }, [whatIfResult]);

  const activeContribs = whatIfResult?.update_result.contributions ?? contributions;
  const activePrior = whatIfResult?.update_result.prior ?? prior;
  const activePosterior = whatIfResult?.update_result.posterior ?? null;

  const sortedContribs = useMemo(() =>
    [...activeContribs].sort((a, b) => Math.abs(b.delta_log_odds) - Math.abs(a.delta_log_odds)),
    [activeContribs]
  );

  const blocks = useMemo(() => {
    let cumLO = Math.log(activePrior / (1 - activePrior));
    return sortedContribs.map(c => {
      const startLO = cumLO;
      const excluded = excludedIds.has(c.evidence_id);
      if (!excluded) cumLO += c.delta_log_odds;
      return {
        contribution: c,
        startLO, endLO: cumLO,
        startProb: logOddsToProb(startLO),
        endProb: logOddsToProb(cumLO),
        excluded,
        ev: evidence.find(e => e.id === c.evidence_id),
      };
    });
  }, [sortedContribs, activePrior, excludedIds, evidence]);

  const finalPosterior = activePosterior ?? (blocks.length > 0 ? blocks[blocks.length - 1].endProb : prior);
  const maxAbsDelta = Math.max(...sortedContribs.map(c => Math.abs(c.delta_log_odds)), 0.5);
  const posteriorDelta = finalPosterior - prior;
  const isDropping = whatIfResult && (whatIfResult.update_result.posterior < prior);

  useEffect(() => { onNegativeShift?.(!!isDropping, finalPosterior); }, [isDropping, finalPosterior, onNegativeShift]);

  const displayHash = externalHash || snapshotHash;
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.active;

  if (contributions.length === 0) {
    return <p className="text-muted-foreground text-sm">Historical milestone — no Bayesian evidence trail.</p>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2 rounded-xl p-4 relative overflow-hidden" style={{
        ...glassInner,
        border: `1px solid ${isSimActive ? 'hsla(192, 95%, 50%, 0.2)' : 'hsla(220, 12%, 70%, 0.1)'}`,
        boxShadow: '0 0 40px -12px hsla(260, 40%, 20%, 0.15), inset 0 1px 0 hsla(220, 16%, 95%, 0.05)',
      }}>
        <div className="absolute top-0 left-0 right-0 h-[25%] rounded-t-xl pointer-events-none" style={specularReflection} />

        {/* ═══ SCENARIO DOTTED OVERLAY (spec 4.3) ═══ */}
        <AnimatePresence>
          {isSimActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 pointer-events-none z-0 rounded-xl"
              style={{
                backgroundImage: 'radial-gradient(circle, hsla(192, 95%, 55%, 0.06) 1px, transparent 1px)',
                backgroundSize: '8px 8px',
                border: '2px dashed hsla(192, 95%, 55%, 0.2)',
                borderRadius: 'inherit',
              }}
            />
          )}
        </AnimatePresence>

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between mb-1 relative z-10">
          <div className="flex items-center gap-2">
            <Beaker className="w-3.5 h-3.5" style={{
              color: isSimActive ? 'hsl(192, 95%, 55%)' : 'hsl(220, 10%, 55%)',
              filter: isSimActive ? 'drop-shadow(0 0 8px hsla(192, 95%, 50%, 0.5))' : 'none',
              transition: 'all 0.3s',
            }} />
            <span className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold" style={
              isSimActive ? {
                background: 'linear-gradient(135deg, hsl(192, 90%, 45%), hsl(192, 95%, 65%))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              } : chromeGradientStyle
            }>
              {isSimActive ? '⚡ SCENARIO MODE' : 'EVIDENCE WATERFALL'}
            </span>
            {/* SCENARIO badge */}
            <AnimatePresence>
              {isSimActive && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
                  style={{
                    background: 'hsla(192, 95%, 55%, 0.1)',
                    border: '1px dashed hsla(192, 95%, 55%, 0.3)',
                    color: 'hsl(192, 95%, 65%)',
                  }}
                >
                  SANDBOX
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {/* Reset to Canonical button */}
          <AnimatePresence>
            {isSimActive && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={resetToCanonical}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all duration-300 hover:scale-105"
                style={{
                  ...glassInner,
                  border: '1px solid hsla(43, 96%, 56%, 0.25)',
                  boxShadow: '0 0 12px -4px hsla(43, 96%, 56%, 0.2)',
                }}
              >
                <RotateCcw className="w-3 h-3" style={{ color: 'hsl(43, 96%, 56%)' }} />
                <span style={{ color: 'hsl(43, 82%, 60%)' }}>Reset to Canonical</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ TRUST LEDGER HASH (sandbox — no real snapshot) ═══ */}
        <AnimatePresence>
          {displayHash && isSimActive && (
            <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -6, height: 0 }} className="overflow-hidden relative z-10">
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg" style={{
                ...glassInner, border: '1px solid hsla(43, 96%, 56%, 0.15)',
                boxShadow: 'inset 0 1px 0 hsla(48, 100%, 80%, 0.06), 0 0 16px -6px hsla(43, 96%, 56%, 0.15)',
              }}>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-2.5 h-2.5" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.4))' }} />
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">SCENARIO HASH</span>
                  <span className="text-[9px] font-mono font-bold tabular-nums" style={{ ...goldGradientStyle, filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))' }}>{displayHash.slice(0, 16)}…</span>
                </div>
                <button onClick={() => setShowReceipt(!showReceipt)} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all hover:scale-105" style={{
                  background: 'hsla(43, 96%, 56%, 0.08)', border: '1px solid hsla(43, 96%, 56%, 0.2)', color: 'hsl(43, 82%, 60%)',
                }}>
                  <ExternalLink className="w-2.5 h-2.5" />{showReceipt ? 'HIDE' : 'VIEW RECEIPT'}
                </button>
              </div>
              <AnimatePresence>
                {showReceipt && whatIfResult && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-1.5 rounded-lg p-3 space-y-1 overflow-hidden" style={{ ...glassInner, border: '1px solid hsla(43, 96%, 56%, 0.12)' }}>
                    <div className="text-[9px] font-mono text-muted-foreground space-y-1">
                      <div>SHA-256: <span className="font-bold tabular-nums break-all" style={goldGradientStyle}>{displayHash}</span></div>
                      <div>Prior: <span className="font-bold tabular-nums" style={goldGradientStyle}>{(whatIfResult.update_result.prior * 100).toFixed(2)}%</span></div>
                      <div>Posterior: <span className="font-bold tabular-nums" style={isDropping ? { color: 'hsl(4, 82%, 63%)', textShadow: '0 0 8px hsla(4, 82%, 63%, 0.4)' } : goldGradientStyle}>{(whatIfResult.update_result.posterior * 100).toFixed(2)}%</span></div>
                      <div>Excluded: <span className="font-bold" style={goldGradientStyle}>{excludedIds.size} evidence items</span></div>
                      <div>Δ Log-Odds: <span className="font-bold tabular-nums" style={isDropping ? { color: 'hsl(4, 82%, 63%)' } : goldGradientStyle}>{whatIfResult.update_result.delta_log_odds.toFixed(4)}</span></div>
                      <div className="text-[8px] italic text-muted-foreground pt-1" style={{ opacity: 0.6 }}>⚠ Sandbox only — not committed to Trust Ledger</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ 1. PRIOR BAR — tier-colored ═══ */}
        <div className="flex items-center gap-3 py-1.5 relative z-10">
          <div className="w-28 text-[10px] font-mono font-bold truncate uppercase tracking-wider" style={{ color: tierColor }}>
            Prior <span className="text-[8px] opacity-70">({tier})</span>
          </div>
          <div className="flex-1 h-8 rounded-lg relative overflow-hidden" style={{
            background: 'rgba(8, 10, 28, 0.6)', border: '1px solid hsla(220, 10%, 72%, 0.1)',
            boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.04)',
          }}>
            <motion.div
              className="absolute left-0 top-0 h-full rounded-lg"
              style={{
                background: `linear-gradient(90deg, ${tierColor}44, ${tierColor}22, ${tierColor}0a)`,
                boxShadow: `inset 0 1px 0 ${tierColor}22`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${activePrior * 100}%` }}
              transition={{ duration: 0.6 }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs font-bold tabular-nums" style={{ color: tierColor, textShadow: `0 0 8px ${tierColor}44` }}>
              {(activePrior * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* ═══ 2. EVIDENCE BLOCKS with iOS toggles ═══ */}
        <AnimatePresence mode="popLayout">
          {blocks.map((block, i) => {
            const meta = block.contribution.evidence_meta;
            const isSupport = meta.direction === 'supports';
            const isContradict = meta.direction === 'contradicts';
            const excluded = block.excluded;
            const widthPct = Math.min((Math.abs(block.contribution.delta_log_odds) / maxAbsDelta) * 65, 85);
            const isHovered = hoveredId === block.contribution.evidence_id;
            const isBursting = particleBurst === block.contribution.evidence_id;

            const barColor = excluded ? 'hsla(220, 10%, 50%, 0.15)'
              : isSupport ? COLORS.supportsBg
              : isContradict ? COLORS.contradictsBg
              : COLORS.ambiguousBg;

            const barGlow = excluded ? 'none'
              : isSupport ? COLORS.supportsGlow
              : isContradict ? COLORS.contradictsGlow
              : 'none';

            const dirArrow = isSupport ? '↑' : isContradict ? '↓' : '~';
            const deltaStr = `${block.contribution.delta_log_odds > 0 ? '+' : ''}${block.contribution.delta_log_odds.toFixed(2)}`;
            const evTitle = shorten(block.ev?.source || block.contribution.evidence_id);

            const tooltipText = isWonder
              ? isSupport
                ? `This green magnet pulled confidence up by ${Math.abs(block.contribution.delta_log_odds * 100 / 2.3).toFixed(0)}% — like a rocket boost! 🚀`
                : isContradict
                ? `This red anchor dragged confidence down by ${Math.abs(block.contribution.delta_log_odds * 100 / 2.3).toFixed(0)}% — a reality check! ⚓`
                : `This one's a mystery — could go either way! 🤷`
              : `LR ${block.contribution.composite.toFixed(2)} • ${deltaStr} log-odds • ${(block.ev?.type || '').replace('_', ' ')} source`;

            return (
              <Tooltip key={block.contribution.evidence_id}>
                <TooltipTrigger asChild>
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: excluded ? 0.35 : 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: 0.03 + i * 0.03, duration: 0.3 }}
                    className="group relative cursor-pointer z-10"
                    onClick={() => onEvidenceClick?.(block.contribution.evidence_id)}
                    onMouseEnter={() => setHoveredId(block.contribution.evidence_id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="flex items-center gap-2 py-0.5">
                      {/* iOS-style glowing toggle */}
                      <EvidenceToggle
                        enabled={!excluded}
                        onToggle={() => toggleEvidence(block.contribution.evidence_id)}
                        direction={meta.direction as 'supports' | 'contradicts' | 'ambiguous'}
                      />

                      {/* Evidence label */}
                      <div className="w-24 text-[9px] text-muted-foreground truncate font-mono leading-tight" title={block.ev?.source}>
                        <span className="block truncate">{evTitle}</span>
                        <span className="block font-bold tabular-nums" style={{
                          color: excluded ? 'hsl(220, 10%, 40%)'
                            : isSupport ? COLORS.supports
                            : isContradict ? COLORS.contradicts
                            : COLORS.ambiguous,
                        }}>
                          {dirArrow} {deltaStr} LO
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="flex-1 h-7 rounded-md relative overflow-hidden" style={{
                        background: 'rgba(8, 10, 28, 0.5)',
                        border: `1px solid ${excluded ? 'hsla(4, 82%, 63%, 0.08)' : 'hsla(220, 10%, 72%, 0.06)'}`,
                      }}>
                        <motion.div
                          className="absolute top-0 h-full rounded-md"
                          style={{
                            left: isContradict ? `${50 - widthPct}%` : '50%',
                            background: `linear-gradient(90deg, ${barColor}, ${barColor.replace(/[\d.]+\)$/, '0.15)')})`,
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
                          <motion.div className="absolute top-1/2 left-[10%] right-[10%] h-px"
                            style={{ background: 'hsla(4, 82%, 63%, 0.4)' }}
                            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3 }}
                          />
                        )}
                      </div>

                      {/* Analyst mode: inline log-odds delta */}
                      {!isWonder && (
                        <span className="hidden sm:inline text-[9px] font-mono font-bold tabular-nums shrink-0" style={{
                          color: excluded ? 'hsl(220, 10%, 40%)'
                            : isSupport ? COLORS.supports : isContradict ? COLORS.contradicts : COLORS.ambiguous,
                          fontFamily: "'Space Mono', monospace",
                        }}>
                          {deltaStr}
                        </span>
                      )}

                      {/* Provenance micro-badges */}
                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                        <MicroBadge value={meta.credibility} color={COLORS.supports} />
                        <MicroBadge value={meta.consensus} color="hsl(43, 96%, 56%)" />
                      </div>
                    </div>

                    {/* Wonder mode particle burst on toggle-off */}
                    {isBursting && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(10)].map((_, si) => (
                          <motion.div
                            key={`burst-${si}`}
                            className="absolute rounded-full"
                            style={{
                              width: 3 + Math.random() * 4,
                              height: 3 + Math.random() * 4,
                              background: `radial-gradient(circle, hsla(192, 95%, 65%, ${0.6 + Math.random() * 0.3}), transparent)`,
                              left: `${20 + Math.random() * 60}%`,
                              top: `${20 + Math.random() * 60}%`,
                              boxShadow: '0 0 8px hsla(192, 95%, 55%, 0.5)',
                            }}
                            initial={{ scale: 1, opacity: 0.9 }}
                            animate={{
                              x: (Math.random() - 0.5) * 60,
                              y: (Math.random() - 0.5) * 40,
                              scale: 0,
                              opacity: 0,
                            }}
                            transition={{ duration: 0.5 + Math.random() * 0.3, ease: 'easeOut', delay: si * 0.03 }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Wonder mode sparkle particles on hover */}
                    {isWonder && isHovered && !excluded && !isBursting && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(6)].map((_, si) => (
                          <motion.div
                            key={`sparkle-${si}`}
                            className="absolute rounded-full"
                            style={{
                              width: 2 + Math.random() * 3,
                              height: 2 + Math.random() * 3,
                              background: isSupport
                                ? `radial-gradient(circle, hsla(123, 50%, 65%, ${0.5 + Math.random() * 0.4}), transparent)`
                                : isContradict
                                ? `radial-gradient(circle, hsla(4, 82%, 70%, ${0.4 + Math.random() * 0.3}), transparent)`
                                : `radial-gradient(circle, hsla(43, 96%, 70%, ${0.4 + Math.random() * 0.3}), transparent)`,
                              left: `${10 + Math.random() * 80}%`,
                              top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                              y: [0, -10 - Math.random() * 15],
                              opacity: [0.8, 0],
                              scale: [1, 0.3],
                            }}
                            transition={{ duration: 0.6 + Math.random() * 0.5, ease: 'easeOut', delay: si * 0.06 }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs p-3 space-y-2 rounded-xl text-xs"
                  style={{
                    ...glassInner,
                    backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
                    border: '1px solid hsla(43, 96%, 56%, 0.15)',
                    boxShadow: 'inset 0 1px 0 hsla(220, 14%, 88%, 0.08), 0 8px 24px -6px hsla(232, 30%, 2%, 0.8)',
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[35%] rounded-t-xl pointer-events-none" style={specularReflection} />
                  <div className="absolute top-0 left-4 right-4 h-px" style={goldChromeLine} />
                  <p className="font-medium text-foreground relative z-10">{block.ev?.source || block.contribution.evidence_id}</p>
                  <p className="text-muted-foreground relative z-10">{block.ev?.summary}</p>
                  <p className="relative z-10" style={{
                    color: isWonder
                      ? isSupport ? 'hsl(123, 50%, 65%)' : isContradict ? 'hsl(4, 82%, 70%)' : 'hsl(43, 96%, 65%)'
                      : 'hsl(220, 12%, 70%)',
                    fontFamily: isWonder ? undefined : "'Space Mono', monospace",
                  }}>
                    {isWonder && <Sparkles className="w-3 h-3 inline mr-1" />}
                    {tooltipText}
                  </p>
                  <div className="flex gap-2 flex-wrap font-mono text-[10px] text-muted-foreground relative z-10">
                    <MetaBadge icon={<Shield className="w-2.5 h-2.5" />} label="Cred" value={meta.credibility.toFixed(2)} />
                    <MetaBadge icon={<Clock className="w-2.5 h-2.5" />} label="Decay" value={meta.decay.toFixed(2)} />
                    <MetaBadge icon={<Users className="w-2.5 h-2.5" />} label="Cons" value={meta.consensus.toFixed(2)} />
                    <MetaBadge icon={<Crosshair className="w-2.5 h-2.5" />} label="Match" value={meta.criteria_match.toFixed(2)} />
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground relative z-10">
                    <span className="font-bold tabular-nums" style={goldGradientStyle}>{(block.startProb * 100).toFixed(1)}%</span>
                    <span className="mx-1" style={{ color: 'hsl(43, 82%, 55%)' }}>→</span>
                    <span className="font-bold tabular-nums" style={goldGradientStyle}>{(block.endProb * 100).toFixed(1)}%</span>
                    <span className="ml-2 font-bold" style={goldGradientStyle}>E={block.contribution.composite.toFixed(3)}</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </AnimatePresence>

        {/* ═══ 3. POSTERIOR BAR ═══ */}
        <motion.div
          className="flex items-center gap-3 py-1.5 mt-1 pt-3 relative z-10"
          style={{ borderTop: `1px solid ${isDropping ? 'hsla(4, 82%, 63%, 0.2)' : 'hsla(43, 96%, 56%, 0.15)'}` }}
          animate={whatIfResult ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="w-28 text-[10px] font-mono font-bold uppercase tracking-wider" style={{
            ...(isDropping ? {
              background: 'linear-gradient(135deg, hsl(4, 60%, 40%), hsl(4, 82%, 60%))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            } : { ...goldGradientStyle, filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))' }),
          }}>
            {isSimActive ? 'SIM POSTERIOR' : 'Posterior'}
          </div>
          <div className="flex-1 h-9 rounded-lg relative overflow-hidden" style={{
            background: 'rgba(8, 10, 28, 0.6)',
            border: `1px solid ${isDropping ? 'hsla(4, 82%, 63%, 0.3)' : 'hsla(43, 96%, 56%, 0.22)'}`,
            boxShadow: isDropping
              ? '0 0 30px -6px hsla(4, 82%, 63%, 0.35), inset 0 1px 0 hsla(4, 82%, 75%, 0.08)'
              : 'inset 0 1px 0 hsla(43, 96%, 56%, 0.08), 0 0 20px -6px hsla(43, 96%, 56%, 0.12)',
            transition: 'all 0.5s',
          }}>
            <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
            <motion.div
              className="absolute left-0 top-0 h-full rounded-lg"
              style={{
                background: isDropping
                  ? 'linear-gradient(90deg, hsla(4, 82%, 63%, 0.35), hsla(4, 82%, 70%, 0.2), hsla(4, 82%, 63%, 0.08))'
                  : 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.35), hsla(48, 100%, 72%, 0.2), hsla(48, 100%, 67%, 0.08))',
                boxShadow: isDropping
                  ? '0 0 32px -6px hsla(4, 82%, 63%, 0.4)'
                  : '0 0 32px -6px hsla(43, 96%, 56%, 0.3), inset 0 1px 0 hsla(48, 100%, 80%, 0.12)',
              }}
              animate={{ width: `${finalPosterior * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            <motion.span
              className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-sm font-bold tabular-nums"
              style={isDropping ? {
                background: 'linear-gradient(135deg, hsl(4, 60%, 42%), hsl(4, 82%, 65%))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                filter: 'drop-shadow(0 0 6px hsla(4, 82%, 63%, 0.4))',
              } : {
                ...goldGradientStyle, filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.3))',
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

        {/* Scenario delta summary */}
        {whatIfResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-3 py-2 rounded-xl relative z-10"
            style={{ ...glassInner, border: `1px solid ${isDropping ? 'hsla(4, 82%, 63%, 0.2)' : 'hsla(192, 95%, 50%, 0.2)'}` }}
          >
            <span className="text-[10px] font-mono text-muted-foreground">
              {excludedIds.size} evidence excluded • {whatIfResult.remaining_evidence_count} remaining
            </span>
            <span className="font-mono text-xs font-bold tabular-nums" style={isDropping ? {
              color: 'hsl(4, 82%, 63%)', textShadow: '0 0 12px hsla(4, 82%, 63%, 0.5)',
            } : { color: 'hsl(123, 38%, 57%)', textShadow: '0 0 8px hsla(123, 38%, 57%, 0.3)' }}>
              Δ {posteriorDelta > 0 ? '+' : ''}{(posteriorDelta * 100).toFixed(1)}pp
              {!isWonder && (
                <span className="ml-2 text-[9px] text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                  ({whatIfResult.update_result.delta_log_odds > 0 ? '+' : ''}{whatIfResult.update_result.delta_log_odds.toFixed(4)} LO)
                </span>
              )}
            </span>
          </motion.div>
        )}

        {/* Loading bar */}
        {whatIfLoading && (
          <motion.div className="h-0.5 rounded-full overflow-hidden relative z-10" style={{ background: 'hsla(192, 95%, 50%, 0.1)' }}>
            <motion.div className="h-full" style={{ background: 'linear-gradient(90deg, hsl(192, 95%, 50%), hsl(43, 96%, 56%))' }}
              animate={{ x: ['-100%', '100%'] }} transition={{ duration: 0.8, repeat: Infinity }} />
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}

function MicroBadge({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-4 h-3 rounded-sm flex items-end overflow-hidden" style={{ background: 'hsla(220, 10%, 30%, 0.3)' }}>
      <div style={{ width: '100%', height: `${value * 100}%`, background: `${color}88`, borderRadius: '1px 1px 0 0' }} />
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
        ...goldGradientStyle, filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
      }}>{value}</span>
    </span>
  );
}
