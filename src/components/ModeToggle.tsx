import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { Activity, Sparkles } from 'lucide-react';

export function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div className="flex items-center glass-chrome rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => setMode('analyst')}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
          mode === 'analyst'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground/70'
        }`}
      >
        {mode === 'analyst' && (
          <motion.div
            layoutId="mode-bg"
            className="absolute inset-0 rounded-md bg-muted/80 border border-chrome/20"
            style={{ boxShadow: 'inset 0 1px 0 hsla(220, 10%, 85%, 0.08)' }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
          />
        )}
        <Activity className="w-3 h-3 relative z-10" />
        <span className="relative z-10 font-mono">ANALYST</span>
      </button>
      <button
        onClick={() => setMode('wonder')}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
          mode === 'wonder'
            ? 'text-gold-solid'
            : 'text-muted-foreground hover:text-foreground/70'
        }`}
      >
        {mode === 'wonder' && (
          <motion.div
            layoutId="mode-bg"
            className="absolute inset-0 rounded-md border border-gold/30"
            style={{
              background: 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.08), hsla(228, 18%, 10%, 0.6))',
              boxShadow: '0 0 20px -6px hsla(43, 96%, 56%, 0.15)',
            }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
          />
        )}
        <Sparkles className="w-3 h-3 relative z-10" />
        <span className="relative z-10 font-mono">WONDER</span>
      </button>
    </div>
  );
}
