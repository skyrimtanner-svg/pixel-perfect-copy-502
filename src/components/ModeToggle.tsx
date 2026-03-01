import { useMode } from '@/contexts/ModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Sparkles } from 'lucide-react';

export function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div
      className="flex items-center rounded-xl p-1 gap-0.5 relative"
      style={{
        background: 'hsla(232, 26%, 6%, 0.7)',
        border: '1px solid hsla(220, 12%, 70%, 0.1)',
        boxShadow: 'inset 0 1px 0 hsla(220, 14%, 88%, 0.04), inset 0 -1px 0 hsla(232, 30%, 2%, 0.3)',
      }}
    >
      <button
        onClick={() => setMode('analyst')}
        className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
          mode === 'analyst'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground/70'
        }`}
      >
        <AnimatePresence>
          {mode === 'analyst' && (
            <motion.div
              layoutId="mode-bg"
              className="absolute inset-0 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, hsla(220, 14%, 88%, 0.06), hsla(232, 26%, 10%, 0.8))',
                border: '1px solid hsla(220, 12%, 70%, 0.15)',
                boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.06), 0 0 12px -4px hsla(220, 12%, 70%, 0.1)',
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.12 }}
            />
          )}
        </AnimatePresence>
        <Activity className="w-3.5 h-3.5 relative z-10" />
        <span className="relative z-10 font-mono tracking-wider text-[10px]">ANALYST</span>
      </button>
      <button
        onClick={() => setMode('wonder')}
        className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
          mode === 'wonder'
            ? 'text-gold-solid'
            : 'text-muted-foreground hover:text-foreground/70'
        }`}
      >
        <AnimatePresence>
          {mode === 'wonder' && (
            <motion.div
              layoutId="mode-bg"
              className="absolute inset-0 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.1), hsla(232, 26%, 8%, 0.7))',
                border: '1px solid hsla(43, 96%, 56%, 0.25)',
                boxShadow: '0 0 24px -6px hsla(43, 96%, 56%, 0.2), inset 0 1px 0 hsla(48, 100%, 80%, 0.08)',
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.12 }}
            />
          )}
        </AnimatePresence>
        <motion.div
          className="relative z-10"
          animate={mode === 'wonder' ? { rotate: [0, 15, -10, 5, 0] } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </motion.div>
        <span className="relative z-10 font-mono tracking-wider text-[10px]">WONDER</span>
      </button>
    </div>
  );
}
