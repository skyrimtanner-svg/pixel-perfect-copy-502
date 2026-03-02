import { useMode } from '@/contexts/ModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Sparkles } from 'lucide-react';
import { specularReflection } from '@/lib/glass-styles';

export function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div
      className="flex items-center rounded-xl p-1 gap-0.5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(168deg, hsla(232, 26%, 8%, 0.8), hsla(232, 22%, 5%, 0.7))',
        border: '1px solid hsla(220, 12%, 70%, 0.12)',
        boxShadow: [
          'inset 0 1px 0 hsla(220, 14%, 88%, 0.06)',
          'inset 0 -1px 0 hsla(232, 30%, 2%, 0.4)',
          '0 4px 16px -4px hsla(232, 30%, 2%, 0.5)',
        ].join(', '),
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Specular top sheen */}
      <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-xl pointer-events-none" style={specularReflection} />

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
                background: 'linear-gradient(135deg, hsla(220, 14%, 88%, 0.08), hsla(232, 26%, 10%, 0.8))',
                border: '1px solid hsla(220, 12%, 70%, 0.18)',
                boxShadow: [
                  'inset 0 1px 0 hsla(220, 16%, 95%, 0.08)',
                  'inset 0 -1px 0 hsla(232, 30%, 2%, 0.4)',
                  '0 0 14px -4px hsla(220, 12%, 70%, 0.12)',
                ].join(', '),
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.5, bounce: 0.12 }}
            />
          )}
        </AnimatePresence>
        <Activity className="w-3.5 h-3.5 relative z-10" style={mode === 'analyst' ? {
          filter: 'drop-shadow(0 0 4px hsla(220, 14%, 88%, 0.3))',
        } : {}} />
        <span className="relative z-10 font-mono tracking-wider text-[10px]" style={mode === 'analyst' ? {
          background: 'linear-gradient(135deg, hsl(220, 10%, 60%), hsl(220, 14%, 85%), hsl(220, 16%, 95%))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        } : {}}>ANALYST</span>
      </button>
      <button
        onClick={() => setMode('wonder')}
        className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
          mode === 'wonder'
            ? ''
            : 'text-muted-foreground hover:text-foreground/70'
        }`}
      >
        <AnimatePresence>
          {mode === 'wonder' && (
            <motion.div
              layoutId="mode-bg"
              className="absolute inset-0 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.12), hsla(232, 26%, 8%, 0.75))',
                border: '1px solid hsla(43, 96%, 56%, 0.28)',
                boxShadow: [
                  '0 0 28px -6px hsla(43, 96%, 56%, 0.25)',
                  'inset 0 1px 0 hsla(48, 100%, 80%, 0.1)',
                  'inset 0 -1px 0 hsla(38, 88%, 20%, 0.4)',
                ].join(', '),
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
          <Sparkles className="w-3.5 h-3.5" style={mode === 'wonder' ? {
            color: 'hsl(43, 96%, 56%)',
            filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.6))',
          } : {}} />
        </motion.div>
        <span className="relative z-10 font-mono tracking-wider text-[10px]" style={mode === 'wonder' ? {
          background: 'linear-gradient(135deg, hsl(38, 88%, 38%), hsl(43, 96%, 56%), hsl(48, 100%, 74%))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        } : {}}>WONDER</span>
      </button>
    </div>
  );
}
