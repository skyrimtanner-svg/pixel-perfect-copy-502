import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useMode } from '@/contexts/ModeContext';

interface FreshSignalsBannerProps {
  count: number;
  lastRunMinAgo: number;
  details: string[];
  onViewUpdates: () => void;
}

export function FreshSignalsBanner({ count, lastRunMinAgo, details, onViewUpdates }: FreshSignalsBannerProps) {
  const { isWonder } = useMode();

  if (count === 0) return null;

  const timeLabel = lastRunMinAgo < 1 ? 'just now' : `${lastRunMinAgo} min ago`;
  const detailText = details.slice(0, 3).join(', ');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -12, height: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="mb-4 rounded-xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.06), hsla(192, 100%, 52%, 0.04))',
          border: '1px solid hsla(43, 96%, 56%, 0.15)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="px-4 py-2.5 flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Zap className="w-3.5 h-3.5" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.5))' }} />
          </motion.div>
          <p className="text-xs font-mono text-muted-foreground flex-1 min-w-0 truncate">
            <span className="font-semibold" style={{ color: 'hsl(43, 96%, 56%)' }}>{count} new signal{count !== 1 ? 's' : ''}</span>
            {' in last 6h'}
            {detailText && <span className="hidden sm:inline"> — {detailText}</span>}
            <span className="text-[10px] ml-2 opacity-60">Scout ran {timeLabel}</span>
          </p>
          <button
            onClick={onViewUpdates}
            className="shrink-0 text-[10px] font-mono font-semibold px-3 py-1 rounded-lg transition-all"
            style={{
              background: 'hsla(43, 96%, 56%, 0.1)',
              border: '1px solid hsla(43, 96%, 56%, 0.2)',
              color: 'hsl(43, 96%, 56%)',
            }}
          >
            {isWonder ? '✨ View Updates' : 'View Updates'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
