import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Milestone, Evidence, statusLabels } from '@/data/milestones';
import { DomainBadge, StatusBadge } from '@/components/Badges';
import { ProbabilityRing } from '@/components/ProbabilityRing';
import { WaterfallChart } from '@/components/WaterfallChart';
import { useMode } from '@/contexts/ModeContext';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

function EvidenceRow({ ev }: { ev: Evidence }) {
  const isSupport = ev.direction === 'supports';
  const isContradict = ev.direction === 'contradicts';
  const dirIcon = isSupport ? '↑' : isContradict ? '↓' : '~';
  const dirColor = isSupport ? 'text-gold-solid' : isContradict ? 'text-red-400' : 'text-muted-foreground';
  const borderColor = isSupport ? 'border-gold/20' : isContradict ? 'border-red-400/20' : 'border-chrome/10';

  return (
    <div className={`glass-chrome rounded-lg p-3.5 border ${borderColor}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold text-lg ${dirColor}`}>{dirIcon}</span>
          <div>
            <p className="text-sm font-medium text-foreground">{ev.source}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{ev.type.replace('_', ' ')} • {ev.date}</p>
          </div>
        </div>
        <span className={`font-mono text-xs ${dirColor}`}>
          {ev.delta_log_odds > 0 ? '+' : ''}{ev.delta_log_odds.toFixed(2)} LO
        </span>
      </div>
      <p className="text-xs text-secondary-foreground leading-relaxed">{ev.summary}</p>
      <div className="flex gap-3 mt-2 font-mono text-[10px] text-muted-foreground">
        <span>Cred {ev.credibility.toFixed(2)}</span>
        <span>Decay {ev.recency.toFixed(2)}</span>
        <span>Cons {ev.consensus.toFixed(2)}</span>
        <span>Match {ev.criteria_match.toFixed(2)}</span>
        <span className="text-gold-solid font-semibold">E={ev.composite.toFixed(3)}</span>
      </div>
    </div>
  );
}

export function MilestoneModal({ milestone, open, onClose }: MilestoneModalProps) {
  if (!milestone) return null;
  const { isWonder } = useMode();

  const delta = milestone.posterior - milestone.prior;
  const isPositive = delta >= 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-w-3xl max-h-[85vh] overflow-y-auto p-0"
        style={{
          border: '1px solid hsla(220, 10%, 72%, 0.12)',
          boxShadow: '0 0 60px -20px hsla(228, 20%, 5%, 0.8), 0 0 30px -10px hsla(43, 96%, 56%, 0.06)',
        }}
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-chrome/10">
          <div className="flex items-center gap-2 mb-2">
            <DomainBadge domain={milestone.domain} />
            <StatusBadge status={milestone.status} />
          </div>
          <DialogTitle className={`font-display text-xl font-bold flex items-center gap-3 ${
            isWonder ? 'text-gold' : 'text-foreground'
          }`}>
            {milestone.title}
            <ProbabilityRing
              value={milestone.posterior}
              size={48}
              strokeWidth={4}
              domainColor={domainHsl[milestone.domain]}
              useGold={true}
            />
          </DialogTitle>
          <div className="flex items-center gap-4 mt-2 font-mono text-xs text-muted-foreground">
            <span>Target: {milestone.year}</span>
            <span>Tier: {milestone.tier}</span>
            <span className={`${milestone.magnitude >= 9 ? 'text-gold-solid' : ''}`}>
              Magnitude: {milestone.magnitude}/10
            </span>
            <span className={`flex items-center gap-1 ${isPositive ? 'text-gold-solid' : 'text-red-400'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              Δ {isFinite(milestone.delta_log_odds) ? milestone.delta_log_odds.toFixed(2) : '∞'} log-odds
            </span>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="p-6 pt-4">
          <TabsList className="glass-chrome border border-chrome/15 mb-4">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary">Overview</TabsTrigger>
            <TabsTrigger value="why" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold-solid">Why It Changed</TabsTrigger>
            <TabsTrigger value="evidence" className="data-[state=active]:bg-primary/12 data-[state=active]:text-primary">Evidence ({milestone.evidence.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <p className="text-sm text-secondary-foreground leading-relaxed">{milestone.description}</p>
            <div className="glass-chrome rounded-lg p-4 border border-primary/15">
              <h4 className="text-xs uppercase tracking-wider text-primary mb-2 font-semibold">Success Criteria</h4>
              <p className="text-sm text-foreground">{milestone.success_criteria}</p>
            </div>
            <div className="glass-chrome rounded-lg p-4 border border-destructive/15">
              <h4 className="text-xs uppercase tracking-wider text-destructive mb-2 font-semibold">Falsification Condition</h4>
              <p className="text-sm text-foreground">{milestone.falsification}</p>
            </div>
            {/* Belief trajectory */}
            <div className="glass-chrome rounded-lg p-4">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">Belief Trajectory</h4>
              <div className="relative h-7 bg-muted/20 rounded-full overflow-hidden border border-chrome/10">
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.25), hsla(43, 96%, 56%, 0.1))',
                  }}
                  initial={{ width: `${milestone.prior * 100}%` }}
                  animate={{ width: `${milestone.posterior * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-chrome/30"
                  style={{ left: `${milestone.prior * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 font-mono text-[10px] text-muted-foreground">
                <span>Prior: {(milestone.prior * 100).toFixed(1)}%</span>
                <span className="text-gold-solid">Posterior: {(milestone.posterior * 100).toFixed(1)}%</span>
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
