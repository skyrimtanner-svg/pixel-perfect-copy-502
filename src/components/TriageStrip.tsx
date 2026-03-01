import { milestones, archetypeConfig } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle } from 'lucide-react';

export function TriageStrip() {
  const { isWonder } = useMode();
  const sorted = [...milestones].sort((a, b) => b.triageScore - a.triageScore);
  
  const breakthroughs = sorted.filter(m => m.archetype === 'breakthrough' && m.delta_log_odds > 0).slice(0, 3);
  const bottlenecks = sorted.filter(m => m.archetype === 'bottleneck').slice(0, 2);

  if (breakthroughs.length === 0 && bottlenecks.length === 0) return null;

  return (
    <div
      className="rounded-xl p-3 mb-6"
      style={{
        background: 'linear-gradient(168deg, hsla(230, 22%, 10%, 0.8), hsla(230, 18%, 7%, 0.7))',
        border: '1px solid hsla(220, 10%, 72%, 0.12)',
        backdropFilter: 'blur(32px)',
        boxShadow: [
          'inset 0 1px 0 hsla(220, 10%, 90%, 0.08)',
          'inset 0 -1px 0 hsla(230, 25%, 3%, 0.5)',
          '0 8px 40px -12px hsla(230, 25%, 3%, 0.8)',
          '0 2px 6px hsla(230, 25%, 3%, 0.5)',
        ].join(', '),
      }}
    >
      {/* Top chrome highlight */}
      <div className="absolute top-0 left-6 right-6 h-px" style={{
        background: 'linear-gradient(90deg, transparent, hsla(220, 10%, 85%, 0.08), transparent)',
      }} />

      <div className="flex items-center gap-4 overflow-x-auto">
        {breakthroughs.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsla(152, 80%, 50%, 0.08), hsla(152, 80%, 50%, 0.02))',
              border: '1px solid hsla(152, 80%, 50%, 0.15)',
              boxShadow: 'inset 0 1px 0 hsla(152, 80%, 70%, 0.06), 0 0 12px -6px hsla(152, 80%, 50%, 0.15)',
            }}
          >
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-[11px] font-medium text-green-400 whitespace-nowrap">{m.title}</span>
            <span
              className="font-mono text-[10px] font-bold"
              style={{
                background: 'linear-gradient(135deg, hsl(40, 90%, 42%), hsl(48, 100%, 67%))',
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
          <div className="w-px h-5 shrink-0" style={{ background: 'hsla(220, 10%, 72%, 0.1)' }} />
        )}

        {bottlenecks.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (breakthroughs.length + i) * 0.08 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsla(38, 100%, 58%, 0.06), hsla(38, 100%, 58%, 0.02))',
              border: '1px solid hsla(38, 100%, 58%, 0.12)',
              boxShadow: 'inset 0 1px 0 hsla(38, 100%, 70%, 0.05)',
            }}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-medium text-amber-400 whitespace-nowrap">{m.title}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{archetypeConfig[m.archetype].label}</span>
          </motion.div>
        ))}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] uppercase tracking-wider font-mono"
            style={isWonder ? {
              background: 'linear-gradient(135deg, hsl(40, 90%, 42%), hsl(43, 96%, 56%), hsl(48, 100%, 67%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            } : {
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            {isWonder ? '✦ Signal Strip' : 'TRIAGE STRIP'}
          </span>
        </div>
      </div>
    </div>
  );
}
