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

  // Build cumulative waterfall
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
        <div className="w-36 text-xs text-muted-foreground truncate font-medium">Base Prior</div>
        <div className="flex-1 h-7 bg-muted/30 rounded-md relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-muted-foreground/20 rounded-md"
            initial={{ width: 0 }}
            animate={{ width: `${prior * 100}%` }}
            transition={{ duration: 0.6 }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
            {(prior * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Evidence blocks */}
      {blocks.map((block, i) => {
        const widthPct = Math.min(Math.abs(block.ev.delta_log_odds) / maxAbsDelta * 60, 80);
        const isSupport = block.ev.direction === 'supports';
        const isContradict = block.ev.direction === 'contradicts';
        const barColor = isSupport ? 'bg-supports' : isContradict ? 'bg-contradicts' : 'bg-ambiguous';
        const textColor = isSupport ? 'text-green-400' : isContradict ? 'text-red-400' : 'text-muted-foreground';

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
              <div className="flex-1 h-7 bg-muted/20 rounded-md relative overflow-hidden">
                <motion.div
                  className={`absolute top-0 h-full rounded-md ${barColor}/70`}
                  style={{ left: isContradict ? `${50 - widthPct}%` : '50%' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                />
                {/* Center line */}
                <div className="absolute left-1/2 top-0 h-full w-px bg-muted-foreground/20" />
              </div>
              <div className={`w-24 text-right font-mono text-xs ${textColor}`}>
                {block.ev.delta_log_odds > 0 ? '+' : ''}{block.ev.delta_log_odds.toFixed(2)} log-odds
              </div>
            </div>
            {/* Hover detail */}
            <div className="hidden group-hover:block ml-[9.5rem] mb-2 glass rounded-lg p-3 text-xs space-y-1">
              <p className="text-foreground">{block.ev.summary}</p>
              <div className="flex gap-3 font-mono text-muted-foreground">
                <span>Cred: {block.ev.credibility.toFixed(2)}</span>
                <span>Decay: {block.ev.recency.toFixed(2)}</span>
                <span>Cons: {block.ev.consensus.toFixed(2)}</span>
                <span>Match: {block.ev.criteria_match.toFixed(2)}</span>
                <span>Composite: {block.ev.composite.toFixed(3)}</span>
              </div>
              <div className="font-mono text-muted-foreground">
                LR: {(block.ev.composite / (1 - block.ev.composite)).toFixed(3)} | {(block.startProb * 100).toFixed(1)}% → {(block.endProb * 100).toFixed(1)}%
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Posterior bar */}
      <div className="flex items-center gap-3 py-1.5 border-t border-border/50 mt-2 pt-3">
        <div className="w-36 text-xs font-semibold text-foreground">Posterior</div>
        <div className="flex-1 h-7 bg-muted/30 rounded-md relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-primary/40 rounded-md"
            initial={{ width: 0 }}
            animate={{ width: `${(blocks.length > 0 ? blocks[blocks.length - 1].endProb : prior) * 100}%` }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-foreground">
            {((blocks.length > 0 ? blocks[blocks.length - 1].endProb : prior) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
