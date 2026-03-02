import { motion } from 'framer-motion';
import { glassInner } from '@/lib/glass-styles';

/** Neon ring spinner + skeleton bars matching the dark glass theme */
export function WhyItChangedSkeleton() {
  return (
    <div className="space-y-4 py-4">
      {/* Neon ring spinner */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="relative" style={{ width: 72, height: 72 }}>
          <svg width={72} height={72} className="animate-spin" style={{ animationDuration: '1.8s' }}>
            <defs>
              <linearGradient id="skel-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(43, 96%, 56%)" stopOpacity="0.9" />
                <stop offset="50%" stopColor="hsl(192, 95%, 55%)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(43, 96%, 56%)" stopOpacity="0" />
              </linearGradient>
              <filter id="skel-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="blur" in2="SourceGraphic" operator="over" />
              </filter>
            </defs>
            <circle
              cx={36} cy={36} r={30}
              fill="none"
              stroke="hsla(220, 10%, 72%, 0.08)"
              strokeWidth={5}
            />
            <circle
              cx={36} cy={36} r={30}
              fill="none"
              stroke="url(#skel-ring-grad)"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 30}`}
              strokeDashoffset={`${2 * Math.PI * 30 * 0.65}`}
              filter="url(#skel-glow)"
            />
          </svg>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
          Loading Bayesian engine…
        </span>
      </div>

      {/* Skeleton bars */}
      {[0.7, 1, 0.5, 0.8, 0.6].map((w, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 + i * 0.08 }}
        >
          <div className="w-28 h-3 rounded" style={{
            background: 'hsla(220, 10%, 72%, 0.06)',
          }} />
          <div className="flex-1 h-9 rounded-lg overflow-hidden relative" style={{
            ...glassInner,
            border: '1px solid hsla(220, 10%, 72%, 0.06)',
          }}>
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, hsla(43, 96%, 56%, 0.06) 50%, transparent 100%)',
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
            />
            <div
              className="h-full rounded-lg"
              style={{
                width: `${w * 50}%`,
                background: 'hsla(220, 10%, 72%, 0.04)',
              }}
            />
          </div>
          <div className="w-16 h-3 rounded" style={{
            background: 'hsla(220, 10%, 72%, 0.06)',
          }} />
        </motion.div>
      ))}
    </div>
  );
}
