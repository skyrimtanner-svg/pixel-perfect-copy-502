import { milestones, archetypeConfig } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, TrendingUp } from 'lucide-react';

export function TriageStrip() {
  const { isWonder } = useMode();
  const sorted = [...milestones].sort((a, b) => b.triageScore - a.triageScore);
  
  const breakthroughs = sorted.filter(m => m.archetype === 'breakthrough' && m.delta_log_odds > 0).slice(0, 3);
  const bottlenecks = sorted.filter(m => m.archetype === 'bottleneck').slice(0, 2);

  if (breakthroughs.length === 0 && bottlenecks.length === 0) return null;

  return (
    <div
      className="rounded-xl p-2.5 mb-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(168deg, hsla(232, 26%, 9%, 0.88), hsla(232, 22%, 5%, 0.82))',
        border: '1px solid hsla(220, 12%, 70%, 0.14)',
        backdropFilter: 'blur(40px)',
        boxShadow: [
          'inset 0 1px 0 hsla(220, 16%, 95%, 0.09)',
          'inset 0 -1px 0 hsla(232, 30%, 2%, 0.55)',
          '0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
          '0 2px 6px hsla(232, 30%, 2%, 0.45)',
        ].join(', '),
      }}
    >
      {/* Top gold chrome line */}
      <div className="absolute top-0 left-4 right-4 h-px" style={{
        background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.15), hsla(220, 14%, 88%, 0.08), hsla(43, 96%, 56%, 0.15), transparent)',
      }} />
      {/* Glossy top reflection */}
      <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-xl pointer-events-none" style={{
        background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.035) 0%, transparent 100%)',
      }} />

      <div className="flex items-center gap-3 overflow-x-auto">
        {/* Label */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <TrendingUp className="w-3 h-3" style={{
            color: 'hsl(43, 96%, 56%)',
            filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.6)) drop-shadow(0 0 3px hsla(190, 100%, 50%, 0.3))',
          }} />
          <span
            className="text-[9px] uppercase tracking-[0.15em] font-mono font-semibold"
            style={{
              background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 50%), hsl(48, 100%, 72%), hsl(50, 100%, 86%), hsl(43, 96%, 54%))',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0 shine-sweep relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, hsla(155, 82%, 48%, 0.12), hsla(155, 82%, 48%, 0.04))',
              border: '1px solid hsla(155, 82%, 48%, 0.22)',
              boxShadow: [
                'inset 0 1px 0 hsla(155, 82%, 70%, 0.1)',
                'inset 0 -1px 0 hsla(232, 30%, 2%, 0.35)',
                '0 0 20px -6px hsla(155, 82%, 48%, 0.2)',
              ].join(', '),
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Glossy sheen */}
            <div className="absolute top-0 left-0 right-0 h-[45%] rounded-t-lg pointer-events-none" style={{
              background: 'linear-gradient(180deg, hsla(155, 82%, 80%, 0.04) 0%, transparent 100%)',
            }} />
            <Zap className="w-3 h-3" style={{
              color: 'hsl(155, 82%, 55%)',
              filter: 'drop-shadow(0 0 6px hsla(155, 82%, 48%, 0.6))',
            }} />
            <span className="text-[10px] font-medium whitespace-nowrap" style={{
              color: 'hsl(155, 82%, 60%)',
              textShadow: '0 0 8px hsla(155, 82%, 48%, 0.3)',
            }}>{m.title}</span>
            <span
              className="font-mono text-[10px] font-bold tabular-nums"
              style={{
                background: 'linear-gradient(135deg, hsl(38, 88%, 36%), hsl(43, 96%, 56%), hsl(48, 100%, 74%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.4))',
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0 shine-sweep relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, hsla(36, 100%, 56%, 0.1), hsla(36, 100%, 56%, 0.03))',
              border: '1px solid hsla(36, 100%, 56%, 0.2)',
              boxShadow: [
                'inset 0 1px 0 hsla(36, 100%, 75%, 0.08)',
                'inset 0 -1px 0 hsla(232, 30%, 2%, 0.35)',
                '0 0 18px -6px hsla(36, 100%, 56%, 0.15)',
              ].join(', '),
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[45%] rounded-t-lg pointer-events-none" style={{
              background: 'linear-gradient(180deg, hsla(36, 100%, 80%, 0.03) 0%, transparent 100%)',
            }} />
            <AlertTriangle className="w-3 h-3" style={{
              color: 'hsl(36, 100%, 60%)',
              filter: 'drop-shadow(0 0 5px hsla(36, 100%, 56%, 0.5))',
            }} />
            <span className="text-[10px] font-medium whitespace-nowrap" style={{
              color: 'hsl(36, 100%, 62%)',
              textShadow: '0 0 6px hsla(36, 100%, 56%, 0.25)',
            }}>{m.title}</span>
            <span className="font-mono text-[9px] font-semibold uppercase tracking-wider" style={{
              background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 78%), hsl(220, 16%, 90%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{archetypeConfig[m.archetype].label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
