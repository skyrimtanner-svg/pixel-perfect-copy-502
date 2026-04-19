import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Scale, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { glassInner, specularReflection } from '@/lib/glass-styles';
import { DecisionProvenance } from '@/components/DecisionProvenance';
import type { EvidenceItem, BayesBundle } from '@/hooks/useMilestoneAPI';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

interface ExplainabilityPanelProps {
  bayes: BayesBundle;
  evidence: EvidenceItem[];
  milestoneId?: string;
}

interface DriverItem {
  source: string;
  summary: string | null;
  direction: string;
  delta_log_odds: number;
  credibility: number;
  composite: number;
  impactPct: number;
}

function DriverRow({ item, rank }: { item: DriverItem; rank: number }) {
  const isSupport = item.direction === 'supports';
  const isContradict = item.direction === 'contradicts';
  const color = isSupport ? 'hsl(155, 82%, 55%)' : isContradict ? 'hsl(0, 72%, 60%)' : 'hsl(220, 10%, 55%)';
  const bgTint = isSupport ? 'hsla(155, 82%, 48%, 0.06)' : isContradict ? 'hsla(0, 72%, 55%, 0.06)' : 'transparent';

  return (
    <motion.div
      initial={{ opacity: 0, x: isSupport ? -8 : 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.08, duration: 0.3 }}
      className="rounded-lg p-3 relative overflow-hidden"
      style={{
        ...glassInner,
        background: `linear-gradient(135deg, ${bgTint}, rgba(8, 10, 28, 0.7))`,
        border: `1px solid ${isSupport ? 'hsla(155, 82%, 48%, 0.15)' : isContradict ? 'hsla(0, 72%, 55%, 0.15)' : 'hsla(220, 10%, 72%, 0.1)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{
              background: `${color}22`,
              color,
            }}>
              #{rank + 1}
            </span>
            <span className="text-[10px] font-mono font-bold truncate" style={{ color }}>
              {item.source}
            </span>
          </div>
          {item.summary && (
            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{item.summary}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="font-mono text-xs font-bold tabular-nums" style={{ color }}>
            {item.delta_log_odds > 0 ? '+' : ''}{item.delta_log_odds.toFixed(2)} LO
          </span>
          <span className="text-[9px] font-mono text-muted-foreground tabular-nums">
            {item.impactPct.toFixed(0)}% of shift
          </span>
          <span className="text-[9px] font-mono text-muted-foreground tabular-nums">
            Cred {item.credibility.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function ExplainabilityPanel({ bayes, evidence, milestoneId }: ExplainabilityPanelProps) {
  const { prior, posterior, delta_log_odds, contributions } = bayes;
  const resolvedMilestoneId = milestoneId ?? evidence[0]?.milestone_id;
  const deltaPP = (posterior - prior) * 100;
  const isPositive = deltaPP >= 0;

  // Build driver list from contributions + evidence metadata
  const totalAbsDelta = contributions.reduce((s, c) => s + Math.abs(c.delta_log_odds), 0) || 1;

  const evidenceMap = new Map(evidence.map(e => [e.id, e]));
  const drivers: DriverItem[] = contributions
    .map(c => {
      const ev = evidenceMap.get(c.evidence_id);
      return {
        source: ev?.source ?? c.evidence_id,
        summary: ev?.summary ?? null,
        direction: ev?.direction ?? (c.delta_log_odds > 0 ? 'supports' : 'contradicts'),
        delta_log_odds: c.delta_log_odds,
        credibility: ev?.credibility ?? 0,
        composite: c.composite,
        impactPct: (Math.abs(c.delta_log_odds) / totalAbsDelta) * 100,
      };
    })
    .sort((a, b) => Math.abs(b.delta_log_odds) - Math.abs(a.delta_log_odds));

  const supporting = drivers.filter(d => d.direction === 'supports').slice(0, 3);
  const contradicting = drivers.filter(d => d.direction === 'contradicts').slice(0, 3);
  const ambiguous = drivers.filter(d => d.direction === 'ambiguous');

  // Force balance
  const totalSupport = drivers.filter(d => d.direction === 'supports').reduce((s, d) => s + Math.abs(d.delta_log_odds), 0);
  const totalContradict = drivers.filter(d => d.direction === 'contradicts').reduce((s, d) => s + Math.abs(d.delta_log_odds), 0);
  const totalForce = totalSupport + totalContradict || 1;
  const supportPct = (totalSupport / totalForce) * 100;
  const contradictPct = (totalContradict / totalForce) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4 mt-4"
    >
      {/* Net Movement Summary */}
      <div className="rounded-xl p-4 relative overflow-hidden" style={{
        ...glassInner,
        border: `1px solid ${isPositive ? 'hsla(43, 96%, 56%, 0.15)' : 'hsla(0, 72%, 55%, 0.2)'}`,
      }}>
        <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl" style={specularReflection} />
        <h4 className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold mb-3 relative z-10" style={goldGradientStyle}>
          Net Movement
        </h4>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-[9px] font-mono text-muted-foreground mb-0.5">Prior</div>
              <div className="font-mono text-sm font-bold tabular-nums" style={goldGradientStyle}>
                {(prior * 100).toFixed(1)}%
              </div>
            </div>
            <div className="flex items-center" style={{ color: isPositive ? 'hsl(43, 96%, 56%)' : 'hsl(0, 72%, 58%)' }}>
              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
            <div className="text-center">
              <div className="text-[9px] font-mono text-muted-foreground mb-0.5">Posterior</div>
              <div className="font-mono text-sm font-bold tabular-nums" style={isPositive ? goldGradientStyle : { color: 'hsl(0, 72%, 58%)' }}>
                {(posterior * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg font-bold tabular-nums" style={isPositive ? {
              ...goldGradientStyle, filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.3))',
            } : { color: 'hsl(0, 72%, 58%)', textShadow: '0 0 8px hsla(0, 72%, 55%, 0.3)' }}>
              {isPositive ? '+' : ''}{deltaPP.toFixed(1)}pp
            </div>
            <div className="font-mono text-[10px] text-muted-foreground tabular-nums">
              Δ {delta_log_odds > 0 ? '+' : ''}{delta_log_odds.toFixed(2)} log-odds
            </div>
          </div>
        </div>
      </div>

      {/* Force Balance Bar */}
      {(totalSupport > 0 || totalContradict > 0) && (
        <div className="rounded-xl p-4 relative overflow-hidden" style={{
          ...glassInner,
          border: '1px solid hsla(220, 10%, 72%, 0.12)',
        }}>
          <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl" style={specularReflection} />
          <div className="flex items-center justify-between mb-2 relative z-10">
            <h4 className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold flex items-center gap-1.5" style={goldGradientStyle}>
              <Scale className="w-3 h-3" style={{ color: 'hsl(43, 96%, 56%)' }} />
              Force Balance
            </h4>
            <span className="text-[9px] font-mono text-muted-foreground">
              {totalSupport.toFixed(2)} LO ↑ vs {totalContradict.toFixed(2)} LO ↓
            </span>
          </div>
          <div className="relative h-5 rounded-full overflow-hidden flex relative z-10" style={{
            background: 'rgba(8, 10, 28, 0.6)',
            border: '1px solid hsla(220, 10%, 72%, 0.1)',
          }}>
            <motion.div
              className="h-full"
              style={{
                background: 'linear-gradient(90deg, hsl(155, 82%, 40%), hsl(155, 82%, 55%))',
                boxShadow: 'inset 0 1px 0 hsla(155, 82%, 70%, 0.3), 0 0 12px -4px hsla(155, 82%, 55%, 0.5)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${supportPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            <motion.div
              className="h-full"
              style={{
                background: 'linear-gradient(90deg, hsl(0, 72%, 55%), hsl(0, 72%, 45%))',
                boxShadow: 'inset 0 1px 0 hsla(0, 72%, 70%, 0.3), 0 0 12px -4px hsla(0, 72%, 55%, 0.5)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${contradictPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] font-mono relative z-10">
            <span style={{ color: 'hsl(155, 82%, 55%)' }}>↑ {supportPct.toFixed(0)}% supporting</span>
            <span style={{ color: 'hsl(0, 72%, 60%)' }}>{contradictPct.toFixed(0)}% contradicting ↓</span>
          </div>
        </div>
      )}

      {/* Top Drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supporting */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: 'hsl(155, 82%, 55%)' }} />
            <h4 className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold" style={{ color: 'hsl(155, 82%, 55%)' }}>
              Top Supporting Drivers
            </h4>
          </div>
          {supporting.length === 0 ? (
            <p className="text-[10px] font-mono text-muted-foreground italic px-3 py-2">No supporting evidence</p>
          ) : (
            supporting.map((d, i) => <DriverRow key={d.source + i} item={d} rank={i} />)
          )}
        </div>

        {/* Contradicting */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" style={{ color: 'hsl(0, 72%, 60%)' }} />
            <h4 className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold" style={{ color: 'hsl(0, 72%, 60%)' }}>
              Top Contradicting Drivers
            </h4>
          </div>
          {contradicting.length === 0 ? (
            <p className="text-[10px] font-mono text-muted-foreground italic px-3 py-2">No contradicting evidence</p>
          ) : (
            contradicting.map((d, i) => <DriverRow key={d.source + i} item={d} rank={i} />)
          )}
        </div>
      </div>

      {/* Ambiguous signals note */}
      {ambiguous.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-mono text-muted-foreground" style={{
          ...glassInner, border: '1px solid hsla(220, 10%, 72%, 0.08)',
        }}>
          <Minus className="w-3 h-3 shrink-0" />
          {ambiguous.length} ambiguous signal{ambiguous.length > 1 ? 's' : ''} contributed minimal force ({ambiguous.reduce((s, d) => s + Math.abs(d.delta_log_odds), 0).toFixed(2)} LO total)
        </div>
      )}
    </motion.div>
  );
}
