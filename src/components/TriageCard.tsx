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

// Metallic gold arrow style for positive deltas
const goldArrowStyle = {
  color: 'hsl(43, 96%, 56%)',
  filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.5)) drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.8))',
};

// Chrome bevel box-shadow for structural glass
const chromeBevel = [
  'inset 0 1px 0 hsla(220, 10%, 90%, 0.08)',
  'inset 0 -1px 0 hsla(230, 25%, 3%, 0.5)',
  '0 4px 24px -8px hsla(230, 25%, 3%, 0.7)',
  '0 1px 2px hsla(230, 25%, 3%, 0.4)',
].join(', ');

const goldBevel = [
  'inset 0 1px 0 hsla(48, 100%, 80%, 0.12)',
  'inset 0 -1px 0 hsla(230, 25%, 3%, 0.5)',
  '0 0 40px -12px hsla(43, 96%, 56%, 0.15)',
  '0 4px 24px -8px hsla(230, 25%, 3%, 0.6)',
  '0 1px 2px hsla(230, 25%, 3%, 0.4)',
].join(', ');

export function TriageCard({ milestone, index, onClick }: TriageCardProps) {
  const { isWonder } = useMode();
  const delta = milestone.posterior - milestone.prior;
  const isPositive = delta >= 0;
  const isTopItem = index < 3;
  const isHighMag = milestone.magnitude >= 9;

  if (isWonder) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={onClick}
        className="w-full rounded-2xl p-5 text-left group transition-all duration-300 shine-sweep"
        style={{
          background: isTopItem
            ? 'linear-gradient(168deg, hsla(230, 22%, 9%, 0.75), hsla(230, 18%, 6%, 0.65))'
            : 'linear-gradient(168deg, hsla(230, 22%, 9%, 0.75), hsla(230, 18%, 6%, 0.65))',
          border: `1px solid ${isTopItem ? 'hsla(43, 96%, 56%, 0.22)' : 'hsla(220, 10%, 72%, 0.12)'}`,
          backdropFilter: 'blur(24px)',
          boxShadow: isTopItem ? goldBevel : chromeBevel,
        }}
        whileHover={{ scale: 1.008, y: -2 }}
      >
        {/* Top chrome highlight line */}
        <div
          className="absolute top-0 left-4 right-4 h-px rounded-full"
          style={{
            background: isTopItem
              ? 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.2), hsla(48, 100%, 80%, 0.12), transparent)'
              : 'linear-gradient(90deg, transparent, hsla(220, 10%, 85%, 0.08), transparent)',
          }}
        />

        <div className="flex items-center gap-5">
          <div className="w-8 text-center">
            <span
              className={`font-mono text-sm font-bold ${isTopItem ? '' : 'text-chrome'}`}
              style={isTopItem ? {
                background: 'linear-gradient(135deg, hsl(40, 90%, 38%), hsl(43, 96%, 56%), hsl(48, 100%, 72%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.8))',
              } : undefined}
            >
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
              <div
                className="font-mono text-sm font-bold"
                style={isHighMag ? {
                  background: 'linear-gradient(135deg, hsl(40, 90%, 42%), hsl(43, 96%, 56%), hsl(48, 100%, 67%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: undefined,
                  filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.3))',
                } : { color: 'hsl(var(--foreground))' }}
              >
                {milestone.magnitude}/10
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Δ Log-Odds</div>
              <div className="font-mono text-sm flex items-center gap-1 justify-end">
                {isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" style={goldArrowStyle} />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-400" />
                )}
                <span style={isPositive ? {
                  background: 'linear-gradient(135deg, hsl(40, 90%, 42%), hsl(48, 100%, 67%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } : { color: 'hsl(0, 72%, 55%)' }}>
                  {isFinite(milestone.delta_log_odds) ? (isPositive ? '+' : '') + milestone.delta_log_odds.toFixed(2) : '∞'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Triage</div>
              <div
                className="font-mono text-sm font-bold"
                style={isTopItem ? {
                  background: 'linear-gradient(135deg, hsl(40, 90%, 42%), hsl(43, 96%, 56%), hsl(48, 100%, 67%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
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

  // Analyst mode — dense, with chrome bevels
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.015, duration: 0.12 }}
      onClick={onClick}
      className="w-full rounded-xl p-3 transition-all duration-150 text-left chrome-sweep relative"
      style={{
        background: 'linear-gradient(168deg, hsla(230, 22%, 9%, 0.75), hsla(230, 18%, 6%, 0.65))',
        border: `1px solid ${isTopItem ? 'hsla(43, 96%, 56%, 0.18)' : 'hsla(220, 10%, 72%, 0.1)'}`,
        backdropFilter: 'blur(24px)',
        boxShadow: isTopItem
          ? 'inset 0 1px 0 hsla(48, 100%, 80%, 0.06), inset 0 -1px 0 hsla(230, 25%, 3%, 0.4), 0 2px 8px -4px hsla(230, 25%, 3%, 0.5)'
          : 'inset 0 1px 0 hsla(220, 10%, 85%, 0.05), inset 0 -1px 0 hsla(230, 25%, 3%, 0.4), 0 2px 8px -4px hsla(230, 25%, 3%, 0.5)',
      }}
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
            <div className={`font-mono text-xs ${isHighMag ? 'text-gold-solid font-bold' : 'text-foreground'}`}>{milestone.magnitude}/10</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Δ LO</div>
            <div className={`font-mono text-xs flex items-center gap-0.5 justify-end ${
              isPositive ? 'text-gold-solid' : 'text-red-400'
            }`}>
              {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" style={{ filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.4))' }} /> : <ArrowDownRight className="w-2.5 h-2.5" />}
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
