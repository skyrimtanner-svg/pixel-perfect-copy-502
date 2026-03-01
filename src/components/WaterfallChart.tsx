import { Evidence } from '@/data/milestones';
import { motion } from 'framer-motion';

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
        <div className="w-36 text-[10px] font-mono font-bold text-chrome truncate uppercase tracking-wider">Base Prior</div>
        <div className="flex-1 h-8 rounded-lg relative overflow-hidden"
          style={{
            background: 'hsla(230, 22%, 8%, 0.5)',
            border: '1px solid hsla(220, 10%, 72%, 0.06)',
          }}
        >
          <motion.div
            className="absolute left-0 top-0 h-full rounded-lg"
            style={{
              background: 'linear-gradient(90deg, hsla(220, 12%, 70%, 0.18), hsla(220, 12%, 70%, 0.06))',
              boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.06)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${prior * 100}%` }}
            transition={{ duration: 0.6 }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-chrome font-bold tabular-nums">
            {(prior * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Evidence blocks */}
      {blocks.map((block, i) => {
        const widthPct = Math.min(Math.abs(block.ev.delta_log_odds) / maxAbsDelta * 60, 80);
        const isSupport = block.ev.direction === 'supports';
        const isContradict = block.ev.direction === 'contradicts';

        // Metallic colored gradients
        const barBg = isSupport
          ? 'linear-gradient(90deg, hsla(155, 82%, 38%, 0.6), hsla(155, 82%, 55%, 0.4), hsla(155, 82%, 65%, 0.2))'
          : isContradict
          ? 'linear-gradient(90deg, hsla(0, 72%, 40%, 0.6), hsla(0, 72%, 55%, 0.4), hsla(0, 72%, 65%, 0.2))'
          : 'linear-gradient(90deg, hsla(220, 10%, 50%, 0.4), hsla(220, 10%, 50%, 0.15))';

        const textColor = isSupport ? 'text-green-400' : isContradict ? 'text-red-400' : 'text-muted-foreground';
        const barGlow = isSupport
          ? '0 0 20px -4px hsla(155, 82%, 48%, 0.3), inset 0 1px 0 hsla(155, 82%, 70%, 0.15)'
          : isContradict
          ? '0 0 20px -4px hsla(0, 72%, 55%, 0.3), inset 0 1px 0 hsla(0, 72%, 70%, 0.15)'
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
                  background: 'hsla(230, 22%, 8%, 0.35)',
                  border: '1px solid hsla(220, 10%, 72%, 0.04)',
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
              <div className={`w-24 text-right font-mono text-[10px] font-bold tabular-nums ${textColor}`}>
                {block.ev.delta_log_odds > 0 ? '+' : ''}{block.ev.delta_log_odds.toFixed(2)} LO
              </div>
            </div>
            {/* Hover detail */}
            <div className="hidden group-hover:block ml-[9.5rem] mb-2 rounded-xl p-3 text-xs space-y-1.5"
              style={{
                background: 'linear-gradient(168deg, hsla(232, 26%, 8%, 0.9), hsla(232, 22%, 5%, 0.85))',
                border: '1px solid hsla(43, 96%, 56%, 0.1)',
                boxShadow: 'inset 0 1px 0 hsla(220, 14%, 88%, 0.04), 0 8px 24px -6px hsla(232, 30%, 2%, 0.8)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <p className="text-foreground">{block.ev.summary}</p>
              <div className="flex gap-2.5 font-mono text-[10px] text-muted-foreground">
                <span>Cred: <span className="text-gold-num">{block.ev.credibility.toFixed(2)}</span></span>
                <span>Decay: <span className="text-gold-num">{block.ev.recency.toFixed(2)}</span></span>
                <span>Cons: <span className="text-gold-num">{block.ev.consensus.toFixed(2)}</span></span>
                <span>Match: <span className="text-gold-num">{block.ev.criteria_match.toFixed(2)}</span></span>
                <span className="text-gold-solid font-bold">E={block.ev.composite.toFixed(3)}</span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                <span className="text-gold-num">{(block.startProb * 100).toFixed(1)}%</span> → <span className="text-gold-num">{(block.endProb * 100).toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Posterior bar */}
      <div className="flex items-center gap-3 py-1.5 mt-2 pt-3"
        style={{ borderTop: '1px solid hsla(43, 96%, 56%, 0.12)' }}
      >
        <div className="w-36 text-[10px] font-mono font-bold text-gold-solid uppercase tracking-wider">Posterior</div>
        <div className="flex-1 h-8 rounded-lg relative overflow-hidden"
          style={{
            background: 'hsla(230, 22%, 8%, 0.5)',
            border: '1px solid hsla(43, 96%, 56%, 0.15)',
            boxShadow: 'inset 0 1px 0 hsla(43, 96%, 56%, 0.05)',
          }}
        >
          <motion.div
            className="absolute left-0 top-0 h-full rounded-lg"
            style={{
              background: 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.3), hsla(48, 100%, 67%, 0.1))',
              boxShadow: '0 0 28px -6px hsla(43, 96%, 56%, 0.25), inset 0 1px 0 hsla(48, 100%, 80%, 0.1)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(blocks.length > 0 ? blocks[blocks.length - 1].endProb : prior) * 100}%` }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-gold-solid tabular-nums">
            {((blocks.length > 0 ? blocks[blocks.length - 1].endProb : prior) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
