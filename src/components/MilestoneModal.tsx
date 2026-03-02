import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Milestone, Evidence, statusLabels } from '@/data/milestones';
import { DomainBadge, StatusBadge, ArchetypeBadge } from '@/components/Badges';
import { ProbabilityRing } from '@/components/ProbabilityRing';
import { WaterfallChart } from '@/components/WaterfallChart';
import { useMode } from '@/contexts/ModeContext';
import { ArrowUpRight, ArrowDownRight, Shield, Clock, Users, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';
import { glassPanelStrong, glassInner, specularReflection, goldChromeLine } from '@/lib/glass-styles';

const domainHsl: Record<string, string> = {
  compute: 'hsl(190, 100%, 50%)',
  energy: 'hsl(38, 100%, 58%)',
  connectivity: 'hsl(270, 90%, 68%)',
  manufacturing: 'hsl(340, 80%, 62%)',
  biology: 'hsl(152, 80%, 50%)',
};

interface MilestoneModalProps {
  milestone: Milestone | null;
  open: boolean;
  onClose: () => void;
}

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

/* ═══ PROVENANCE BADGE — metallic enhanced ═══ */
function ProvenanceBadge({ label, value, icon, tooltip }: { label: string; value: string; icon: React.ReactNode; tooltip: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] cursor-help transition-all duration-200 hover:scale-105 relative overflow-hidden shine-sweep"
            style={{
              ...glassInner,
              border: '1px solid hsla(220, 12%, 70%, 0.12)',
              boxShadow: [
                'inset 0 1px 0 hsla(220, 16%, 95%, 0.07)',
                'inset 0 -1px 0 hsla(232, 30%, 2%, 0.35)',
                '0 2px 8px -4px hsla(232, 30%, 2%, 0.4)',
              ].join(', '),
            }}
          >
            <span style={{
              background: 'linear-gradient(135deg, hsl(220, 10%, 55%), hsl(220, 14%, 82%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{icon}</span>
            <span className="text-muted-foreground">{label}</span>
            <span className="font-bold tabular-nums" style={{
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
            }}>{value}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="text-xs max-w-[220px]"
          style={{
            ...glassPanelStrong,
            border: '1px solid hsla(43, 96%, 56%, 0.2)',
          }}
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ═══ EVIDENCE ROW — metallic themed ═══ */
function EvidenceRow({ ev }: { ev: Evidence }) {
  const isSupport = ev.direction === 'supports';
  const isContradict = ev.direction === 'contradicts';

  const borderColor = isSupport
    ? 'hsla(155, 82%, 48%, 0.22)'
    : isContradict
    ? 'hsla(0, 72%, 55%, 0.22)'
    : 'hsla(220, 10%, 72%, 0.1)';

  const accentTint = isSupport
    ? 'hsla(155, 82%, 48%, 0.08)'
    : isContradict
    ? 'hsla(0, 72%, 55%, 0.08)'
    : 'transparent';

  const iconBg = isSupport
    ? 'linear-gradient(145deg, hsl(155, 70%, 28%), hsl(155, 82%, 42%), hsl(155, 70%, 55%))'
    : isContradict
    ? 'linear-gradient(145deg, hsl(0, 60%, 30%), hsl(0, 72%, 48%), hsl(0, 60%, 58%))'
    : 'linear-gradient(145deg, hsl(220, 10%, 35%), hsl(220, 12%, 55%), hsl(220, 10%, 40%))';

  const dirLabel = isSupport ? '↑ SUPPORTS' : isContradict ? '↓ CONTRADICTS' : '~ AMBIGUOUS';

  return (
    <motion.div
      className="rounded-xl p-4 relative overflow-hidden group shine-sweep"
      style={{
        background: `linear-gradient(168deg, ${accentTint}, rgba(8, 10, 28, 0.82))`,
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: [
          'inset 0 1px 0 hsla(220, 16%, 95%, 0.07)',
          'inset 0 -1px 0 hsla(232, 30%, 2%, 0.4)',
          '0 4px 16px -4px hsla(232, 30%, 2%, 0.5)',
        ].join(', '),
      }}
      whileHover={{ scale: 1.005, y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Specular sheen */}
      <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl" style={specularReflection} />

      <div className="flex items-start justify-between gap-3 mb-2.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-background"
            style={{
              background: iconBg,
              boxShadow: `inset 0 1px 0 hsla(0, 0%, 100%, 0.3), inset 0 -1px 0 hsla(0, 0%, 0%, 0.25), 0 2px 8px -2px ${borderColor}`,
            }}
          >
            {isSupport ? '↑' : isContradict ? '↓' : '~'}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{ev.source}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {ev.type.replace('_', ' ')} • {ev.date}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-[9px] font-bold tracking-wider" style={{
            color: isSupport ? 'hsl(155, 82%, 55%)' : isContradict ? 'hsl(0, 72%, 60%)' : 'hsl(220, 12%, 65%)',
            textShadow: isSupport ? '0 0 8px hsla(155, 82%, 48%, 0.3)' : isContradict ? '0 0 8px hsla(0, 72%, 55%, 0.3)' : 'none',
          }}>
            {dirLabel}
          </span>
          <span
            className="font-mono text-xs font-bold tabular-nums"
            style={isSupport ? {
              background: 'linear-gradient(135deg, hsl(155, 70%, 35%), hsl(155, 82%, 55%), hsl(155, 70%, 65%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 4px hsla(155, 82%, 48%, 0.2))',
            } : isContradict ? {
              background: 'linear-gradient(135deg, hsl(0, 60%, 40%), hsl(0, 72%, 60%), hsl(0, 60%, 68%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 4px hsla(0, 72%, 55%, 0.2))',
            } : {
              background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 75%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {ev.delta_log_odds > 0 ? '+' : ''}{ev.delta_log_odds.toFixed(2)} LO
          </span>
        </div>
      </div>

      <p className="text-xs text-secondary-foreground leading-relaxed mb-3 relative z-10">{ev.summary}</p>

      <div className="flex gap-2 flex-wrap relative z-10">
        <ProvenanceBadge label="Cred" value={ev.credibility.toFixed(2)} icon={<Shield className="w-2.5 h-2.5" />} tooltip="Source credibility score based on publication type and track record" />
        <ProvenanceBadge label="Decay" value={ev.recency.toFixed(2)} icon={<Clock className="w-2.5 h-2.5" />} tooltip="Temporal recency weight — newer evidence decays less" />
        <ProvenanceBadge label="Cons" value={ev.consensus.toFixed(2)} icon={<Users className="w-2.5 h-2.5" />} tooltip="Expert consensus alignment — how many independent sources agree" />
        <ProvenanceBadge label="Match" value={ev.criteria_match.toFixed(2)} icon={<Crosshair className="w-2.5 h-2.5" />} tooltip="How directly this evidence addresses the milestone's success criteria" />
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold tabular-nums"
          style={{
            background: 'hsla(43, 96%, 56%, 0.1)',
            border: '1px solid hsla(43, 96%, 56%, 0.22)',
            boxShadow: 'inset 0 1px 0 hsla(48, 100%, 80%, 0.08), inset 0 -1px 0 hsla(232, 30%, 2%, 0.3)',
          }}
        >
          <span style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))',
          }}>E={ev.composite.toFixed(3)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function MilestoneModal({ milestone, open, onClose }: MilestoneModalProps) {
  if (!milestone) return null;
  const { isWonder } = useMode();

  const delta = milestone.posterior - milestone.prior;
  const isPositive = delta >= 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] overflow-y-auto p-0"
        style={{
          ...glassPanelStrong,
          border: '1px solid hsla(220, 10%, 72%, 0.2)',
          boxShadow: [
            '0 0 120px -20px hsla(230, 25%, 3%, 0.95)',
            '0 0 80px -10px hsla(43, 96%, 56%, 0.12)',
            'inset 0 1px 0 hsla(220, 16%, 95%, 0.14)',
            'inset 0 -1px 0 hsla(232, 30%, 2%, 0.6)',
            'inset 1px 0 0 hsla(220, 16%, 95%, 0.04)',
            'inset -1px 0 0 hsla(220, 16%, 95%, 0.04)',
          ].join(', '),
        }}
      >
        {/* Top gold rim */}
        <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
        {/* Specular top reflection */}
        <div className="absolute top-0 left-0 right-0 h-[25%] rounded-t-lg" style={{
          background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.08) 0%, hsla(48, 100%, 90%, 0.02) 30%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <DialogHeader className="p-6 pb-4 relative z-10" style={{ borderBottom: '1px solid hsla(220, 10%, 72%, 0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <DomainBadge domain={milestone.domain} />
            <StatusBadge status={milestone.status} />
            <ArchetypeBadge archetype={milestone.archetype} />
          </div>
          <DialogTitle className={`font-display text-xl font-bold flex items-center gap-4 ${
            isWonder ? 'text-gold' : 'text-foreground'
          }`}>
            {milestone.title}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <ProbabilityRing
                value={milestone.posterior}
                size={56}
                strokeWidth={5}
                domainColor={domainHsl[milestone.domain]}
                useGold={true}
              />
            </motion.div>
          </DialogTitle>
          <div className="flex items-center gap-4 mt-3 font-mono text-[10px] text-muted-foreground flex-wrap">
            <span>Target: <span className="font-bold tabular-nums" style={{
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
            }}>{milestone.year}</span></span>
            <span>Tier: <span className="font-bold uppercase" style={{
              background: 'linear-gradient(135deg, hsl(220, 10%, 55%), hsl(220, 14%, 82%), hsl(220, 16%, 92%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{milestone.tier}</span></span>
            <span>
              Magnitude: <span className="font-bold tabular-nums" style={{
                ...goldGradientStyle,
                filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
              }}>{milestone.magnitude}/10</span>
            </span>
            <span className="flex items-center gap-1 font-bold">
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.5))' }} />
              ) : (
                <ArrowDownRight className="w-3 h-3" style={{ color: 'hsl(0, 72%, 58%)', filter: 'drop-shadow(0 0 3px hsla(0, 72%, 55%, 0.3))' }} />
              )}
              <span className="tabular-nums" style={isPositive ? {
                ...goldGradientStyle,
                filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))',
              } : { color: 'hsl(0, 72%, 58%)', textShadow: '0 0 4px hsla(0, 72%, 55%, 0.2)' }}>
                Δ {isFinite(milestone.delta_log_odds) ? milestone.delta_log_odds.toFixed(2) : '∞'} log-odds
              </span>
            </span>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="p-6 pt-4 relative z-10">
          <TabsList
            className="mb-4 rounded-xl p-1 relative overflow-hidden"
            style={{
              ...glassInner,
              border: '1px solid hsla(220, 12%, 70%, 0.12)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-xl pointer-events-none" style={specularReflection} />
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary rounded-lg text-xs relative z-10">Overview</TabsTrigger>
            <TabsTrigger value="why" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold-solid rounded-lg text-xs relative z-10">Why It Changed</TabsTrigger>
            <TabsTrigger value="evidence" className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary rounded-lg text-xs relative z-10">Evidence ({milestone.evidence.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <p className="text-sm text-secondary-foreground leading-relaxed">{milestone.description}</p>

            <div className="rounded-xl p-4 relative overflow-hidden shine-sweep" style={{
              background: 'linear-gradient(135deg, hsla(192, 100%, 52%, 0.08), rgba(8, 10, 28, 0.82))',
              border: '1px solid hsla(192, 100%, 52%, 0.2)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: 'inset 0 1px 0 hsla(192, 100%, 70%, 0.1), inset 0 -1px 0 hsla(232, 30%, 2%, 0.4), 0 4px 16px -4px hsla(232, 30%, 2%, 0.4)',
            }}>
              <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl" style={specularReflection} />
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-primary mb-2 font-mono font-bold relative z-10" style={{ textShadow: '0 0 8px hsla(192, 95%, 50%, 0.3)' }}>Success Criteria</h4>
              <p className="text-sm text-foreground relative z-10">{milestone.success_criteria}</p>
            </div>

            <div className="rounded-xl p-4 relative overflow-hidden shine-sweep" style={{
              background: 'linear-gradient(135deg, hsla(0, 72%, 55%, 0.08), rgba(8, 10, 28, 0.82))',
              border: '1px solid hsla(0, 72%, 55%, 0.2)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: 'inset 0 1px 0 hsla(0, 72%, 70%, 0.1), inset 0 -1px 0 hsla(232, 30%, 2%, 0.4), 0 4px 16px -4px hsla(232, 30%, 2%, 0.4)',
            }}>
              <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl" style={specularReflection} />
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-destructive mb-2 font-mono font-bold relative z-10" style={{ textShadow: '0 0 8px hsla(0, 72%, 55%, 0.3)' }}>Falsification Condition</h4>
              <p className="text-sm text-foreground relative z-10">{milestone.falsification}</p>
            </div>

            {/* Belief trajectory */}
            <div className="rounded-xl p-4 relative overflow-hidden" style={{
              ...glassInner,
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid hsla(220, 12%, 70%, 0.12)',
            }}>
              <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl" style={specularReflection} />
              <h4 className="text-[10px] uppercase tracking-[0.12em] mb-3 font-mono font-bold relative z-10" style={{
                background: 'linear-gradient(135deg, hsl(220, 10%, 55%), hsl(220, 14%, 78%), hsl(220, 16%, 88%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Belief Trajectory</h4>
              <div className="relative h-8 rounded-full overflow-hidden"
                style={{
                  background: 'rgba(8, 10, 28, 0.6)',
                  border: '1px solid hsla(220, 10%, 72%, 0.1)',
                }}
              >
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.4), hsla(48, 100%, 72%, 0.15), hsla(43, 96%, 56%, 0.08))',
                    boxShadow: '0 0 24px -4px hsla(43, 96%, 56%, 0.3), inset 0 1px 0 hsla(48, 100%, 80%, 0.1)',
                  }}
                  initial={{ width: `${milestone.prior * 100}%` }}
                  animate={{ width: `${milestone.posterior * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
                <div
                  className="absolute top-0 h-full w-0.5"
                  style={{ left: `${milestone.prior * 100}%`, background: 'hsla(220, 12%, 70%, 0.3)' }}
                />
              </div>
              <div className="flex justify-between mt-2 font-mono text-[10px] text-muted-foreground relative z-10">
                <span>Prior: <span className="font-bold tabular-nums" style={{
                  ...goldGradientStyle,
                  filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
                }}>{(milestone.prior * 100).toFixed(1)}%</span></span>
                <span className="font-bold">Posterior: <span className="tabular-nums" style={{
                  ...goldGradientStyle,
                  filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.25))',
                }}>{(milestone.posterior * 100).toFixed(1)}%</span></span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="why">
            <h4 className="text-sm font-semibold mb-4 font-display" style={{
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.2))',
            }}>Interactive Waterfall — What moved the probability?</h4>
            <WaterfallChart prior={milestone.prior} evidence={milestone.evidence} />
          </TabsContent>

          <TabsContent value="evidence" className="space-y-3">
            {milestone.evidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">Historical milestone — no tracked evidence.</p>
            ) : (
              milestone.evidence.map((ev) => <EvidenceRow key={ev.id} ev={ev} />)
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
