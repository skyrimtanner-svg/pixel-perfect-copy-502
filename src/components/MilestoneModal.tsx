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

/* ═══ PROVENANCE BADGE ═══ */
function ProvenanceBadge({ label, value, icon, tooltip }: { label: string; value: string; icon: React.ReactNode; tooltip: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] cursor-help transition-all duration-200 hover:scale-105"
            style={{
              background: 'hsla(232, 26%, 8%, 0.7)',
              border: '1px solid hsla(220, 12%, 70%, 0.1)',
              boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.04), inset 0 -1px 0 hsla(232, 30%, 2%, 0.3)',
            }}
          >
            <span className="text-chrome">{icon}</span>
            <span className="text-muted-foreground">{label}</span>
            <span className="text-gold-num font-bold">{value}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="glass-strong text-xs max-w-[220px]"
          style={{
            background: 'hsla(232, 26%, 5%, 0.96)',
            border: '1px solid hsla(43, 96%, 56%, 0.15)',
            boxShadow: '0 12px 40px -8px hsla(232, 30%, 2%, 0.9)',
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
    ? 'hsla(155, 82%, 48%, 0.2)'
    : isContradict
    ? 'hsla(0, 72%, 55%, 0.2)'
    : 'hsla(220, 10%, 72%, 0.08)';

  const accentGradient = isSupport
    ? 'linear-gradient(135deg, hsla(155, 82%, 48%, 0.08), hsla(155, 82%, 48%, 0.02))'
    : isContradict
    ? 'linear-gradient(135deg, hsla(0, 72%, 55%, 0.08), hsla(0, 72%, 55%, 0.02))'
    : 'linear-gradient(135deg, hsla(220, 10%, 50%, 0.06), hsla(220, 10%, 50%, 0.02))';

  const iconBg = isSupport
    ? 'linear-gradient(145deg, hsl(155, 70%, 28%), hsl(155, 82%, 42%), hsl(155, 70%, 55%))'
    : isContradict
    ? 'linear-gradient(145deg, hsl(0, 60%, 30%), hsl(0, 72%, 48%), hsl(0, 60%, 58%))'
    : 'linear-gradient(145deg, hsl(220, 10%, 35%), hsl(220, 12%, 55%), hsl(220, 10%, 40%))';

  const dirLabel = isSupport ? '↑ SUPPORTS' : isContradict ? '↓ CONTRADICTS' : '~ AMBIGUOUS';
  const dirColor = isSupport ? 'text-green-400' : isContradict ? 'text-red-400' : 'text-chrome';

  return (
    <motion.div
      className="rounded-xl p-4 relative overflow-hidden group"
      style={{
        background: accentGradient,
        border: `1px solid ${borderColor}`,
        boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.03)',
      }}
      whileHover={{ scale: 1.005, y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Metallic chrome direction badge */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-background"
            style={{
              background: iconBg,
              boxShadow: `inset 0 1px 0 hsla(0, 0%, 100%, 0.2), 0 2px 6px -2px ${borderColor}`,
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
          <span className={`font-mono text-[9px] font-bold tracking-wider ${dirColor}`}>
            {dirLabel}
          </span>
          <span
            className="font-mono text-xs font-bold"
            style={isSupport ? {
              background: 'linear-gradient(135deg, hsl(155, 70%, 35%), hsl(155, 82%, 55%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            } : isContradict ? {
              background: 'linear-gradient(135deg, hsl(0, 60%, 40%), hsl(0, 72%, 60%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            } : { color: 'hsl(var(--chrome))' }}
          >
            {ev.delta_log_odds > 0 ? '+' : ''}{ev.delta_log_odds.toFixed(2)} LO
          </span>
        </div>
      </div>

      <p className="text-xs text-secondary-foreground leading-relaxed mb-3">{ev.summary}</p>

      {/* Provenance badges row */}
      <div className="flex gap-2 flex-wrap">
        <ProvenanceBadge label="Cred" value={ev.credibility.toFixed(2)} icon={<Shield className="w-2.5 h-2.5" />} tooltip="Source credibility score based on publication type and track record" />
        <ProvenanceBadge label="Decay" value={ev.recency.toFixed(2)} icon={<Clock className="w-2.5 h-2.5" />} tooltip="Temporal recency weight — newer evidence decays less" />
        <ProvenanceBadge label="Cons" value={ev.consensus.toFixed(2)} icon={<Users className="w-2.5 h-2.5" />} tooltip="Expert consensus alignment — how many independent sources agree" />
        <ProvenanceBadge label="Match" value={ev.criteria_match.toFixed(2)} icon={<Crosshair className="w-2.5 h-2.5" />} tooltip="How directly this evidence addresses the milestone's success criteria" />
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold"
          style={{
            background: 'hsla(43, 96%, 56%, 0.06)',
            border: '1px solid hsla(43, 96%, 56%, 0.15)',
            boxShadow: 'inset 0 1px 0 hsla(48, 100%, 80%, 0.05)',
            color: 'hsl(43, 96%, 56%)',
          }}
        >
          E={ev.composite.toFixed(3)}
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
          background: 'hsla(232, 26%, 4%, 0.97)',
          border: '1px solid hsla(220, 10%, 72%, 0.12)',
          boxShadow: [
            '0 0 100px -20px hsla(230, 25%, 3%, 0.95)',
            '0 0 60px -10px hsla(43, 96%, 56%, 0.08)',
            'inset 0 1px 0 hsla(220, 16%, 95%, 0.06)',
            'inset 0 -1px 0 hsla(232, 30%, 2%, 0.5)',
          ].join(', '),
          backdropFilter: 'blur(40px)',
        }}
      >
        {/* Top gold rim */}
        <div className="absolute top-0 left-6 right-6 h-px" style={{
          background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.2), hsla(48, 100%, 80%, 0.1), transparent)',
        }} />

        {/* Header */}
        <DialogHeader className="p-6 pb-4" style={{ borderBottom: '1px solid hsla(220, 10%, 72%, 0.08)' }}>
          <div className="flex items-center gap-2 mb-2">
            <DomainBadge domain={milestone.domain} />
            <StatusBadge status={milestone.status} />
            <ArchetypeBadge archetype={milestone.archetype} />
          </div>
          <DialogTitle className={`font-display text-xl font-bold flex items-center gap-4 ${
            isWonder ? 'text-gold' : 'text-foreground'
          }`}>
            {milestone.title}
            {/* Live updating posterior ring */}
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
            <span>Target: <span className="text-gold-num font-bold">{milestone.year}</span></span>
            <span>Tier: <span className="text-chrome font-bold uppercase">{milestone.tier}</span></span>
            <span className={milestone.magnitude >= 9 ? '' : ''}>
              Magnitude: <span className="text-gold-num font-bold">{milestone.magnitude}/10</span>
            </span>
            <span className={`flex items-center gap-1 font-bold ${isPositive ? 'text-gold-solid' : 'text-red-400'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              Δ {isFinite(milestone.delta_log_odds) ? milestone.delta_log_odds.toFixed(2) : '∞'} log-odds
            </span>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="p-6 pt-4">
          <TabsList
            className="mb-4 rounded-xl p-1"
            style={{
              background: 'hsla(232, 26%, 6%, 0.7)',
              border: '1px solid hsla(220, 12%, 70%, 0.1)',
              boxShadow: 'inset 0 1px 0 hsla(220, 14%, 88%, 0.04)',
            }}
          >
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary rounded-lg text-xs">Overview</TabsTrigger>
            <TabsTrigger value="why" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold-solid rounded-lg text-xs">Why It Changed</TabsTrigger>
            <TabsTrigger value="evidence" className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary rounded-lg text-xs">Evidence ({milestone.evidence.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <p className="text-sm text-secondary-foreground leading-relaxed">{milestone.description}</p>

            <div className="rounded-xl p-4" style={{
              background: 'linear-gradient(135deg, hsla(192, 100%, 52%, 0.04), hsla(192, 100%, 52%, 0.01))',
              border: '1px solid hsla(192, 100%, 52%, 0.15)',
              boxShadow: 'inset 0 1px 0 hsla(192, 100%, 70%, 0.04)',
            }}>
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-primary mb-2 font-mono font-bold">Success Criteria</h4>
              <p className="text-sm text-foreground">{milestone.success_criteria}</p>
            </div>

            <div className="rounded-xl p-4" style={{
              background: 'linear-gradient(135deg, hsla(0, 72%, 55%, 0.04), hsla(0, 72%, 55%, 0.01))',
              border: '1px solid hsla(0, 72%, 55%, 0.15)',
              boxShadow: 'inset 0 1px 0 hsla(0, 72%, 70%, 0.04)',
            }}>
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-destructive mb-2 font-mono font-bold">Falsification Condition</h4>
              <p className="text-sm text-foreground">{milestone.falsification}</p>
            </div>

            {/* Belief trajectory */}
            <div className="rounded-xl p-4" style={{
              background: 'hsla(232, 26%, 6%, 0.5)',
              border: '1px solid hsla(220, 12%, 70%, 0.08)',
              boxShadow: 'inset 0 1px 0 hsla(220, 14%, 88%, 0.03)',
            }}>
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-3 font-mono font-bold">Belief Trajectory</h4>
              <div className="relative h-8 rounded-full overflow-hidden"
                style={{
                  background: 'hsla(230, 22%, 8%, 0.6)',
                  border: '1px solid hsla(220, 10%, 72%, 0.08)',
                }}
              >
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.3), hsla(43, 96%, 56%, 0.1))',
                    boxShadow: '0 0 16px -4px hsla(43, 96%, 56%, 0.2)',
                  }}
                  initial={{ width: `${milestone.prior * 100}%` }}
                  animate={{ width: `${milestone.posterior * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
                <div
                  className="absolute top-0 h-full w-0.5"
                  style={{ left: `${milestone.prior * 100}%`, background: 'hsla(220, 12%, 70%, 0.25)' }}
                />
              </div>
              <div className="flex justify-between mt-2 font-mono text-[10px] text-muted-foreground">
                <span>Prior: <span className="text-gold-num">{(milestone.prior * 100).toFixed(1)}%</span></span>
                <span className="text-gold-solid font-bold">Posterior: <span className="text-gold-num">{(milestone.posterior * 100).toFixed(1)}%</span></span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="why">
            <h4 className="text-sm font-semibold text-gold mb-4 font-display">Interactive Waterfall — What moved the probability?</h4>
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
