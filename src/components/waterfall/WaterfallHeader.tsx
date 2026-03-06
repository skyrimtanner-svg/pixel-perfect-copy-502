import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, RotateCcw, Undo2 } from 'lucide-react';
import { glassInner } from '@/lib/glass-styles';

const chromeGradientStyle = {
  background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 78%), hsl(220, 16%, 92%), hsl(220, 14%, 80%), hsl(220, 10%, 56%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const, backgroundClip: 'text' as const,
};

interface WaterfallHeaderProps {
  isSimActive: boolean;
  isWonder: boolean;
  onUndo: () => void;
  onReset: () => void;
}

export function WaterfallHeader({ isSimActive, onUndo, onReset }: WaterfallHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-1 relative z-10">
      <div className="flex items-center gap-2">
        <Beaker className="w-3.5 h-3.5" style={{
          color: isSimActive ? 'hsl(192, 95%, 55%)' : 'hsl(220, 10%, 55%)',
          filter: isSimActive ? 'drop-shadow(0 0 8px hsla(192, 95%, 50%, 0.5))' : 'none',
          transition: 'all 0.3s',
        }} />
        <span className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold" style={
          isSimActive ? {
            background: 'linear-gradient(135deg, hsl(192, 90%, 45%), hsl(192, 95%, 65%))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          } : chromeGradientStyle
        }>
          {isSimActive ? '⚡ SCENARIO MODE' : 'EVIDENCE WATERFALL'}
        </span>
        <AnimatePresence>
          {isSimActive && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider"
              style={{
                background: 'hsla(192, 95%, 55%, 0.1)',
                border: '1px dashed hsla(192, 95%, 55%, 0.3)',
                color: 'hsl(192, 95%, 65%)',
              }}
            >
              SANDBOX
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isSimActive && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-1.5"
          >
            <button
              onClick={onUndo}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-mono font-bold transition-all duration-300 hover:scale-105"
              style={{
                ...glassInner,
                border: '1px solid hsla(220, 10%, 70%, 0.2)',
                color: 'hsl(220, 12%, 65%)',
              }}
              title="Undo all exclusions and restore canonical"
            >
              <Undo2 className="w-2.5 h-2.5" />
              Undo
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all duration-300 hover:scale-105"
              style={{
                ...glassInner,
                border: '1px solid hsla(43, 96%, 56%, 0.25)',
                boxShadow: '0 0 12px -4px hsla(43, 96%, 56%, 0.2)',
              }}
            >
              <RotateCcw className="w-3 h-3" style={{ color: 'hsl(43, 96%, 56%)' }} />
              <span style={{ color: 'hsl(43, 82%, 60%)' }}>Reset to Canonical</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
