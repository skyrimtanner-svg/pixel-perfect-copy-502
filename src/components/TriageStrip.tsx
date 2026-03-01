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
        background: 'linear-gradient(168deg, hsla(232, 26%, 8%, 0.82), hsla(232, 22%, 5%, 0.72))',
        border: '1px solid hsla(220, 12%, 70%, 0.1)',
        backdropFilter: 'blur(32px)',
        boxShadow: [
          'inset 0 1px 0 hsla(220, 14%, 88%, 0.06)',
          'inset 0 -1px 0 hsla(232, 30%, 2%, 0.5)',
          '0 4px 24px -8px hsla(232, 30%, 2%, 0.7)',
        ].join(', '),
      }}
    >
      {/* Top chrome line */}
      <div className="absolute top-0 left-6 right-6 h-px" style={{
        background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.07), transparent)',
      }} />

      <div className="flex items-center gap-3 overflow-x-auto">
        {/* Label */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <TrendingUp className="w-3 h-3 text-gold-solid" style={{ filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.4))' }} />
          <span
            className="text-[9px] uppercase tracking-[0.15em] font-mono font-semibold"
            style={isWonder ? {
              background: 'linear-gradient(135deg, hsl(38, 88%, 38%), hsl(43, 96%, 56%), hsl(48, 100%, 70%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            } : {
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            {isWonder ? 'SIGNAL STRIP' : 'TRIAGE STRIP'}
          </span>
        </div>

        <div className="w-px h-4 shrink-0" style={{ background: 'hsla(220, 12%, 70%, 0.1)' }} />

        {breakthroughs.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsla(155, 82%, 48%, 0.08), hsla(155, 82%, 48%, 0.02))',
              border: '1px solid hsla(155, 82%, 48%, 0.15)',
              boxShadow: 'inset 0 1px 0 hsla(155, 82%, 65%, 0.05)',
            }}
          >
            <Zap className="w-3 h-3 text-green-400" style={{ filter: 'drop-shadow(0 0 3px hsla(155, 82%, 48%, 0.4))' }} />
            <span className="text-[10px] font-medium text-green-400 whitespace-nowrap">{m.title}</span>
            <span
              className="font-mono text-[10px] font-bold"
              style={{
                background: 'linear-gradient(135deg, hsl(38, 88%, 40%), hsl(48, 100%, 68%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              +{m.delta_log_odds.toFixed(1)}
            </span>
          </motion.div>
        ))}

        {bottlenecks.length > 0 && breakthroughs.length > 0 && (
          <div className="w-px h-4 shrink-0" style={{ background: 'hsla(220, 12%, 70%, 0.08)' }} />
        )}

        {bottlenecks.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (breakthroughs.length + i) * 0.06 }}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsla(36, 100%, 56%, 0.06), hsla(36, 100%, 56%, 0.02))',
              border: '1px solid hsla(36, 100%, 56%, 0.12)',
              boxShadow: 'inset 0 1px 0 hsla(36, 100%, 70%, 0.04)',
            }}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" style={{ filter: 'drop-shadow(0 0 3px hsla(36, 100%, 56%, 0.3))' }} />
            <span className="text-[10px] font-medium text-amber-400 whitespace-nowrap">{m.title}</span>
            <span className="font-mono text-[9px] text-muted-foreground">{archetypeConfig[m.archetype].label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
