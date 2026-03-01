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
        <div className="w-36 text-xs text-chrome font-medium truncate">Base Prior</div>
        <div className="flex-1 h-8 rounded-lg relative overflow-hidden"
          style={{
            background: 'hsla(230, 22%, 8%, 0.5)',
            border: '1px solid hsla(220, 10%, 72%, 0.06)',
          }}
        >
          <motion.div
            className="absolute left-0 top-0 h-full rounded-lg"
            style={{
              background: 'linear-gradient(90deg, hsla(220, 10%, 72%, 0.15), hsla(220, 10%, 72%, 0.06))',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${prior * 100}%` }}
            transition={{ duration: 0.6 }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-chrome">
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
          ? 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.5), hsla(48, 100%, 67%, 0.2))'
          : isContradict
          ? 'linear-gradient(90deg, hsla(0, 72%, 55%, 0.5), hsla(0, 72%, 55%, 0.2))'
          : 'linear-gradient(90deg, hsla(220, 10%, 50%, 0.4), hsla(220, 10%, 50%, 0.15))';

        const textColor = isSupport ? 'text-gold-solid' : isContradict ? 'text-red-400' : 'text-muted-foreground';
        const barGlow = isSupport
          ? '0 0 16px -4px hsla(43, 96%, 56%, 0.25)'
          : isContradict
          ? '0 0 16px -4px hsla(0, 72%, 55%, 0.25)'
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
              <div className="w-36 text-xs text-muted-foreground truncate" title={block.ev.source}>
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
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                />
                <div className="absolute left-1/2 top-0 h-full w-px"
                  style={{ background: 'hsla(220, 10%, 72%, 0.08)' }}
                />
              </div>
              <div className={`w-24 text-right font-mono text-xs ${textColor}`}>
                {block.ev.delta_log_odds > 0 ? '+' : ''}{block.ev.delta_log_odds.toFixed(2)} LO
              </div>
            </div>
            {/* Hover detail */}
            <div className="hidden group-hover:block ml-[9.5rem] mb-2 glass-chrome rounded-lg p-3 text-xs space-y-1"
              style={{ border: '1px solid hsla(43, 96%, 56%, 0.08)' }}
            >
              <p className="text-foreground">{block.ev.summary}</p>
              <div className="flex gap-3 font-mono text-muted-foreground">
                <span>Cred: <span className="text-gold-num">{block.ev.credibility.toFixed(2)}</span></span>
                <span>Decay: <span className="text-gold-num">{block.ev.recency.toFixed(2)}</span></span>
                <span>Cons: <span className="text-gold-num">{block.ev.consensus.toFixed(2)}</span></span>
                <span>Match: <span className="text-gold-num">{block.ev.criteria_match.toFixed(2)}</span></span>
                <span className="text-gold-solid font-semibold">E={block.ev.composite.toFixed(3)}</span>
              </div>
              <div className="font-mono text-muted-foreground">
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
        <div className="w-36 text-xs font-semibold text-gold">Posterior</div>
        <div className="flex-1 h-8 rounded-lg relative overflow-hidden"
          style={{
            background: 'hsla(230, 22%, 8%, 0.5)',
            border: '1px solid hsla(43, 96%, 56%, 0.12)',
          }}
        >
          <motion.div
            className="absolute left-0 top-0 h-full rounded-lg"
            style={{
              background: 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.25), hsla(48, 100%, 67%, 0.08))',
              boxShadow: '0 0 24px -6px hsla(43, 96%, 56%, 0.2)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(blocks.length > 0 ? blocks[blocks.length - 1].endProb : prior) * 100}%` }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-gold">
            {((blocks.length > 0 ? blocks[blocks.length - 1].endProb : prior) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
