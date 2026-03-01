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
    <div className="glass-premium rounded-xl p-3 mb-6">
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
            }}
          >
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-[11px] font-medium text-green-400 whitespace-nowrap">{m.title}</span>
            <span className="font-mono text-[10px] text-gold-solid">+{m.delta_log_odds.toFixed(1)}</span>
          </motion.div>
        ))}

        {bottlenecks.length > 0 && breakthroughs.length > 0 && (
          <div className="w-px h-5 bg-chrome/10 shrink-0" />
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
            }}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-medium text-amber-400 whitespace-nowrap">{m.title}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{archetypeConfig[m.archetype].label}</span>
          </motion.div>
        ))}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
            {isWonder ? '✦ Signal Strip' : 'TRIAGE STRIP'}
          </span>
        </div>
      </div>
    </div>
  );
}
