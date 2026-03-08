import { motion } from 'framer-motion';
import { Shield, X } from 'lucide-react';

interface AutoAcceptBadgeProps {
  secondsLeft: number;
  onCancel: () => void;
}

export function AutoAcceptBadge({ secondsLeft, onCancel }: AutoAcceptBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
      style={{
        background: 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.15), hsla(38, 88%, 34%, 0.12))',
        border: '1px solid hsla(43, 96%, 56%, 0.3)',
        boxShadow: '0 0 12px hsla(43, 96%, 56%, 0.2)',
      }}
    >
      <motion.div
        animate={{
          boxShadow: [
            '0 0 4px hsla(43, 96%, 56%, 0.4)',
            '0 0 12px hsla(43, 96%, 56%, 0.7)',
            '0 0 4px hsla(43, 96%, 56%, 0.4)',
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-full p-0.5"
      >
        <Shield className="w-2.5 h-2.5" style={{ color: 'hsl(43, 96%, 56%)' }} />
      </motion.div>
      <span style={{ color: 'hsl(43, 96%, 56%)' }}>AUTO-ACCEPT</span>
      <motion.span
        key={secondsLeft}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className="tabular-nums"
        style={{ color: 'hsl(48, 100%, 74%)' }}
      >
        {secondsLeft}s
      </motion.span>
      <button
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        className="ml-0.5 rounded-full p-0.5 transition-colors"
        style={{ background: 'hsla(0, 72%, 58%, 0.1)' }}
        title="Cancel auto-accept"
      >
        <X className="w-2.5 h-2.5" style={{ color: 'hsl(0, 72%, 58%)' }} />
      </button>
    </motion.div>
  );
}
