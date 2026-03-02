import { Milestone } from '@/data/milestones';
import { domainColorClass } from '@/lib/domain-styles';
import { DomainBadge, StatusBadge, ArchetypeBadge } from '@/components/Badges';
import { ProbabilityRing } from '@/components/ProbabilityRing';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { glassPanelGold, glassPanel, glassPanelChrome, specularReflection, goldChromeLine } from '@/lib/glass-styles';

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
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

const wonderDescriptions: Record<string, string> = {
  agi: "Imagine a computer that can think about anything as well as you can — that's AGI! 🧠",
  fusion: "What if we could make a tiny sun on Earth for unlimited clean energy? ☀️",
  bci: "Brain-computer links that let you type by thinking — like telepathy, but real! 🔮",
  quantum: "A computer using quantum physics magic to solve impossible puzzles instantly ⚡",
  satnet: "Internet everywhere on Earth, even in the middle of the ocean! 🌍",
  nanofab: "Tiny robots that build anything atom by atom — like 3D printing but molecular 🔬",
  longevity: "What if science could slow down aging so people stay healthy way longer? 🧬",
  'autonomous-fleet': "Self-driving cars everywhere, no steering wheel needed! 🚗",
  'solid-state-battery': "Next-gen batteries that charge faster and never catch fire 🔋",
};

export function TriageCard({ milestone, index, onClick }: TriageCardProps) {
  const { isWonder } = useMode();
  const [isFlipped, setIsFlipped] = useState(false);
  const delta = milestone.posterior - milestone.prior;
  const isPositive = delta >= 0;
  const isTopItem = index < 3;
  const isHighMag = milestone.magnitude >= 9;

  if (isWonder) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, rotateX: -5 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: index * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="perspective-1000"
      >
        <motion.button
          onClick={onClick}
          onHoverStart={() => setIsFlipped(true)}
          onHoverEnd={() => setIsFlipped(false)}
          className="w-full rounded-2xl text-left group relative"
          style={{ transformStyle: 'preserve-3d' }}
          whileHover={{ scale: 1.012, y: -3 }}
          whileTap={{ scale: 0.998 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <motion.div
            className="w-full rounded-2xl p-5 relative overflow-hidden shine-sweep"
            animate={{
              rotateY: isFlipped ? 3 : 0,
              rotateX: isFlipped ? -2 : 0,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={isTopItem ? glassPanelGold : glassPanel}
          >
            {/* Specular top reflection */}
            <div className="absolute top-0 left-0 right-0 h-[45%] rounded-t-2xl" style={specularReflection} />

            {/* Gold shimmer line for top items */}
            {isTopItem && (
              <motion.div
                className="absolute top-0 left-4 right-4 h-px"
                style={goldChromeLine}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            )}

            {/* Celebration particles */}
            {isPositive && delta > 0.1 && (
              <motion.div
                className="absolute top-3 right-3"
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-4 h-4 opacity-40" style={{
                  color: 'hsl(43, 96%, 56%)',
                  filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.5))',
                }} />
              </motion.div>
            )}

            <div className="flex items-start gap-5 relative z-10">
              {/* Rank badge */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold tabular-nums"
                  style={isTopItem ? {
                    background: 'linear-gradient(145deg, hsl(38, 88%, 32%), hsl(43, 96%, 48%), hsl(48, 100%, 72%))',
                    color: 'hsl(232, 30%, 2%)',
                    boxShadow: '0 2px 12px -2px hsla(43, 96%, 56%, 0.5), inset 0 1px 0 hsla(48, 100%, 85%, 0.4), inset 0 -1px 0 hsla(38, 88%, 28%, 0.45)',
                  } : {
                    background: 'linear-gradient(168deg, rgba(14, 17, 38, 0.6), rgba(10, 13, 32, 0.5))',
                    border: '1px solid hsla(220, 12%, 70%, 0.16)',
                    color: 'hsl(220, 14%, 70%)',
                    boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.07), inset 0 -1px 0 hsla(232, 30%, 2%, 0.35)',
                  }}
                >
                  {index + 1}
                </div>
              </div>

              <ProbabilityRing
                value={milestone.posterior}
                size={64}
                strokeWidth={5}
                domainColor={domainHsl[milestone.domain]}
                useGold={isTopItem}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <DomainBadge domain={milestone.domain} />
                  <StatusBadge status={milestone.status} />
                  <ArchetypeBadge archetype={milestone.archetype} />
                </div>
                <h3 className={`font-display font-bold text-base leading-tight mb-1 ${isTopItem ? 'text-gold' : domainColorClass[milestone.domain]}`}>
                  {milestone.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {wonderDescriptions[milestone.id] || milestone.description}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                <div className="font-mono text-xs tabular-nums" style={{
                  color: 'hsl(43, 82%, 60%)',
                  textShadow: '0 0 8px hsla(43, 96%, 56%, 0.2)',
                }}>{milestone.year}</div>
                <div
                  className="font-mono text-xs font-bold tabular-nums"
                  style={isHighMag ? {
                    ...goldGradientStyle,
                    filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.35))',
                  } : { color: 'hsl(var(--foreground))' }}
                >
                  {milestone.magnitude}/10
                </div>
                <div className="font-mono text-xs flex items-center gap-0.5 tabular-nums">
                  {isPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5" style={{
                      color: 'hsl(43, 96%, 56%)',
                      filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.6))',
                    }} />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" style={{ color: 'hsl(0, 72%, 58%)', filter: 'drop-shadow(0 0 4px hsla(0, 72%, 55%, 0.4))' }} />
                  )}
                  <span style={isPositive ? { ...goldGradientStyle, filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.25))' } : { color: 'hsl(0, 72%, 58%)', textShadow: '0 0 6px hsla(0, 72%, 55%, 0.25)' }}>
                    {isFinite(milestone.delta_log_odds) ? (isPositive ? '+' : '') + milestone.delta_log_odds.toFixed(2) : '∞'}
                  </span>
                </div>
                <div
                  className="font-mono text-lg font-bold tabular-nums"
                  style={isTopItem ? {
                    ...goldGradientStyle,
                    filter: 'drop-shadow(0 0 10px hsla(43, 96%, 56%, 0.45)) drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.7))',
                  } : { color: 'hsl(var(--primary))' }}
                >
                  {milestone.triageScore}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.button>
      </motion.div>
    );
  }

  // ═══ ANALYST MODE: Bloomberg-terminal ultra-dense ═══
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.008, duration: 0.08 }}
      onClick={onClick}
      className="w-full rounded-md px-2.5 py-1.5 transition-all duration-100 text-left chrome-sweep relative group"
      style={{
        ...(isTopItem ? glassPanelGold : glassPanelChrome),
        // Override for analyst density — lighter glass
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      whileHover={{
        backgroundColor: 'hsla(232, 26%, 8%, 0.7)',
      }}
    >
      {/* Left edge hover indicator */}
      <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{
          background: isTopItem
            ? 'linear-gradient(180deg, hsla(43, 96%, 56%, 0.7), hsla(43, 96%, 56%, 0.15))'
            : 'linear-gradient(180deg, hsla(192, 100%, 52%, 0.5), hsla(192, 100%, 52%, 0.1))',
          boxShadow: isTopItem
            ? '0 0 8px hsla(43, 96%, 56%, 0.3)'
            : '0 0 6px hsla(192, 100%, 52%, 0.2)',
        }}
      />

      <div className="flex items-center gap-2.5">
        <div className="w-5 text-center">
          <span className={`font-mono text-[10px] tabular-nums ${isTopItem ? 'font-bold' : 'text-muted-foreground'}`}
            style={isTopItem ? {
              color: 'hsl(43, 96%, 56%)',
              textShadow: '0 0 6px hsla(43, 96%, 56%, 0.3)',
            } : {}}
          >
            {index + 1}
          </span>
        </div>

        <ProbabilityRing
          value={milestone.posterior}
          size={30}
          strokeWidth={2.5}
          domainColor={domainHsl[milestone.domain]}
          useGold={isTopItem}
        />

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <DomainBadge domain={milestone.domain} />
            <ArchetypeBadge archetype={milestone.archetype} />
          </div>
          <h3 className={`font-mono font-medium text-[12px] truncate ${isTopItem ? 'text-foreground' : 'text-secondary-foreground'}`}>
            {milestone.title}
          </h3>
        </div>

        <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
          <div className="w-8 text-right tabular-nums" style={{
            color: 'hsl(43, 82%, 60%)',
            textShadow: '0 0 6px hsla(43, 96%, 56%, 0.15)',
          }}>{milestone.year}</div>
          <div
            className={`w-7 text-right tabular-nums ${isHighMag ? 'font-bold' : ''}`}
            style={isHighMag ? {
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.25))',
            } : {
              background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 78%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {milestone.magnitude}
          </div>
          <div className="w-14 text-right flex items-center gap-0.5 justify-end tabular-nums">
            {isPositive
              ? <ArrowUpRight className="w-2.5 h-2.5" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.5))' }} />
              : <ArrowDownRight className="w-2.5 h-2.5" style={{ color: 'hsl(0, 72%, 58%)', filter: 'drop-shadow(0 0 3px hsla(0, 72%, 55%, 0.3))' }} />
            }
            <span style={isPositive ? { ...goldGradientStyle, filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.2))' } : { color: 'hsl(0, 72%, 58%)', textShadow: '0 0 4px hsla(0, 72%, 55%, 0.2)' }}>
              {isFinite(milestone.delta_log_odds) ? (isPositive ? '+' : '') + milestone.delta_log_odds.toFixed(2) : '∞'}
            </span>
          </div>
          <div
            className="font-bold w-8 text-right tabular-nums"
            style={isTopItem ? {
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 5px hsla(43, 96%, 56%, 0.3))',
            } : { color: 'hsl(var(--primary))' }}
          >
            {milestone.triageScore}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
