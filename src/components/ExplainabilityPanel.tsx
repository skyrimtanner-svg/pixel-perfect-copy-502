import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Bot, User, Shield, AlertTriangle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { glassInner, specularReflection } from '@/lib/glass-styles';
import { Contribution, EvidenceItem } from '@/hooks/useMilestoneAPI';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const, backgroundClip: 'text' as const,
};

interface ExplainabilityPanelProps {
  prior: number;
  posterior: number;
  deltaLogOdds: number;
  contributions: Contribution[];
  evidence: EvidenceItem[];
  trustLedgerEntries?: TrustLedgerEntry[];
}

export interface TrustLedgerEntry {
  id: string;
  snapshot_type: string;
  prior: number;
  posterior: number;
  delta_log_odds: number | null;
  evidence_id: string | null;
  contributions: any;
  created_at: string;
}

interface DriverRow {
  evidenceId: string;
  source: string;
  summary: string;
  direction: string;
  composite: number;
  deltaLogOdds: number;
  credibility: number;
  impactPct: number;
}

function getDirectionIcon(dir: string) {
  if (dir === 'supports') return <TrendingUp className="w-3 h-3" style={{ color: 'hsl(155, 82%, 55%)' }} />;
  if (dir === 'contradicts') return <TrendingDown className="w-3 h-3" style={{ color: 'hsl(4, 82%, 63%)' }} />;
  return <Minus className="w-3 h-3" style={{ color: 'hsl(220, 10%, 55%)' }} />;
}

function getDirectionColor(dir: string) {
  if (dir === 'supports') return 'hsl(155, 82%, 55%)';
  if (dir === 'contradicts') return 'hsl(4, 82%, 63%)';
  return 'hsl(220, 10%, 55%)';
}

function ImpactBar({ value, direction }: { value: number; direction: string }) {
  const width = Math.min(100, Math.abs(value) * 100);
  const color = direction === 'supports' ? 'hsl(155, 82%, 55%)' : direction === 'contradicts' ? 'hsl(4, 82%, 63%)' : 'hsl(220, 10%, 55%)';
  return (
    <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(8, 10, 28, 0.6)', border: '1px solid hsla(220, 10%, 72%, 0.1)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, opacity: 0.7 }}
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.5, delay: 0.1 }}
      />
    </div>
  );
}

function DriverCard({ driver, rank }: { driver: DriverRow; rank: number }) {
  const dirColor = getDirectionColor(driver.direction);
  const dirLabel = driver.direction === 'supports' ? 'SUPPORTS' : driver.direction === 'contradicts' ? 'CONTRADICTS' : 'AMBIGUOUS';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="flex items-start gap-3 py-2.5 px-3 rounded-lg relative overflow-hidden"
      style={{
        ...glassInner,
        border: `1px solid ${driver.direction === 'supports' ? 'hsla(155, 82%, 48%, 0.15)' : driver.direction === 'contradicts' ? 'hsla(4, 82%, 63%, 0.15)' : 'hsla(220, 10%, 72%, 0.08)'}`,
      }}
    >
      <div className="flex items-center gap-2 shrink-0">
        {getDirectionIcon(driver.direction)}
        <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: dirColor }}>
          {driver.deltaLogOdds > 0 ? '+' : ''}{driver.deltaLogOdds.toFixed(2)} LO
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-foreground font-medium truncate">{driver.source}</p>
        {driver.summary && (
          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{driver.summary}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[8px] font-mono font-bold uppercase tracking-wider" style={{ color: dirColor }}>{dirLabel}</span>
          <span className="text-[8px] font-mono text-muted-foreground">E={driver.composite.toFixed(3)}</span>
          <span className="text-[8px] font-mono text-muted-foreground">Cred={driver.credibility.toFixed(2)}</span>
          <ImpactBar value={driver.impactPct} direction={driver.direction} />
          <span className="text-[8px] font-mono font-bold tabular-nums" style={{ color: dirColor }}>
            {(driver.impactPct * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function ExplainabilityPanel({
  prior, posterior, deltaLogOdds, contributions, evidence,
}: ExplainabilityPanelProps) {
  // Build driver rows by merging contributions with evidence metadata
  const drivers = useMemo(() => {
    const evidenceMap = new Map(evidence.map(e => [e.id, e]));
    const totalAbsDelta = contributions.reduce((s, c) => s + Math.abs(c.delta_log_odds), 0);

    return contributions
      .map(c => {
        const ev = evidenceMap.get(c.evidence_id);
        if (!ev) return null;
        return {
          evidenceId: c.evidence_id,
          source: ev.source,
          summary: ev.summary || '',
          direction: ev.direction,
          composite: c.composite,
          deltaLogOdds: c.delta_log_odds,
          credibility: ev.credibility,
          impactPct: totalAbsDelta > 0 ? Math.abs(c.delta_log_odds) / totalAbsDelta : 0,
        } as DriverRow;
      })
      .filter(Boolean) as DriverRow[];
  }, [contributions, evidence]);

  const topSupporting = useMemo(() =>
    drivers
      .filter(d => d.direction === 'supports')
      .sort((a, b) => Math.abs(b.deltaLogOdds) - Math.abs(a.deltaLogOdds))
      .slice(0, 3),
    [drivers]
  );

  const topContradicting = useMemo(() =>
    drivers
      .filter(d => d.direction === 'contradicts')
      .sort((a, b) => Math.abs(b.deltaLogOdds) - Math.abs(a.deltaLogOdds))
      .slice(0, 3),
    [drivers]
  );

  const delta = posterior - prior;
  const deltaPP = delta * 100;
  const isPositive = delta >= 0;

  const supportCount = drivers.filter(d => d.direction === 'supports').length;
  const contradictCount = drivers.filter(d => d.direction === 'contradicts').length;
  const ambiguousCount = drivers.filter(d => d.direction === 'ambiguous').length;

  const totalSupportLO = drivers.filter(d => d.direction === 'supports').reduce((s, d) => s + d.deltaLogOdds, 0);
  const totalContradictLO = drivers.filter(d => d.direction === 'contradicts').reduce((s, d) => s + d.deltaLogOdds, 0);

  return (
    <div className="space-y-4">
      {/* ═══ Movement Summary ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4 relative overflow-hidden"
        style={{
          ...glassInner,
          border: `1px solid ${isPositive ? 'hsla(155, 82%, 48%, 0.2)' : 'hsla(4, 82%, 63%, 0.2)'}`,
          boxShadow: `0 0 24px -8px ${isPositive ? 'hsla(155, 82%, 48%, 0.15)' : 'hsla(4, 82%, 63%, 0.15)'}`,
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[35%] rounded-t-xl" style={specularReflection} />

        <div className="flex items-center justify-between relative z-10 mb-3">
          <h3 className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold" style={goldGradientStyle}>
            WHY DID THIS MOVE?
          </h3>
          <div className="flex items-center gap-1.5">
            {isPositive
              ? <ArrowUpRight className="w-4 h-4" style={{ color: 'hsl(155, 82%, 55%)', filter: 'drop-shadow(0 0 6px hsla(155, 82%, 55%, 0.4))' }} />
              : <ArrowDownRight className="w-4 h-4" style={{ color: 'hsl(4, 82%, 63%)', filter: 'drop-shadow(0 0 6px hsla(4, 82%, 63%, 0.4))' }} />
            }
            <span className="font-mono text-sm font-bold tabular-nums" style={{ color: isPositive ? 'hsl(155, 82%, 55%)' : 'hsl(4, 82%, 63%)' }}>
              {deltaPP >= 0 ? '+' : ''}{deltaPP.toFixed(1)}pp
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 relative z-10">
          <div className="text-center">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Prior</div>
            <div className="font-mono text-sm font-bold tabular-nums" style={goldGradientStyle}>{(prior * 100).toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">→ Posterior</div>
            <div className="font-mono text-sm font-bold tabular-nums" style={{
              color: isPositive ? 'hsl(155, 82%, 55%)' : 'hsl(4, 82%, 63%)',
              textShadow: `0 0 8px ${isPositive ? 'hsla(155, 82%, 55%, 0.3)' : 'hsla(4, 82%, 63%, 0.3)'}`,
            }}>{(posterior * 100).toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Net Δ LO</div>
            <div className="font-mono text-sm font-bold tabular-nums" style={{ color: isPositive ? 'hsl(155, 82%, 55%)' : 'hsl(4, 82%, 63%)' }}>
              {deltaLogOdds >= 0 ? '+' : ''}{deltaLogOdds.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Force balance bar */}
        <div className="mt-3 relative z-10">
          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground mb-1">
            <span>{supportCount} supporting (+{totalSupportLO.toFixed(2)} LO)</span>
            <span>{contradictCount} contradicting ({totalContradictLO.toFixed(2)} LO)</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(8, 10, 28, 0.6)', border: '1px solid hsla(220, 10%, 72%, 0.1)' }}>
            {totalSupportLO !== 0 && (
              <motion.div
                className="h-full"
                style={{ background: 'hsl(155, 82%, 55%)', opacity: 0.6 }}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.abs(totalSupportLO) / (Math.abs(totalSupportLO) + Math.abs(totalContradictLO) + 0.001) * 100}%`,
                }}
                transition={{ duration: 0.6 }}
              />
            )}
            {totalContradictLO !== 0 && (
              <motion.div
                className="h-full"
                style={{ background: 'hsl(4, 82%, 63%)', opacity: 0.6 }}
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.abs(totalContradictLO) / (Math.abs(totalSupportLO) + Math.abs(totalContradictLO) + 0.001) * 100}%`,
                }}
                transition={{ duration: 0.6 }}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ Top Drivers ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Supporting drivers */}
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold mb-2 flex items-center gap-1.5"
            style={{ color: 'hsl(155, 82%, 55%)' }}>
            <TrendingUp className="w-3 h-3" />
            TOP SUPPORTING DRIVERS
          </h4>
          <div className="space-y-1.5">
            {topSupporting.length > 0 ? topSupporting.map((d, i) => (
              <DriverCard key={d.evidenceId} driver={d} rank={i} />
            )) : (
              <p className="text-[10px] text-muted-foreground font-mono px-3 py-2">No supporting evidence</p>
            )}
          </div>
        </div>

        {/* Contradicting drivers */}
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.12em] font-mono font-bold mb-2 flex items-center gap-1.5"
            style={{ color: 'hsl(4, 82%, 63%)' }}>
            <TrendingDown className="w-3 h-3" />
            TOP CONTRADICTING DRIVERS
          </h4>
          <div className="space-y-1.5">
            {topContradicting.length > 0 ? topContradicting.map((d, i) => (
              <DriverCard key={d.evidenceId} driver={d} rank={i} />
            )) : (
              <p className="text-[10px] text-muted-foreground font-mono px-3 py-2">No contradicting evidence</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Signal Summary ═══ */}
      {ambiguousCount > 0 && (
        <div className="text-[10px] font-mono text-muted-foreground text-center">
          + {ambiguousCount} ambiguous signal{ambiguousCount > 1 ? 's' : ''} with minimal impact
        </div>
      )}
    </div>
  );
}