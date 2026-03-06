import { motion } from 'framer-motion';
import { specularReflection } from '@/lib/glass-styles';
import { NegativeDropSparks } from '@/components/NegativeDropSparks';
import { WhatIfResult } from '@/hooks/useMilestoneAPI';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const, backgroundClip: 'text' as const,
};

interface PosteriorBarProps {
  finalPosterior: number;
  posteriorDelta: number;
  isSimActive: boolean;
  isDropping: boolean | null | undefined;
  effectiveWhatIf: WhatIfResult | null;
}

export function PosteriorBar({ finalPosterior, posteriorDelta, isSimActive, isDropping, effectiveWhatIf }: PosteriorBarProps) {
  return (
    <>
      <motion.div
        className="flex items-center gap-3 py-1.5 mt-1 pt-3 relative z-10"
        style={{ borderTop: `1px solid ${isDropping ? 'hsla(4, 82%, 63%, 0.2)' : 'hsla(43, 96%, 56%, 0.15)'}` }}
        animate={effectiveWhatIf ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.4 }}
      >
        <div className="w-28 text-[10px] font-mono font-bold uppercase tracking-wider" style={{
          ...(isDropping ? {
            background: 'linear-gradient(135deg, hsl(4, 60%, 40%), hsl(4, 82%, 60%))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          } : { ...goldGradientStyle, filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))' }),
        }}>
          {isSimActive ? 'SIM POSTERIOR' : 'Posterior'}
        </div>
        <div className="flex-1 h-9 rounded-lg relative overflow-hidden" style={{
          background: 'rgba(8, 10, 28, 0.6)',
          border: `1px solid ${isDropping ? 'hsla(4, 82%, 63%, 0.3)' : 'hsla(43, 96%, 56%, 0.25)'}`,
          boxShadow: [
            `inset 0 1px 0 ${isDropping ? 'hsla(4, 82%, 63%, 0.1)' : 'hsla(43, 96%, 56%, 0.08)'}`,
            'inset 0 -1px 0 hsla(232, 30%, 2%, 0.35)',
            `0 0 20px -6px ${isDropping ? 'hsla(4, 82%, 63%, 0.2)' : 'hsla(43, 96%, 56%, 0.15)'}`,
          ].join(', '),
        }}>
          <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
          <motion.div
            className="absolute left-0 top-0 h-full rounded-lg"
            style={{
              background: isDropping
                ? 'linear-gradient(90deg, hsla(4, 72%, 45%, 0.4), hsla(4, 82%, 60%, 0.2), hsla(4, 72%, 55%, 0.1))'
                : 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.35), hsla(48, 100%, 72%, 0.2), hsla(48, 100%, 67%, 0.08))',
              boxShadow: isDropping
                ? '0 0 32px -6px hsla(4, 82%, 63%, 0.3), inset 0 1px 0 hsla(4, 82%, 70%, 0.12)'
                : '0 0 32px -6px hsla(43, 96%, 56%, 0.3), inset 0 1px 0 hsla(48, 100%, 80%, 0.12)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(finalPosterior * 100)}%` }}
            transition={{ duration: 0.6 }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-sm font-bold tabular-nums" style={{
            ...(isDropping ? {
              color: 'hsl(4, 82%, 63%)',
              textShadow: '0 0 12px hsla(4, 82%, 63%, 0.4)',
            } : {
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.3)) drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.5))',
            })
          }}>
            {(finalPosterior * 100).toFixed(1)}%
          </span>
          {isSimActive && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/10"
              style={{ color: posteriorDelta >= 0 ? 'hsl(155, 82%, 55%)' : 'hsl(4, 82%, 63%)' }}>
              {posteriorDelta >= 0 ? '+' : ''}{(posteriorDelta * 100).toFixed(1)}pp
            </span>
          )}
        </div>
      </motion.div>
      <NegativeDropSparks
        active={!!isDropping}
        intensity={Math.abs(posteriorDelta) * 5}
        containerSize={200}
      />
    </>
  );
}
