import { Milestone } from '@/data/milestones';
import { domainColorClass } from '@/lib/domain-styles';
import { DomainBadge, StatusBadge, ArchetypeBadge } from '@/components/Badges';
import { ProbabilityRing } from '@/components/ProbabilityRing';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const domainHsl: Record<string, string> = {
  compute: 'hsl(192, 100%, 52%)',
  energy: 'hsl(36, 100%, 56%)',
  connectivity: 'hsl(268, 90%, 68%)',
  manufacturing: 'hsl(342, 82%, 62%)',
  biology: 'hsl(155, 82%, 48%)',
};

interface TriageCardProps {
  milestone: Milestone;
  index: number;
  onClick: () => void;
}

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 38%), hsl(43, 96%, 56%), hsl(48, 100%, 72%))',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

export function TriageCard({ milestone, index, onClick }: TriageCardProps) {
  const { isWonder } = useMode();
  const delta = milestone.posterior - milestone.prior;
  const isPositive = delta >= 0;
  const isTopItem = index < 3;
  const isHighMag = milestone.magnitude >= 9;

  if (isWonder) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={onClick}
        className="w-full rounded-xl p-4 text-left group transition-all duration-300 shine-sweep relative"
        style={{
          background: 'linear-gradient(168deg, hsla(232, 26%, 8%, 0.78), hsla(232, 22%, 5%, 0.68))',
          border: `1px solid ${isTopItem ? 'hsla(43, 96%, 56%, 0.22)' : 'hsla(220, 12%, 70%, 0.1)'}`,
          backdropFilter: 'blur(24px)',
          boxShadow: isTopItem
            ? 'inset 0 1px 0 hsla(48, 100%, 80%, 0.1), inset 0 -1px 0 hsla(232, 30%, 2%, 0.5), 0 0 32px -12px hsla(43, 96%, 56%, 0.12), 0 4px 20px -8px hsla(232, 30%, 2%, 0.6)'
            : 'inset 0 1px 0 hsla(220, 14%, 88%, 0.06), inset 0 -1px 0 hsla(232, 30%, 2%, 0.5), 0 4px 20px -8px hsla(232, 30%, 2%, 0.6)',
        }}
        whileHover={{ scale: 1.005, y: -1 }}
      >
        {/* Top highlight line */}
        {isTopItem && (
          <div className="absolute top-0 left-4 right-4 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.2), hsla(48, 100%, 80%, 0.1), transparent)',
          }} />
        )}

        <div className="flex items-center gap-4">
          {/* Rank */}
          <div className="w-7 text-center">
            <span
              className="font-mono text-xs font-bold"
              style={isTopItem ? goldGradientStyle : { color: 'hsl(var(--chrome))' }}
            >
              #{index + 1}
            </span>
          </div>

          {/* Probability ring */}
          <ProbabilityRing
            value={milestone.posterior}
            size={56}
            strokeWidth={4.5}
            domainColor={domainHsl[milestone.domain]}
            useGold={isTopItem}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <DomainBadge domain={milestone.domain} />
              <StatusBadge status={milestone.status} />
              <ArchetypeBadge archetype={milestone.archetype} />
            </div>
            <h3 className={`font-display font-bold text-sm leading-tight ${isTopItem ? 'text-gold' : domainColorClass[milestone.domain]}`}>
              {milestone.title}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{milestone.description}</p>
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right w-14">
              <div className="font-mono text-xs text-gold-num">{milestone.year}</div>
            </div>
            <div className="text-right w-12">
              <div
                className="font-mono text-xs font-bold"
                style={isHighMag ? {
                  ...goldGradientStyle,
                  filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.25))',
                } : { color: 'hsl(var(--foreground))' }}
              >
                {milestone.magnitude}/10
              </div>
            </div>
            <div className="text-right w-16">
              <div className="font-mono text-xs flex items-center gap-0.5 justify-end">
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3" style={{
                    color: 'hsl(43, 96%, 56%)',
                    filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.5))',
                  }} />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-400" />
                )}
                <span style={isPositive ? goldGradientStyle : { color: 'hsl(0, 72%, 55%)' }}>
                  {isFinite(milestone.delta_log_odds) ? (isPositive ? '+' : '') + milestone.delta_log_odds.toFixed(2) : '∞'}
                </span>
              </div>
            </div>
            <div className="text-right w-12">
              <div
                className="font-mono text-sm font-bold"
                style={isTopItem ? {
                  ...goldGradientStyle,
                  filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.3))',
                } : { color: 'hsl(var(--primary))' }}
              >
                {milestone.triageScore}
              </div>
            </div>
          </div>
        </div>
      </motion.button>
    );
  }

  // Analyst mode — ultra-dense, chrome bevels
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.012, duration: 0.1 }}
      onClick={onClick}
      className="w-full rounded-lg px-3 py-2 transition-all duration-150 text-left chrome-sweep relative"
      style={{
        background: isTopItem
          ? 'linear-gradient(168deg, hsla(232, 26%, 8%, 0.8), hsla(232, 22%, 5%, 0.7))'
          : 'hsla(232, 26%, 6%, 0.5)',
        border: `1px solid ${isTopItem ? 'hsla(43, 96%, 56%, 0.15)' : 'hsla(220, 12%, 70%, 0.06)'}`,
        boxShadow: isTopItem
          ? 'inset 0 1px 0 hsla(48, 100%, 80%, 0.05), inset 0 -1px 0 hsla(232, 30%, 2%, 0.4)'
          : 'inset 0 1px 0 hsla(220, 14%, 88%, 0.03)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-5 text-center">
          <span className={`font-mono text-[10px] ${isTopItem ? 'text-gold-solid font-bold' : 'text-muted-foreground'}`}>
            {index + 1}
          </span>
        </div>

        <ProbabilityRing
          value={milestone.posterior}
          size={36}
          strokeWidth={3}
          domainColor={domainHsl[milestone.domain]}
          useGold={isTopItem}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <DomainBadge domain={milestone.domain} />
            <StatusBadge status={milestone.status} />
            <ArchetypeBadge archetype={milestone.archetype} />
          </div>
          <h3 className={`font-display font-semibold text-[13px] truncate ${domainColorClass[milestone.domain]}`}>
            {milestone.title}
          </h3>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="font-mono text-[11px] text-gold-num w-10 text-right">{milestone.year}</div>
          <div className={`font-mono text-[11px] w-10 text-right ${isHighMag ? 'text-gold-solid font-bold' : 'text-foreground'}`}>
            {milestone.magnitude}/10
          </div>
          <div className={`font-mono text-[11px] w-14 text-right flex items-center gap-0.5 justify-end ${
            isPositive ? 'text-gold-solid' : 'text-red-400'
          }`}>
            {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" style={{ filter: 'drop-shadow(0 0 2px hsla(43, 96%, 56%, 0.4))' }} /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {isFinite(milestone.delta_log_odds) ? (isPositive ? '+' : '') + milestone.delta_log_odds.toFixed(2) : '∞'}
          </div>
          <div className={`font-mono text-[11px] font-bold w-10 text-right ${isTopItem ? 'text-gold-solid' : 'text-primary'}`}>
            {milestone.triageScore}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
