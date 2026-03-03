import { archetypeConfig } from '@/data/milestones';
import type { Milestone } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { glassPanelGold, specularReflection, goldChromeLine } from '@/lib/glass-styles';

const goldGradientText = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

const chromeGradientText = {
  background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 78%), hsl(220, 16%, 94%), hsl(220, 14%, 82%), hsl(220, 10%, 58%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

interface TriageStripProps {
  milestones: Milestone[];
}

export function TriageStrip({ milestones }: TriageStripProps) {
  const { isWonder } = useMode();
  const sorted = [...milestones].sort((a, b) => b.triageScore - a.triageScore);
  
  const breakthroughs = sorted.filter(m => m.archetype === 'breakthrough' && m.delta_log_odds > 0).slice(0, 3);
  const bottlenecks = sorted.filter(m => m.archetype === 'bottleneck').slice(0, 2);

  if (breakthroughs.length === 0 && bottlenecks.length === 0) return null;

  return (
    <div
      className="rounded-xl p-2.5 mb-5 relative overflow-hidden"
      style={glassPanelGold}
    >
      <div className="absolute top-0 left-4 right-4 h-px" style={goldChromeLine} />
      <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-xl" style={specularReflection} />

      <div className="flex items-center gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <TrendingUp className="w-3 h-3" style={{
            color: 'hsl(43, 96%, 56%)',
            filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.6)) drop-shadow(0 0 3px hsla(190, 100%, 50%, 0.3))',
          }} />
          <span
            className="text-[9px] uppercase tracking-[0.15em] font-mono font-semibold"
            style={goldGradientText}
          >
            {isWonder ? 'SIGNAL STRIP' : 'TRIAGE STRIP'}
          </span>
        </div>

        <div className="w-px h-4 shrink-0" style={{
          background: 'linear-gradient(180deg, hsla(43, 96%, 56%, 0.15), hsla(220, 12%, 70%, 0.08), transparent)',
        }} />

        {breakthroughs.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0 shine-sweep relative overflow-hidden group"
            style={{
              background: 'linear-gradient(145deg, hsla(155, 82%, 48%, 0.14), rgba(8, 10, 28, 0.82))',
              border: '1px solid hsla(155, 82%, 48%, 0.25)',
              boxShadow: [
                'inset 0 1px 0 hsla(155, 82%, 70%, 0.15)',
                'inset 0 -1px 0 hsla(232, 30%, 2%, 0.45)',
                '0 0 24px -6px hsla(155, 82%, 48%, 0.25)',
                '0 4px 16px -4px hsla(232, 30%, 2%, 0.5)',
              ].join(', '),
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[45%] rounded-t-lg pointer-events-none" style={{
              background: 'linear-gradient(180deg, hsla(155, 82%, 80%, 0.08) 0%, transparent 100%)',
            }} />
            <div className="absolute bottom-0 left-2 right-2 h-px pointer-events-none" style={{
              background: 'linear-gradient(90deg, transparent, hsla(155, 82%, 70%, 0.12), transparent)',
            }} />
            <Zap className="w-3 h-3" style={{
              color: 'hsl(155, 82%, 55%)',
              filter: 'drop-shadow(0 0 8px hsla(155, 82%, 48%, 0.7)) drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.2))',
            }} />
            <span className="text-[10px] font-medium whitespace-nowrap" style={{
              color: 'hsl(155, 82%, 60%)',
              textShadow: '0 0 10px hsla(155, 82%, 48%, 0.35)',
            }}>{m.title}</span>
            <span
              className="font-mono text-[10px] font-bold tabular-nums"
              style={{
                ...goldGradientText,
                filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.5)) drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.6))',
              }}
            >
              +{m.delta_log_odds.toFixed(1)}
            </span>
          </motion.div>
        ))}

        {bottlenecks.length > 0 && breakthroughs.length > 0 && (
          <div className="w-px h-4 shrink-0" style={{
            background: 'linear-gradient(180deg, hsla(36, 100%, 56%, 0.12), transparent)',
          }} />
        )}

        {bottlenecks.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (breakthroughs.length + i) * 0.06 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0 shine-sweep relative overflow-hidden group"
            style={{
              background: 'linear-gradient(145deg, hsla(36, 100%, 56%, 0.12), rgba(8, 10, 28, 0.82))',
              border: '1px solid hsla(36, 100%, 56%, 0.22)',
              boxShadow: [
                'inset 0 1px 0 hsla(36, 100%, 75%, 0.12)',
                'inset 0 -1px 0 hsla(232, 30%, 2%, 0.45)',
                '0 0 22px -6px hsla(36, 100%, 56%, 0.2)',
                '0 4px 16px -4px hsla(232, 30%, 2%, 0.5)',
              ].join(', '),
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[45%] rounded-t-lg pointer-events-none" style={{
              background: 'linear-gradient(180deg, hsla(36, 100%, 80%, 0.06) 0%, transparent 100%)',
            }} />
            <div className="absolute bottom-0 left-2 right-2 h-px pointer-events-none" style={{
              background: 'linear-gradient(90deg, transparent, hsla(36, 100%, 70%, 0.1), transparent)',
            }} />
            <AlertTriangle className="w-3 h-3" style={{
              color: 'hsl(36, 100%, 60%)',
              filter: 'drop-shadow(0 0 6px hsla(36, 100%, 56%, 0.6)) drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.2))',
            }} />
            <span className="text-[10px] font-medium whitespace-nowrap" style={{
              color: 'hsl(36, 100%, 62%)',
              textShadow: '0 0 8px hsla(36, 100%, 56%, 0.3)',
            }}>{m.title}</span>
            <span className="font-mono text-[9px] font-semibold uppercase tracking-wider" style={{
              ...chromeGradientText,
              filter: 'drop-shadow(0 1px 0 hsla(220, 10%, 25%, 0.5))',
            }}>{archetypeConfig[m.archetype]?.label || m.archetype}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
