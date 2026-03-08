import { motion } from 'framer-motion';
import { Check, X, ArrowUpRight, ArrowDownRight, Minus, Loader2 } from 'lucide-react';
import type { PendingItem } from '@/hooks/usePendingEvidence';
import { glassInner } from '@/lib/glass-styles';
import { AnimatedProbabilityRing } from '@/components/AnimatedProbabilityRing';
import { AutoAcceptBadge } from './AutoAcceptBadge';

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

interface HorizonCardProps {
  item: PendingItem;
  acting: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isAutoAccepting: boolean;
  countdownSeconds?: number;
  onCancelAutoAccept: (id: string) => void;
}

export function HorizonCard({
  item, acting, onApprove, onReject,
  isAutoAccepting, countdownSeconds, onCancelAutoAccept,
}: HorizonCardProps) {
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
        borderColor: isAutoAccepting
          ? 'hsla(43, 96%, 56%, 0.25)'
          : isPositive
            ? 'hsla(43, 96%, 56%, 0.12)'
            : item.direction === 'contradicts'
              ? 'hsla(0, 72%, 58%, 0.12)'
              : 'hsla(220, 12%, 70%, 0.1)',
        boxShadow: isAutoAccepting ? '0 0 20px hsla(43, 96%, 56%, 0.08)' : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Mini probability ring */}
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
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-muted-foreground truncate max-w-[160px]">
              {item.milestone_title || item.milestone_id}
            </span>
            <DirectionIcon direction={item.direction} />
            {isAutoAccepting && countdownSeconds !== undefined && (
              <AutoAcceptBadge
                secondsLeft={countdownSeconds}
                onCancel={() => onCancelAutoAccept(item.id)}
              />
            )}
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
