import { useEffect, useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Milestone } from '@/data/milestones';
import { DomainBadge, StatusBadge, ArchetypeBadge } from '@/components/Badges';
import { AnimatedProbabilityRing } from '@/components/AnimatedProbabilityRing';
import { InteractiveWaterfall } from '@/components/InteractiveWaterfall';
import { WhyItChangedHeader } from '@/components/WhyItChangedHeader';
import { WhyItChangedSkeleton } from '@/components/WhyItChangedSkeleton';
import { LPMemoExport } from '@/components/LPMemoExport';
import { SocraticLensTab } from '@/components/SocraticLensTab';
import { PredictionMarkets } from '@/components/PredictionMarkets';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useMilestoneAPI } from '@/hooks/useMilestoneAPI';
import { useMode } from '@/contexts/ModeContext';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useHysteresis } from '@/hooks/useHysteresis';
import { ArrowUpRight, ArrowDownRight, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { glassPanelStrong, glassInner, specularReflection, goldChromeLine } from '@/lib/glass-styles';

const domainHsl: Record<string, string> = {
  compute: 'hsl(190, 100%, 50%)', energy: 'hsl(38, 100%, 58%)',
  connectivity: 'hsl(270, 90%, 68%)', manufacturing: 'hsl(340, 80%, 62%)',
  biology: 'hsl(152, 80%, 50%)',
};

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const, backgroundClip: 'text' as const,
};

interface MilestoneModalProps {
  milestone: Milestone | null;
  open: boolean;
  onClose: () => void;
}

function CalibMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className="font-mono text-sm font-bold tabular-nums" style={{
        ...goldGradientStyle,
        filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))',
      }}>{(value * 100).toFixed(1)}%</div>
    </div>
  );
}

function EvidenceRow({ ev }: { ev: any }) {
  const isSupport = ev.direction === 'supports';
  const isContradict = ev.direction === 'contradicts';
  const borderColor = isSupport ? 'hsla(155, 82%, 48%, 0.22)' : isContradict ? 'hsla(0, 72%, 55%, 0.22)' : 'hsla(220, 10%, 72%, 0.1)';
  const accentTint = isSupport ? 'hsla(155, 82%, 48%, 0.08)' : isContradict ? 'hsla(0, 72%, 55%, 0.08)' : 'transparent';
  const dirLabel = isSupport ? '↑ SUPPORTS' : isContradict ? '↓ CONTRADICTS' : '~ AMBIGUOUS';

  return (
    <motion.div
      className="rounded-xl p-4 relative overflow-hidden group shine-sweep"
      style={{
        background: `linear-gradient(168deg, ${accentTint}, rgba(8, 10, 28, 0.82))`,
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.07), inset 0 -1px 0 hsla(232, 30%, 2%, 0.4), 0 4px 16px -4px hsla(232, 30%, 2%, 0.5)',
      }}
      whileHover={{ scale: 1.005, y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl" style={specularReflection} />
      <div className="flex items-start justify-between gap-3 mb-2.5 relative z-10">
        <div>
          <p className="text-sm font-medium text-foreground">{ev.source}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {(ev.type || '').replace('_', ' ')} • {ev.date}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-[9px] font-bold tracking-wider" style={{
            color: isSupport ? 'hsl(155, 82%, 55%)' : isContradict ? 'hsl(0, 72%, 60%)' : 'hsl(220, 12%, 65%)',
          }}>{dirLabel}</span>
          <span className="font-mono text-xs font-bold tabular-nums" style={isSupport ? {
            background: 'linear-gradient(135deg, hsl(155, 70%, 35%), hsl(155, 82%, 55%))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          } : isContradict ? {
            background: 'linear-gradient(135deg, hsl(0, 60%, 40%), hsl(0, 72%, 60%))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          } : { color: 'hsl(220, 10%, 55%)' }}>
            {ev.delta_log_odds > 0 ? '+' : ''}{Number(ev.delta_log_odds).toFixed(2)} LO
          </span>
        </div>
      </div>
      <p className="text-xs text-secondary-foreground leading-relaxed mb-3 relative z-10">{ev.summary}</p>
      <div className="flex gap-2 flex-wrap relative z-10 font-mono text-[10px]">
        <span className="px-2 py-0.5 rounded-lg" style={{ ...glassInner, border: '1px solid hsla(220, 12%, 70%, 0.12)' }}>
          Cred <span className="font-bold tabular-nums" style={goldGradientStyle}>{Number(ev.credibility).toFixed(2)}</span>
        </span>
        <span className="px-2 py-0.5 rounded-lg" style={{ ...glassInner, border: '1px solid hsla(220, 12%, 70%, 0.12)' }}>
          Cons <span className="font-bold tabular-nums" style={goldGradientStyle}>{Number(ev.consensus).toFixed(2)}</span>
        </span>
        <span className="px-2 py-0.5 rounded-lg" style={{ background: 'hsla(43, 96%, 56%, 0.1)', border: '1px solid hsla(43, 96%, 56%, 0.22)' }}>
          <span style={{ ...goldGradientStyle, filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))' }}>E={Number(ev.composite).toFixed(3)}</span>
        </span>
      </div>
    </motion.div>
  );
}

export function MilestoneModal({ milestone, open, onClose }: MilestoneModalProps) {
  const { isWonder } = useMode();
  const { canExportMemo } = useEntitlement();
  const { loading, detail, whatIfResult, whatIfLoading, fetchMilestone, runWhatIf } = useMilestoneAPI();
  const [_commitInProgress, setCommitInProgress] = useState(false);
  const hysteresis = useHysteresis();
  const [ledgerHash, setLedgerHash] = useState<string | null>(null);
  const [snapshotTimestamp, setSnapshotTimestamp] = useState<string | null>(null);
  const [isNegativeShift, setIsNegativeShift] = useState(false);
  const [simPosterior, setSimPosterior] = useState<number | null>(null);
  const [tagFlip, setTagFlip] = useState<{ from: string; to: string } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMemoExport, setShowMemoExport] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const hasFetchedWhyRef = useRef<string | null>(null);

  // Reset state on modal open/close
  useEffect(() => {
    if (open && milestone) {
      setIsNegativeShift(false);
      setSimPosterior(null);
      setTagFlip(null);
      hysteresis.reset();
      setActiveTab('overview');
      hasFetchedWhyRef.current = null;
      setLedgerHash(null);
      setSnapshotTimestamp(null);
    }
  }, [open, milestone?.id]);

  // Lazy-load: fetch only when "why" tab is selected
  useEffect(() => {
    if (activeTab === 'why' && milestone && hasFetchedWhyRef.current !== milestone.id) {
      hasFetchedWhyRef.current = milestone.id;
      fetchMilestone(milestone.id).then(result => {
        if (result?.bayes) {
          setSnapshotTimestamp(new Date().toISOString());
        }
      });
    }
  }, [activeTab, milestone?.id, fetchMilestone]);

  const handleNegativeShift = useCallback((negative: boolean, posterior: number) => {
    setIsNegativeShift(negative);
    setSimPosterior(posterior);
    
    if (milestone) {
      hysteresis.recordUpdate(posterior, milestone.prior, milestone.archetype);
    }
    
    if (milestone && negative) {
      const origArchetype = milestone.archetype;
      if (hysteresis.shouldDemote && hysteresis.demotedArchetype) {
        setTagFlip({ from: origArchetype.charAt(0).toUpperCase() + origArchetype.slice(1), to: 'Bottleneck' });
      } else if (origArchetype === 'breakthrough' && posterior < milestone.prior) {
        setTagFlip({ from: 'Breakthrough', to: 'Bottleneck' });
      } else if (origArchetype === 'sleeper' && posterior < milestone.prior * 0.7) {
        setTagFlip({ from: 'Sleeper', to: 'Bottleneck' });
      } else {
        setTagFlip(null);
      }
    } else {
      setTagFlip(null);
    }
  }, [milestone, hysteresis]);

  const handleCommitNegativeEvidence = useCallback(async (excludedIds: string[], whatIfRes: any) => {
    if (!milestone) return;
    setCommitInProgress(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/milestones-api/${milestone.id}/evidence`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'What-If Sandbox Commit',
          type: 'analyst_override',
          direction: 'contradicts',
          summary: `Excluded ${excludedIds.length} evidence items via sandbox simulation`,
          excluded_evidence_ids: excludedIds,
          sandbox_posterior: whatIfRes.update_result.posterior,
          sandbox_delta_lo: whatIfRes.update_result.delta_log_odds,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result?.trust_ledger?.sha256_hash) {
          setLedgerHash(result.trust_ledger.sha256_hash);
          setSnapshotTimestamp(new Date().toISOString());
        }
        await fetchMilestone(milestone.id);
      }
    } catch (err) {
      console.error('Commit failed:', err);
    } finally {
      setCommitInProgress(false);
    }
  }, [milestone, fetchMilestone]);

  if (!milestone) return null;

  const liveData = detail;
  const livePosterior = liveData?.bayes?.posterior ?? milestone.posterior;
  const livePrior = liveData?.bayes?.prior ?? milestone.prior;
  const liveDeltaLO = liveData?.bayes?.delta_log_odds ?? milestone.delta_log_odds;
  const delta = livePosterior - livePrior;
  const isPositive = delta >= 0;

  const displayPosterior = simPosterior ?? whatIfResult?.update_result.posterior ?? livePosterior;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 relative specular-track"
        onMouseMove={(e) => {
          const el = e.currentTarget;
          const rect = el.getBoundingClientRect();
          el.style.setProperty('--specular-x', `${e.clientX - rect.left}px`);
          el.style.setProperty('--specular-y', `${e.clientY - rect.top}px`);
          el.style.setProperty('--specular-opacity', '1');
          el.style.setProperty('--specular-radius', '350px');
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.setProperty('--specular-opacity', '0');
        }}
        style={{
          ...glassPanelStrong,
          border: `1px solid ${isNegativeShift ? 'hsla(0, 72%, 55%, 0.3)' : 'hsla(220, 10%, 72%, 0.2)'}`,
          boxShadow: [
            '0 0 120px -20px hsla(230, 25%, 3%, 0.95)',
            isNegativeShift ? '0 0 80px -10px hsla(0, 72%, 55%, 0.25)' : '0 0 80px -10px hsla(43, 96%, 56%, 0.12)',
            'inset 0 1px 0 hsla(220, 16%, 95%, 0.14)',
            'inset 0 -1px 0 hsla(232, 30%, 2%, 0.6)',
          ].join(', '),
          transition: 'border-color 0.5s, box-shadow 0.5s',
        }}
      >
        <AnimatePresence>
          {isNegativeShift && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`red-particle-${i}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 3 + Math.random() * 5,
                    height: 3 + Math.random() * 5,
                    background: `radial-gradient(circle, hsla(0, 72%, 60%, ${0.4 + Math.random() * 0.4}), transparent)`,
                    boxShadow: '0 0 10px hsla(0, 72%, 55%, 0.6)',
                  }}
                  initial={{
                    x: 100 + Math.random() * 400,
                    y: 50 + Math.random() * 200,
                    opacity: 0.9,
                    scale: 1,
                  }}
                  animate={{
                    y: [null, 50 + Math.random() * 350],
                    x: [null, 60 + Math.random() * 480],
                    opacity: [0.9, 0],
                    scale: [1, 0.2],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2 + Math.random() * 2.5, ease: 'easeOut', delay: i * 0.12 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <div className="absolute top-0 left-6 right-6 h-px transition-all duration-500" style={
          isNegativeShift
            ? { background: 'linear-gradient(90deg, transparent, hsla(0, 72%, 55%, 0.4), hsla(0, 72%, 65%, 0.2), hsla(0, 72%, 55%, 0.4), transparent)' }
            : goldChromeLine
        } />
        <div className="absolute top-0 left-0 right-0 h-[25%] rounded-t-lg" style={{
          background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.08) 0%, hsla(48, 100%, 90%, 0.02) 30%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        <DialogHeader className="p-6 pb-4 relative z-10" style={{ borderBottom: '1px solid hsla(220, 10%, 72%, 0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <DomainBadge domain={milestone.domain} />
            <StatusBadge status={milestone.status} />
            <AnimatePresence mode="wait">
              {tagFlip ? (
                <motion.div
                  key="flipped-tag"
                  initial={{ rotateX: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotateX: 0, opacity: 1, scale: 1 }}
                  exit={{ rotateX: 90, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold"
                  style={{
                    background: 'hsla(0, 72%, 55%, 0.15)',
                    border: '1px solid hsla(0, 72%, 55%, 0.3)',
                    color: 'hsl(0, 72%, 60%)',
                    boxShadow: '0 0 16px -4px hsla(0, 72%, 55%, 0.4)',
                  }}
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span className="line-through opacity-50">{tagFlip.from}</span>
                  <span className="mx-0.5">→</span>
                  <span>{tagFlip.to}</span>
                </motion.div>
              ) : (
                <motion.div
                  key="normal-tag"
                  initial={{ rotateX: 90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  exit={{ rotateX: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ArchetypeBadge archetype={milestone.archetype} />
                </motion.div>
              )}
            </AnimatePresence>
            {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
          <DialogDescription className="sr-only">Details for {milestone.title} milestone including overview, evidence waterfall, and analysis</DialogDescription>
          <DialogTitle className={`font-display text-xl font-bold flex items-center gap-4 ${isWonder ? 'text-gold' : 'text-foreground'}`}>
            {milestone.title}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <AnimatedProbabilityRing
                currentValue={displayPosterior}
                previousValue={livePosterior}
                size={56}
                mode={isWonder ? 'wonder' : 'analyst'}
                strokeWidth={5}
                domainColor={isNegativeShift ? 'hsl(0, 72%, 55%)' : domainHsl[milestone.domain]}
                useGold={!isNegativeShift}
                isNegativeShift={isNegativeShift}
              />
            </motion.div>
          </DialogTitle>
          <div className="flex items-center gap-4 mt-3 font-mono text-[10px] text-muted-foreground flex-wrap">
            <span>Target: <span className="font-bold tabular-nums" style={{ ...goldGradientStyle, filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))' }}>{milestone.year}</span></span>
            <span>Tier: <span className="font-bold uppercase" style={{
              background: 'linear-gradient(135deg, hsl(220, 10%, 55%), hsl(220, 14%, 82%), hsl(220, 16%, 92%))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>{milestone.tier}</span></span>
            <span>Magnitude: <span className="font-bold tabular-nums" style={{ ...goldGradientStyle, filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))' }}>{milestone.magnitude}/10</span></span>
            <span className="flex items-center gap-1 font-bold">
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.5))' }} />
              ) : (
                <ArrowDownRight className="w-3 h-3" style={{ color: 'hsl(0, 72%, 58%)', filter: 'drop-shadow(0 0 3px hsla(0, 72%, 55%, 0.3))' }} />
              )}
              <span className="tabular-nums" style={isPositive ? {
                ...goldGradientStyle, filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))',
              } : { color: 'hsl(0, 72%, 58%)', textShadow: '0 0 4px hsla(0, 72%, 55%, 0.2)' }}>
                Δ {isFinite(liveDeltaLO) ? liveDeltaLO.toFixed(2) : '∞'} log-odds
              </span>
            </span>
          </div>

          <AnimatePresence>
            {tagFlip && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="rounded-lg px-3 py-2 flex items-center gap-2 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, hsla(0, 72%, 55%, 0.12), rgba(8, 10, 28, 0.8))',
                  border: '1px solid hsla(0, 72%, 55%, 0.25)',
                  boxShadow: '0 0 24px -6px hsla(0, 72%, 55%, 0.3), inset 0 1px 0 hsla(0, 72%, 70%, 0.08)',
                }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'hsl(0, 72%, 60%)', filter: 'drop-shadow(0 0 8px hsla(0, 72%, 55%, 0.6))' }} />
                </motion.div>
                <span className="text-[10px] font-mono font-bold" style={{ color: 'hsl(0, 72%, 65%)' }}>
                  THRESHOLD CROSSED: Classification shifted from {tagFlip.from} → {tagFlip.to}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6 pt-4 relative z-10">
          <TabsList className="mb-4 rounded-xl p-1 relative overflow-hidden" style={{ ...glassInner, border: '1px solid hsla(220, 12%, 70%, 0.12)' }}>
            <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-xl pointer-events-none" style={specularReflection} />
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary rounded-lg text-xs relative z-10">Overview</TabsTrigger>
            <TabsTrigger value="why" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold-solid rounded-lg text-xs relative z-10">Why It Changed</TabsTrigger>
            <TabsTrigger value="socratic" className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary rounded-lg text-xs relative z-10">
              {isWonder ? '✨ Socratic' : 'Socratic Lens'}
            </TabsTrigger>
            <TabsTrigger value="evidence" className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary rounded-lg text-xs relative z-10">
              Evidence ({liveData?.evidence?.length ?? milestone.evidence.length})
            </TabsTrigger>
            <TabsTrigger value="markets" className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary rounded-lg text-xs relative z-10">
              Markets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <p className="text-sm text-secondary-foreground leading-relaxed">{milestone.description}</p>

            <div className="rounded-xl p-4 relative overflow-hidden shine-sweep" style={{
              background: 'linear-gradient(135deg, hsla(192, 100%, 52%, 0.08), rgba(8, 10, 28, 0.82))',
              border: '1px solid hsla(192, 100%, 52%, 0.2)',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              boxShadow: 'inset 0 1px 0 hsla(192, 100%, 70%, 0.1), inset 0 -1px 0 hsla(232, 30%, 2%, 0.4)',
            }}>
              <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl" style={specularReflection} />
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-primary mb-2 font-mono font-bold relative z-10">Success Criteria</h4>
              <p className="text-sm text-foreground relative z-10">{milestone.success_criteria}</p>
            </div>

            <div className="rounded-xl p-4 relative overflow-hidden shine-sweep" style={{
              background: 'linear-gradient(135deg, hsla(0, 72%, 55%, 0.08), rgba(8, 10, 28, 0.82))',
              border: '1px solid hsla(0, 72%, 55%, 0.2)',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              boxShadow: 'inset 0 1px 0 hsla(0, 72%, 70%, 0.1), inset 0 -1px 0 hsla(232, 30%, 2%, 0.4)',
            }}>
              <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl" style={specularReflection} />
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-destructive mb-2 font-mono font-bold relative z-10">Falsification Condition</h4>
              <p className="text-sm text-foreground relative z-10">{milestone.falsification}</p>
            </div>

            <div className="rounded-xl p-4 relative overflow-hidden" style={{ ...glassInner, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid hsla(220, 12%, 70%, 0.12)' }}>
              <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl" style={specularReflection} />
              <h4 className="text-[10px] uppercase tracking-[0.12em] mb-3 font-mono font-bold relative z-10" style={{
                background: 'linear-gradient(135deg, hsl(220, 10%, 55%), hsl(220, 14%, 78%), hsl(220, 16%, 88%))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Belief Trajectory</h4>
              <div className="relative h-8 rounded-full overflow-hidden" style={{ background: 'rgba(8, 10, 28, 0.6)', border: '1px solid hsla(220, 10%, 72%, 0.1)' }}>
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    background: isNegativeShift
                      ? 'linear-gradient(90deg, hsla(0, 72%, 55%, 0.4), hsla(0, 72%, 65%, 0.15), hsla(0, 72%, 55%, 0.08))'
                      : 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.4), hsla(48, 100%, 72%, 0.15), hsla(43, 96%, 56%, 0.08))',
                    boxShadow: isNegativeShift
                      ? '0 0 24px -4px hsla(0, 72%, 55%, 0.4)'
                      : '0 0 24px -4px hsla(43, 96%, 56%, 0.3)',
                    transition: 'background 0.5s, box-shadow 0.5s',
                  }}
                  initial={{ width: `${livePrior * 100}%` }}
                  animate={{ width: `${displayPosterior * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
                <div className="absolute top-0 h-full w-0.5" style={{ left: `${livePrior * 100}%`, background: 'hsla(220, 12%, 70%, 0.3)' }} />
              </div>
              <div className="flex justify-between mt-2 font-mono text-[10px] text-muted-foreground relative z-10">
                <span>Prior: <span className="font-bold tabular-nums" style={{ ...goldGradientStyle }}>{(livePrior * 100).toFixed(1)}%</span></span>
                <span className="font-bold">Posterior: <motion.span
                  className="tabular-nums"
                  key={displayPosterior.toFixed(3)}
                  initial={{ scale: 1.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={isNegativeShift ? {
                    color: 'hsl(0, 72%, 58%)',
                    textShadow: '0 0 12px hsla(0, 72%, 55%, 0.5)',
                  } : {
                    ...goldGradientStyle,
                    filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.25))',
                  }}
                >{(displayPosterior * 100).toFixed(1)}%</motion.span></span>
              </div>
            </div>

            {liveData?.calibration && (
              <div className="rounded-xl p-4 relative overflow-hidden" style={{ ...glassInner, border: '1px solid hsla(43, 96%, 56%, 0.12)' }}>
                <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl" style={specularReflection} />
                <div className="absolute top-0 left-4 right-4 h-px" style={goldChromeLine} />
                <h4 className="text-[10px] uppercase tracking-[0.12em] mb-3 font-mono font-bold relative z-10" style={{
                  ...goldGradientStyle, filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))',
                }}>Calibration Forecast</h4>
                <div className="grid grid-cols-3 gap-3 relative z-10">
                  <CalibMetric label="P(Demonstrated)" value={liveData.calibration.p_demonstrated} />
                  <CalibMetric label="P(Deployed)" value={liveData.calibration.p_deployed} />
                  <CalibMetric label="P(Accomplished)" value={liveData.calibration.p_accomplished} />
                </div>
                <div className="flex items-center gap-3 mt-3 font-mono text-[10px] text-muted-foreground relative z-10">
                  <span>Implied: <span className="font-bold" style={goldGradientStyle}>{liveData.calibration.implied_status}</span></span>
                  <span>σ-future: <span className="font-bold tabular-nums" style={goldGradientStyle}>{liveData.calibration.sigma_future.toFixed(3)}</span></span>
                  <span>Horizon: <span className="font-bold tabular-nums" style={goldGradientStyle}>{liveData.calibration.horizon_years.toFixed(1)}y</span></span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="why">
            <AnimatePresence mode="wait">
              <motion.div
                key={isWonder ? 'wonder' : 'analyst'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
            {loading ? (
              <WhyItChangedSkeleton />
            ) : liveData?.bayes ? (
              <>
                <WhyItChangedHeader
                  posterior={displayPosterior}
                  prior={livePrior}
                  snapshotHash={ledgerHash}
                  snapshotTimestamp={snapshotTimestamp}
                  evidence={liveData.evidence}
                  domainColor={isNegativeShift ? 'hsl(0, 72%, 55%)' : domainHsl[milestone.domain] || 'hsl(var(--primary))'}
                  isNegativeShift={isNegativeShift}
                  previousValue={livePosterior}
                />
                <InteractiveWaterfall
                  prior={liveData.bayes.prior}
                  contributions={liveData.bayes.contributions}
                  evidence={liveData.evidence}
                  milestoneId={milestone.id}
                  tier={milestone.tier}
                  onWhatIf={runWhatIf}
                  whatIfResult={whatIfResult}
                  whatIfLoading={whatIfLoading}
                  ledgerHash={ledgerHash ?? undefined}
                   onNegativeShift={handleNegativeShift}
                   onCommitNegativeEvidence={handleCommitNegativeEvidence}
                />
              </>
            ) : (
              <>
                <WhyItChangedHeader
                  posterior={milestone.posterior}
                  prior={milestone.prior}
                  snapshotHash={null}
                  snapshotTimestamp={null}
                  evidence={milestone.evidence.map(ev => ({
                    id: ev.id, milestone_id: milestone.id, source: ev.source,
                    type: ev.type, direction: ev.direction, credibility: ev.credibility,
                    recency: ev.recency, consensus: ev.consensus, criteria_match: ev.criteria_match,
                    composite: ev.composite, delta_log_odds: ev.delta_log_odds,
                    date: ev.date, summary: ev.summary,
                  }))}
                  domainColor={domainHsl[milestone.domain] || 'hsl(var(--primary))'}
                  isNegativeShift={false}
                />
                <InteractiveWaterfall
                  prior={milestone.prior}
                  contributions={milestone.evidence.map(ev => ({
                    evidence_id: ev.id,
                    evidence_meta: {
                      type: ev.type, credibility: ev.credibility, recency: ev.recency,
                      decay: ev.recency, consensus: ev.consensus, direction: ev.direction,
                      criteria_match: ev.criteria_match,
                    },
                    composite: ev.composite,
                    delta_log_odds: ev.delta_log_odds,
                  }))}
                  evidence={milestone.evidence.map(ev => ({
                    id: ev.id, milestone_id: milestone.id, source: ev.source,
                    type: ev.type, direction: ev.direction, credibility: ev.credibility,
                    recency: ev.recency, consensus: ev.consensus, criteria_match: ev.criteria_match,
                    composite: ev.composite, delta_log_odds: ev.delta_log_odds,
                    date: ev.date, summary: ev.summary,
                  }))}
                  milestoneId={milestone.id}
                  tier={milestone.tier}
                  onWhatIf={runWhatIf}
                  whatIfResult={whatIfResult}
                  whatIfLoading={whatIfLoading}
                   onNegativeShift={handleNegativeShift}
                   onCommitNegativeEvidence={handleCommitNegativeEvidence}
                />
              </>
            )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="socratic">
            <SocraticLensTab milestoneId={milestone.id} />
          </TabsContent>

          <TabsContent value="evidence" className="space-y-3">
            {(liveData?.evidence ?? milestone.evidence).length === 0 ? (
              <p className="text-sm text-muted-foreground">Historical milestone — no tracked evidence.</p>
            ) : (
              (liveData?.evidence ?? milestone.evidence).map((ev: any) => (
                <EvidenceRow key={ev.id} ev={ev} />
              ))
            )}
          </TabsContent>

          <TabsContent value="markets">
            <PredictionMarkets milestoneId={milestone.id} posterior={currentPosterior} />
          </TabsContent>
          
          {ledgerHash && (
            <div className="mt-3 flex items-center justify-center">
              <motion.button
                onClick={() => window.open(`/verify/${ledgerHash}`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-mono font-bold transition-all"
                style={{
                  background: 'hsla(43, 40%, 10%, 0.5)',
                  border: '1px solid hsla(43, 96%, 56%, 0.3)',
                  color: 'hsl(43, 96%, 56%)',
                  boxShadow: '0 0 20px -6px hsla(43, 96%, 56%, 0.2)',
                }}
                whileHover={{ scale: 1.03, boxShadow: '0 0 28px -4px hsla(43, 96%, 56%, 0.35)' }}
                whileTap={{ scale: 0.97 }}
              >
                View Receipt on Trust Ledger
              </motion.button>
            </div>
          )}
          
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid hsla(220, 10%, 72%, 0.1)' }}>
            <motion.button
              onClick={async () => {
                if (!canExportMemo) { setShowUpgrade(true); return; }
                if (!detail && milestone) {
                  hasFetchedWhyRef.current = milestone.id;
                  await fetchMilestone(milestone.id);
                }
                setShowMemoExport(true);
              }}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs font-semibold relative overflow-hidden shine-sweep"
              style={{
                background: 'linear-gradient(135deg, hsl(38, 88%, 32%), hsl(43, 96%, 48%), hsl(48, 100%, 68%), hsl(50, 100%, 82%), hsl(48, 100%, 66%), hsl(43, 96%, 46%))',
                color: 'hsl(232, 30%, 2%)',
                boxShadow: [
                  '0 2px 16px -2px hsla(43, 96%, 56%, 0.4)',
                  'inset 0 1px 0 hsla(48, 100%, 85%, 0.5)',
                  'inset 0 -1px 0 hsla(38, 88%, 28%, 0.55)',
                  '0 1px 3px hsla(232, 30%, 2%, 0.3)',
                ].join(', '),
                textShadow: '0 1px 0 hsla(48, 100%, 80%, 0.3)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isWonder ? '✦ Export LP Memo' : 'Export LP Memo'}
            </motion.button>
          </div>
        </Tabs>
      </DialogContent>

      {milestone && (
        <LPMemoExport
          milestone={{
            ...milestone,
            evidence: (liveData?.evidence ?? milestone.evidence).map((ev: any) => ({
              id: ev.id, source: ev.source, type: ev.type, direction: ev.direction,
              credibility: ev.credibility, recency: ev.recency, consensus: ev.consensus,
              criteria_match: ev.criteria_match, composite: ev.composite,
              delta_log_odds: ev.delta_log_odds, date: ev.date, summary: ev.summary || '',
            })),
          }}
          open={showMemoExport}
          onClose={() => setShowMemoExport(false)}
          simPosterior={simPosterior}
          ledgerHash={ledgerHash}
        />
      )}

      <UpgradePrompt
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="Export LP Memo"
        requiredTier="Pro+"
      />
    </Dialog>
  );
}
