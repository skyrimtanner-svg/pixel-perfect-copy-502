import { Evidence } from '@/data/milestones';
import { motion } from 'framer-motion';
import { glassInner, specularReflection, goldChromeLine } from '@/lib/glass-styles';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

const chromeGradientStyle = {
  background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 78%), hsl(220, 16%, 92%), hsl(220, 14%, 80%), hsl(220, 10%, 56%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

interface WaterfallChartProps {
  prior: number;
  evidence: Evidence[];
}

export function WaterfallChart({ prior, evidence }: WaterfallChartProps) {
  if (evidence.length === 0) {
    return <p className="text-muted-foreground text-sm">Historical milestone — no Bayesian evidence trail.</p>;
  }

  let cumLogOdds = Math.log(prior / (1 - prior));
  const blocks: { ev: Evidence; startLogOdds: number; endLogOdds: number; startProb: number; endProb: number }[] = [];

  for (const ev of evidence) {
    const start = cumLogOdds;
    cumLogOdds += ev.delta_log_odds;
    const startProb = 1 / (1 + Math.exp(-start));
    const endProb = 1 / (1 + Math.exp(-cumLogOdds));
    blocks.push({ ev, startLogOdds: start, endLogOdds: cumLogOdds, startProb, endProb });
  }

  const maxAbsDelta = Math.max(...evidence.map(e => Math.abs(e.delta_log_odds)), 0.5);

  return (
    <div className="space-y-2">
      {/* Prior bar */}
      <div className="flex items-center gap-3 py-1.5">
        <div className="w-36 text-[10px] font-mono font-bold truncate uppercase tracking-wider" style={chromeGradientStyle}>Base Prior</div>
        <div className="flex-1 h-8 rounded-lg relative overflow-hidden"
          style={{
            background: 'rgba(8, 10, 28, 0.6)',
            border: '1px solid hsla(220, 10%, 72%, 0.1)',
            boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.04), inset 0 -1px 0 hsla(232, 30%, 2%, 0.3)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
          <motion.div
            className="absolute left-0 top-0 h-full rounded-lg"
            style={{
              background: 'linear-gradient(90deg, hsla(220, 14%, 70%, 0.22), hsla(220, 14%, 80%, 0.1), hsla(220, 12%, 70%, 0.06))',
              boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.08)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${prior * 100}%` }}
            transition={{ duration: 0.6 }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs font-bold tabular-nums" style={chromeGradientStyle}>
            {(prior * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Evidence blocks */}
      {blocks.map((block, i) => {
        const widthPct = Math.min(Math.abs(block.ev.delta_log_odds) / maxAbsDelta * 60, 80);
        const isSupport = block.ev.direction === 'supports';
        const isContradict = block.ev.direction === 'contradicts';

        const barBg = isSupport
          ? 'linear-gradient(90deg, hsla(155, 82%, 38%, 0.6), hsla(155, 82%, 55%, 0.4), hsla(155, 82%, 65%, 0.2))'
          : isContradict
          ? 'linear-gradient(90deg, hsla(0, 72%, 40%, 0.6), hsla(0, 72%, 55%, 0.4), hsla(0, 72%, 65%, 0.2))'
          : 'linear-gradient(90deg, hsla(220, 10%, 50%, 0.4), hsla(220, 10%, 50%, 0.15))';

        const barGlow = isSupport
          ? '0 0 22px -4px hsla(155, 82%, 48%, 0.35), inset 0 1px 0 hsla(155, 82%, 70%, 0.18)'
          : isContradict
          ? '0 0 22px -4px hsla(0, 72%, 55%, 0.35), inset 0 1px 0 hsla(0, 72%, 70%, 0.18)'
          : 'none';

        return (
          <motion.div
            key={block.ev.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
            className="group"
          >
            <div className="flex items-center gap-3 py-1.5">
              <div className="w-36 text-[10px] text-muted-foreground truncate font-mono" title={block.ev.source}>
                {block.ev.source}
              </div>
              <div className="flex-1 h-8 rounded-lg relative overflow-hidden"
                style={{
                  background: 'rgba(8, 10, 28, 0.5)',
                  border: '1px solid hsla(220, 10%, 72%, 0.06)',
                  boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.03)',
                }}
              >
                <motion.div
                  className="absolute top-0 h-full rounded-lg"
                  style={{
                    left: isContradict ? `${50 - widthPct}%` : '50%',
                    background: barBg,
                    boxShadow: barGlow,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.4, ease: 'easeOut' }}
                />
                <div className="absolute left-1/2 top-0 h-full w-px"
                  style={{ background: 'hsla(220, 10%, 72%, 0.08)' }}
                />
              </div>
              <div className="w-24 text-right font-mono text-[10px] font-bold tabular-nums"
                style={isSupport ? {
                  background: 'linear-gradient(135deg, hsl(155, 70%, 40%), hsl(155, 82%, 58%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } : isContradict ? {
                  background: 'linear-gradient(135deg, hsl(0, 60%, 42%), hsl(0, 72%, 62%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } : { color: 'hsl(218, 15%, 46%)' }}
              >
                {block.ev.delta_log_odds > 0 ? '+' : ''}{block.ev.delta_log_odds.toFixed(2)} LO
              </div>
            </div>
            {/* Hover detail — heavy glass panel */}
            <div className="hidden group-hover:block ml-[9.5rem] mb-2 rounded-xl p-3 text-xs space-y-1.5 relative overflow-hidden"
              style={{
                ...glassInner,
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid hsla(43, 96%, 56%, 0.15)',
                boxShadow: 'inset 0 1px 0 hsla(220, 14%, 88%, 0.08), inset 0 -1px 0 hsla(232, 30%, 2%, 0.4), 0 8px 24px -6px hsla(232, 30%, 2%, 0.8)',
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[35%] rounded-t-xl" style={specularReflection} />
              <div className="absolute top-0 left-4 right-4 h-px" style={goldChromeLine} />
              <p className="text-foreground relative z-10">{block.ev.summary}</p>
              <div className="flex gap-2.5 font-mono text-[10px] text-muted-foreground relative z-10">
                <span>Cred: <span className="text-gold-num font-bold tabular-nums">{block.ev.credibility.toFixed(2)}</span></span>
                <span>Decay: <span className="text-gold-num font-bold tabular-nums">{block.ev.recency.toFixed(2)}</span></span>
                <span>Cons: <span className="text-gold-num font-bold tabular-nums">{block.ev.consensus.toFixed(2)}</span></span>
                <span>Match: <span className="text-gold-num font-bold tabular-nums">{block.ev.criteria_match.toFixed(2)}</span></span>
                <span className="font-bold" style={{
                  ...goldGradientStyle,
                  filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))',
                }}>E={block.ev.composite.toFixed(3)}</span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground relative z-10">
                <span className="text-gold-num font-bold tabular-nums">{(block.startProb * 100).toFixed(1)}%</span>
                <span className="mx-1" style={{ color: 'hsl(43, 82%, 55%)' }}>→</span>
                <span className="text-gold-num font-bold tabular-nums">{(block.endProb * 100).toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Posterior bar — gold metallic */}
      <div className="flex items-center gap-3 py-1.5 mt-2 pt-3"
        style={{ borderTop: '1px solid hsla(43, 96%, 56%, 0.15)' }}
      >
        <div className="w-36 text-[10px] font-mono font-bold uppercase tracking-wider" style={{
          ...goldGradientStyle,
          filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))',
        }}>Posterior</div>
        <div className="flex-1 h-8 rounded-lg relative overflow-hidden"
          style={{
            background: 'rgba(8, 10, 28, 0.6)',
            border: '1px solid hsla(43, 96%, 56%, 0.22)',
            boxShadow: [
              'inset 0 1px 0 hsla(43, 96%, 56%, 0.08)',
              'inset 0 -1px 0 hsla(232, 30%, 2%, 0.35)',
              '0 0 20px -6px hsla(43, 96%, 56%, 0.12)',
            ].join(', '),
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
          <motion.div
            className="absolute left-0 top-0 h-full rounded-lg"
            style={{
              background: 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.35), hsla(48, 100%, 72%, 0.2), hsla(48, 100%, 67%, 0.08))',
              boxShadow: '0 0 32px -6px hsla(43, 96%, 56%, 0.3), inset 0 1px 0 hsla(48, 100%, 80%, 0.12)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(blocks.length > 0 ? blocks[blocks.length - 1].endProb : prior) * 100}%` }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs font-bold tabular-nums" style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.3)) drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.5))',
          }}>
            {((blocks.length > 0 ? blocks[blocks.length - 1].endProb : prior) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
