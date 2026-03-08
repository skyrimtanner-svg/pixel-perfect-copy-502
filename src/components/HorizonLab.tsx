import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, FlaskConical, Check, X, ArrowUpRight, ArrowDownRight, Minus, Loader2 } from 'lucide-react';
import { usePendingEvidence, type PendingItem } from '@/hooks/usePendingEvidence';
import { useMode } from '@/contexts/ModeContext';
import { glassInner } from '@/lib/glass-styles';
import { AnimatedProbabilityRing } from '@/components/AnimatedProbabilityRing';

const domainHsl: Record<string, string> = {
  compute: 'hsl(192, 100%, 52%)',
  energy: 'hsl(36, 100%, 56%)',
  connectivity: 'hsl(268, 90%, 68%)',
  manufacturing: 'hsl(342, 82%, 62%)',
  biology: 'hsl(155, 82%, 48%)',
};

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

function DirectionIcon({ direction }: { direction: PendingItem['direction'] }) {
  if (direction === 'supports') {
    return <ArrowUpRight className="w-3 h-3" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.5))' }} />;
  }
  if (direction === 'contradicts') {
    return <ArrowDownRight className="w-3 h-3" style={{ color: 'hsl(0, 72%, 58%)', filter: 'drop-shadow(0 0 4px hsla(0, 72%, 58%, 0.4))' }} />;
  }
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

function HorizonCard({ item, acting, onApprove, onReject }: {
  item: PendingItem;
  acting: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const isActing = acting === item.id;
  const deltaPercent = Math.round((item.simulated_posterior - (item.milestone_posterior ?? 0.5)) * 100);
  const isPositive = item.simulated_delta_lo >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="rounded-xl p-3 relative overflow-hidden specular-track shine-sweep group"
      style={{
        ...glassInner,
        borderColor: isPositive
          ? 'hsla(43, 96%, 56%, 0.12)'
          : item.direction === 'contradicts'
            ? 'hsla(0, 72%, 58%, 0.12)'
            : 'hsla(220, 12%, 70%, 0.1)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Mini probability ring showing simulated posterior */}
        <div className="shrink-0 pt-0.5">
          <AnimatedProbabilityRing
            currentValue={item.simulated_posterior}
            previousValue={item.milestone_posterior}
            size={36}
            mode="analyst"
            strokeWidth={2.5}
            domainColor={domainHsl[item.milestone_id?.split('-')[0] ?? ''] || 'hsl(192, 100%, 52%)'}
            useGold={false}
            evidencePulse={null}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-muted-foreground truncate max-w-[160px]">
              {item.milestone_title || item.milestone_id}
            </span>
            <DirectionIcon direction={item.direction} />
          </div>

          <p className="text-[11px] leading-snug line-clamp-2 mb-1.5" style={{ color: 'hsl(218, 15%, 68%)' }}>
            {item.summary || item.source}
          </p>

          <div className="flex items-center gap-3 text-[9px] font-mono tabular-nums">
            <span style={isPositive ? goldGradientStyle : { color: 'hsl(0, 72%, 58%)' }}>
              Δ {isPositive ? '+' : ''}{item.simulated_delta_lo.toFixed(2)} LO
            </span>
            <span className="text-muted-foreground">
              {Math.round((item.milestone_posterior ?? 0.5) * 100)}% → {Math.round(item.simulated_posterior * 100)}%
            </span>
            <span className="text-muted-foreground/60">
              ({deltaPercent >= 0 ? '+' : ''}{deltaPercent}pp)
            </span>
            <span className="text-muted-foreground/40 truncate max-w-[100px]" title={item.source}>
              {item.source}
            </span>
          </div>
        </div>

        {/* Approve / Reject controls */}
        <div className="flex items-center gap-1.5 shrink-0 pt-1">
          {isActing ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <motion.button
                onClick={() => onApprove(item.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: 'hsla(43, 96%, 56%, 0.08)',
                  border: '1px solid hsla(43, 96%, 56%, 0.2)',
                }}
                whileHover={{ scale: 1.1, boxShadow: '0 0 12px hsla(43, 96%, 56%, 0.3)' }}
                whileTap={{ scale: 0.9 }}
                title="Approve — commit to Bayesian engine"
              >
                <Check className="w-3.5 h-3.5" style={{ color: 'hsl(43, 96%, 56%)' }} />
              </motion.button>
              <motion.button
                onClick={() => onReject(item.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: 'hsla(0, 72%, 58%, 0.06)',
                  border: '1px solid hsla(0, 72%, 58%, 0.15)',
                }}
                whileHover={{ scale: 1.1, boxShadow: '0 0 12px hsla(0, 72%, 58%, 0.2)' }}
                whileTap={{ scale: 0.9 }}
                title="Reject — discard signal"
              >
                <X className="w-3.5 h-3.5" style={{ color: 'hsl(0, 72%, 58%)' }} />
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function HorizonLab() {
  const { items, loading, acting, approve, reject } = usePendingEvidence();
  const [expanded, setExpanded] = useState(true);
  const { isWonder } = useMode();

  // Don't render if no pending items and not loading
  if (!loading && items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="mb-4 rounded-xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, hsla(268, 60%, 24%, 0.06), hsla(192, 100%, 52%, 0.04), hsla(43, 96%, 56%, 0.03))',
        border: '1px solid hsla(192, 100%, 52%, 0.12)',
        backdropFilter: 'blur(16px)',
      }}
      aria-label="Horizon Lab — pending evidence refinements"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-4 py-2.5 flex items-center gap-3 text-left group"
      >
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FlaskConical className="w-3.5 h-3.5" style={{
            color: 'hsl(192, 100%, 52%)',
            filter: 'drop-shadow(0 0 6px hsla(192, 100%, 52%, 0.5))',
          }} />
        </motion.div>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono font-semibold" style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.15))',
          }}>
            {isWonder ? '🔬 Horizon Lab' : 'HORIZON LAB'}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground ml-2">
            {loading ? 'scanning…' : `${items.length} pending refinement${items.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-[10px] font-mono text-muted-foreground">
                    Running shadow evaluations…
                  </span>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map(item => (
                    <HorizonCard
                      key={item.id}
                      item={item}
                      acting={acting}
                      onApprove={approve}
                      onReject={reject}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
