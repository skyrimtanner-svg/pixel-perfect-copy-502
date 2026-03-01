import { Milestone } from '@/data/milestones';
import { domainColorClass, domainGlowClass } from '@/lib/domain-styles';
import { DomainBadge, StatusBadge } from '@/components/Badges';
import { ProbabilityRing } from '@/components/ProbabilityRing';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const domainHsl: Record<string, string> = {
  compute: 'hsl(190, 90%, 50%)',
  energy: 'hsl(38, 92%, 55%)',
  connectivity: 'hsl(270, 80%, 65%)',
  manufacturing: 'hsl(152, 70%, 48%)',
  biology: 'hsl(340, 75%, 60%)',
};

interface TriageCardProps {
  milestone: Milestone;
  index: number;
  onClick: () => void;
}

export function TriageCard({ milestone, index, onClick }: TriageCardProps) {
  const delta = milestone.posterior - milestone.prior;
  const isPositive = delta >= 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className={`w-full glass rounded-xl p-4 hover:bg-accent/30 transition-all duration-200 text-left group ${domainGlowClass[milestone.domain]} hover:scale-[1.005]`}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className="w-8 text-center">
          <span className="font-mono text-xs text-muted-foreground">#{index + 1}</span>
        </div>

        {/* Probability ring */}
        <ProbabilityRing
          value={milestone.posterior}
          size={52}
          strokeWidth={4}
          domainColor={domainHsl[milestone.domain]}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <DomainBadge domain={milestone.domain} />
            <StatusBadge status={milestone.status} />
          </div>
          <h3 className={`font-display font-semibold text-sm truncate ${domainColorClass[milestone.domain]} group-hover:brightness-110`}>
            {milestone.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{milestone.description}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Target</div>
            <div className="font-mono text-sm text-foreground">{milestone.year}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Magnitude</div>
            <div className="font-mono text-sm text-foreground">{milestone.magnitude}/10</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Δ Log-Odds</div>
            <div className={`font-mono text-sm flex items-center gap-1 justify-end ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {isFinite(milestone.delta_log_odds) ? (isPositive ? '+' : '') + milestone.delta_log_odds.toFixed(2) : '∞'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Triage</div>
            <div className="font-mono text-sm font-bold text-primary">{milestone.triageScore}</div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
