import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Milestone, Evidence, statusLabels } from '@/data/milestones';
import { DomainBadge, StatusBadge } from '@/components/Badges';
import { ProbabilityRing } from '@/components/ProbabilityRing';
import { WaterfallChart } from '@/components/WaterfallChart';
import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const domainHsl: Record<string, string> = {
  compute: 'hsl(190, 90%, 50%)',
  energy: 'hsl(38, 92%, 55%)',
  connectivity: 'hsl(270, 80%, 65%)',
  manufacturing: 'hsl(152, 70%, 48%)',
  biology: 'hsl(340, 75%, 60%)',
};

interface MilestoneModalProps {
  milestone: Milestone | null;
  open: boolean;
  onClose: () => void;
}

function EvidenceRow({ ev }: { ev: Evidence }) {
  const dirIcon = ev.direction === 'supports' ? '↑' : ev.direction === 'contradicts' ? '↓' : '~';
  const dirColor = ev.direction === 'supports' ? 'text-green-400' : ev.direction === 'contradicts' ? 'text-red-400' : 'text-muted-foreground';
  const dirBg = ev.direction === 'supports' ? 'bg-supports/10 border-green-400/20' : ev.direction === 'contradicts' ? 'bg-contradicts/10 border-red-400/20' : 'bg-muted/20 border-border/50';

  return (
    <div className={`glass rounded-lg p-3 border ${dirBg}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold text-lg ${dirColor}`}>{dirIcon}</span>
          <div>
            <p className="text-sm font-medium text-foreground">{ev.source}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{ev.type.replace('_', ' ')} • {ev.date}</p>
          </div>
        </div>
        <span className={`font-mono text-xs ${dirColor}`}>
          {ev.delta_log_odds > 0 ? '+' : ''}{ev.delta_log_odds.toFixed(2)} log-odds
        </span>
      </div>
      <p className="text-xs text-secondary-foreground leading-relaxed">{ev.summary}</p>
      <div className="flex gap-3 mt-2 font-mono text-[10px] text-muted-foreground">
        <span>Cred {ev.credibility.toFixed(2)}</span>
        <span>Decay {ev.recency.toFixed(2)}</span>
        <span>Cons {ev.consensus.toFixed(2)}</span>
        <span>Match {ev.criteria_match.toFixed(2)}</span>
        <span className="text-foreground font-semibold">E={ev.composite.toFixed(3)}</span>
      </div>
    </div>
  );
}

export function MilestoneModal({ milestone, open, onClose }: MilestoneModalProps) {
  if (!milestone) return null;

  const delta = milestone.posterior - milestone.prior;
  const isPositive = delta >= 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-w-3xl max-h-[85vh] overflow-y-auto border-border/50 p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <DomainBadge domain={milestone.domain} />
            <StatusBadge status={milestone.status} />
          </div>
          <DialogTitle className="font-display text-xl font-bold text-foreground flex items-center gap-3">
            {milestone.title}
            <ProbabilityRing
              value={milestone.posterior}
              size={48}
              strokeWidth={4}
              domainColor={domainHsl[milestone.domain]}
            />
          </DialogTitle>
          <div className="flex items-center gap-4 mt-2 font-mono text-xs text-muted-foreground">
            <span>Target: {milestone.year}</span>
            <span>Tier: {milestone.tier}</span>
            <span>Magnitude: {milestone.magnitude}/10</span>
            <span className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              Δ {isFinite(milestone.delta_log_odds) ? milestone.delta_log_odds.toFixed(2) : '∞'} log-odds
            </span>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="p-6 pt-4">
          <TabsList className="glass border border-border/50 mb-4">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Overview</TabsTrigger>
            <TabsTrigger value="why" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Why It Changed</TabsTrigger>
            <TabsTrigger value="evidence" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Evidence ({milestone.evidence.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <p className="text-sm text-secondary-foreground leading-relaxed">{milestone.description}</p>
            <div className="glass rounded-lg p-4 border border-primary/20">
              <h4 className="text-xs uppercase tracking-wider text-primary mb-2 font-semibold">Success Criteria</h4>
              <p className="text-sm text-foreground">{milestone.success_criteria}</p>
            </div>
            <div className="glass rounded-lg p-4 border border-destructive/20">
              <h4 className="text-xs uppercase tracking-wider text-destructive mb-2 font-semibold">Falsification Condition</h4>
              <p className="text-sm text-foreground">{milestone.falsification}</p>
            </div>
            {/* Belief trajectory */}
            <div className="glass rounded-lg p-4">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">Belief Trajectory</h4>
              <div className="relative h-6 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-primary/30 rounded-full"
                  initial={{ width: `${milestone.prior * 100}%` }}
                  animate={{ width: `${milestone.posterior * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
                {/* Prior marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-muted-foreground/50"
                  style={{ left: `${milestone.prior * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 font-mono text-[10px] text-muted-foreground">
                <span>Prior: {(milestone.prior * 100).toFixed(1)}%</span>
                <span>Posterior: {(milestone.posterior * 100).toFixed(1)}%</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="why">
            <h4 className="text-sm font-semibold text-foreground mb-4 font-display">Interactive Waterfall — What moved the probability?</h4>
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
