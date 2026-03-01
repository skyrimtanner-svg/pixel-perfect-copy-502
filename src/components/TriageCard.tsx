import { Milestone } from '@/data/milestones';
import { domainColorClass } from '@/lib/domain-styles';
import { DomainBadge, StatusBadge, ArchetypeBadge } from '@/components/Badges';
import { ProbabilityRing } from '@/components/ProbabilityRing';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const domainHsl: Record<string, string> = {
  compute: 'hsl(190, 100%, 50%)',
  energy: 'hsl(38, 100%, 58%)',
  connectivity: 'hsl(270, 90%, 68%)',
  manufacturing: 'hsl(340, 80%, 62%)',
  biology: 'hsl(152, 80%, 50%)',
};

interface TriageCardProps {
  milestone: Milestone;
  index: number;
  onClick: () => void;
}

export function TriageCard({ milestone, index, onClick }: TriageCardProps) {
  const { isWonder } = useMode();
  const delta = milestone.posterior - milestone.prior;
  const isPositive = delta >= 0;
  const isTopItem = index < 3;

  if (isWonder) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={onClick}
        className={`w-full rounded-2xl p-5 text-left group transition-all duration-300 shine-sweep ${
          isTopItem ? 'glass-gold' : 'glass-chrome'
        }`}
        whileHover={{ scale: 1.008, y: -2 }}
      >
        <div className="flex items-center gap-5">
          <div className="w-8 text-center">
            <span className={`font-mono text-sm font-bold ${isTopItem ? 'text-gold' : 'text-chrome'}`}>
              #{index + 1}
            </span>
          </div>

          <ProbabilityRing
            value={milestone.posterior}
            size={60}
            strokeWidth={5}
            domainColor={domainHsl[milestone.domain]}
            useGold={isTopItem}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <DomainBadge domain={milestone.domain} />
              <StatusBadge status={milestone.status} />
              <ArchetypeBadge archetype={milestone.archetype} />
            </div>
            <h3 className={`font-display font-bold text-base ${isTopItem ? 'text-gold' : domainColorClass[milestone.domain]}`}>
              {milestone.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{milestone.description}</p>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Target</div>
              <div className="font-mono text-sm text-gold-num">{milestone.year}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Magnitude</div>
              <div className={`font-mono text-sm ${milestone.magnitude >= 9 ? 'text-gold-num' : 'text-foreground'}`}>
                {milestone.magnitude}/10
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Δ Log-Odds</div>
              <div className={`font-mono text-sm flex items-center gap-1 justify-end ${
                isPositive ? 'text-gold-solid' : 'text-red-400'
              }`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isFinite(milestone.delta_log_odds) ? (isPositive ? '+' : '') + milestone.delta_log_odds.toFixed(2) : '∞'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Triage</div>
              <div className={`font-mono text-sm font-bold ${isTopItem ? 'text-gold' : 'text-primary'}`}>
                {milestone.triageScore}
              </div>
            </div>
          </div>
        </div>
      </motion.button>
    );
  }

  // Analyst mode — dense, minimal
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.015, duration: 0.12 }}
      onClick={onClick}
      className={`w-full glass-chrome rounded-xl p-3 hover:bg-accent/20 transition-all duration-150 text-left chrome-sweep ${
        isTopItem ? 'border-gold/20' : ''
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-6 text-center">
          <span className={`font-mono text-[11px] ${isTopItem ? 'text-gold-solid font-bold' : 'text-muted-foreground'}`}>
            #{index + 1}
          </span>
        </div>

        <ProbabilityRing
          value={milestone.posterior}
          size={42}
          strokeWidth={3}
          domainColor={domainHsl[milestone.domain]}
          useGold={isTopItem}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <DomainBadge domain={milestone.domain} />
            <StatusBadge status={milestone.status} />
            <ArchetypeBadge archetype={milestone.archetype} />
          </div>
          <h3 className={`font-display font-semibold text-sm truncate ${domainColorClass[milestone.domain]}`}>
            {milestone.title}
          </h3>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Target</div>
            <div className="font-mono text-xs text-gold-num">{milestone.year}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Mag</div>
            <div className="font-mono text-xs text-foreground">{milestone.magnitude}/10</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Δ LO</div>
            <div className={`font-mono text-xs flex items-center gap-0.5 justify-end ${
              isPositive ? 'text-gold-solid' : 'text-red-400'
            }`}>
              {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {isFinite(milestone.delta_log_odds) ? (isPositive ? '+' : '') + milestone.delta_log_odds.toFixed(2) : '∞'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Triage</div>
            <div className={`font-mono text-xs font-bold ${isTopItem ? 'text-gold-solid' : 'text-primary'}`}>
              {milestone.triageScore}
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
