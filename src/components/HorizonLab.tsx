import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FlaskConical, Loader2, Settings2 } from 'lucide-react';
import { usePendingEvidence } from '@/hooks/usePendingEvidence';
import { useAutoAccept } from '@/hooks/useAutoAccept';
import { useMode } from '@/contexts/ModeContext';
import { useDirectivesActive } from '@/hooks/useDirectivesActive';
import { HorizonCard } from '@/components/horizon-lab/HorizonCard';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

export function HorizonLab() {
  const { items, loading, acting, approve, reject } = usePendingEvidence();
  const { countdowns, cancelAutoAccept, isAutoAccepting } = useAutoAccept(items, approve);
  const [expanded, setExpanded] = useState(true);
  const { isWonder } = useMode();

  if (!loading && items.length === 0) return null;

  const autoCount = items.filter(i => isAutoAccepting(i.id)).length;

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
            {loading ? 'scanning…' : `${items.length} pending`}
            {autoCount > 0 && (
              <span style={{ color: 'hsl(43, 96%, 56%)' }}> · {autoCount} auto-accepting</span>
            )}
          </span>
        </div>

        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </button>

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
                      isAutoAccepting={isAutoAccepting(item.id)}
                      countdownSeconds={countdowns.get(item.id)}
                      onCancelAutoAccept={cancelAutoAccept}
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
