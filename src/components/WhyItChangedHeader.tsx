import { motion } from 'framer-motion';
import { ProbabilityRing } from '@/components/ProbabilityRing';
import { Hash, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import { glassInner, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { BayesBundle, CalibrationSnapshot, EvidenceItem } from '@/hooks/useMilestoneAPI';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

interface WhyItChangedHeaderProps {
  posterior: number;
  prior: number;
  snapshotHash: string | null;
  snapshotTimestamp: string | null;
  evidence: EvidenceItem[];
  domainColor: string;
  isNegativeShift: boolean;
  previousValue?: number;
}

function computeEvidenceBalance(evidence: EvidenceItem[]): { label: string; color: string; bgColor: string; borderColor: string } {
  const supports = evidence.filter(e => e.direction === 'supports').length;
  const contradicts = evidence.filter(e => e.direction === 'contradicts').length;
  const total = supports + contradicts;
  if (total === 0) return { label: 'No Signal', color: 'hsl(220, 10%, 55%)', bgColor: 'hsla(220, 10%, 55%, 0.1)', borderColor: 'hsla(220, 10%, 55%, 0.2)' };
  const ratio = Math.min(supports, contradicts) / Math.max(supports, contradicts, 1);
  if (ratio > 0.6) return { label: 'Healthy', color: 'hsl(155, 82%, 55%)', bgColor: 'hsla(155, 82%, 48%, 0.1)', borderColor: 'hsla(155, 82%, 48%, 0.25)' };
  return { label: 'Skewed', color: 'hsl(38, 100%, 58%)', bgColor: 'hsla(38, 100%, 58%, 0.1)', borderColor: 'hsla(38, 100%, 58%, 0.25)' };
}

export function WhyItChangedHeader({
  posterior, prior, snapshotHash, snapshotTimestamp, evidence, domainColor, isNegativeShift, previousValue,
}: WhyItChangedHeaderProps) {
  const balance = computeEvidenceBalance(evidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl p-4 mb-4 relative overflow-hidden"
      style={{
        ...glassInner,
        border: `1px solid ${isNegativeShift ? 'hsla(0, 72%, 55%, 0.2)' : 'hsla(43, 96%, 56%, 0.15)'}`,
        boxShadow: [
          'inset 0 1px 0 hsla(220, 16%, 95%, 0.06)',
          'inset 0 -1px 0 hsla(232, 30%, 2%, 0.4)',
          isNegativeShift
            ? '0 0 32px -8px hsla(0, 72%, 55%, 0.2)'
            : '0 0 32px -8px hsla(43, 96%, 56%, 0.12)',
        ].join(', '),
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[35%] rounded-t-xl" style={specularReflection} />
      <div className="absolute top-0 left-4 right-4 h-px" style={isNegativeShift
        ? { background: 'linear-gradient(90deg, transparent, hsla(0, 72%, 55%, 0.3), transparent)' }
        : goldChromeLine
      } />

      <div className="flex items-center gap-4 relative z-10">
        {/* Large probability ring */}
        <ProbabilityRing
          value={posterior}
          size={72}
          strokeWidth={6}
          domainColor={isNegativeShift ? 'hsl(0, 72%, 55%)' : domainColor}
          useGold={!isNegativeShift}
          isNegativeShift={isNegativeShift}
          previousValue={previousValue}
        />

        <div className="flex-1 min-w-0 space-y-2">
          {/* Snapshot hash line */}
          {snapshotHash && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Hash className="w-3 h-3 shrink-0" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.4))' }} />
              <span className="text-[9px] font-mono font-bold tabular-nums" style={{
                ...goldGradientStyle,
                filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
              }}>
                Snapshot {snapshotHash.slice(0, 12)}…
              </span>
              {snapshotTimestamp && (
                <span className="text-[9px] font-mono text-muted-foreground">
                  • Verified at {new Date(snapshotTimestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <a
                href={`/verify/${snapshotHash}`}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all hover:scale-105"
                style={{
                  background: 'hsla(43, 96%, 56%, 0.08)',
                  border: '1px solid hsla(43, 96%, 56%, 0.2)',
                  color: 'hsl(43, 82%, 60%)',
                }}
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="w-2 h-2" />
                VERIFY
              </a>
            </div>
          )}

          {/* Evidence balance pill */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
              style={{
                background: balance.bgColor,
                border: `1px solid ${balance.borderColor}`,
                color: balance.color,
              }}
            >
              {balance.label === 'Healthy'
                ? <ShieldCheck className="w-2.5 h-2.5" />
                : <AlertTriangle className="w-2.5 h-2.5" />}
              {balance.label}
            </div>
            <span className="text-[9px] font-mono text-muted-foreground">
              {evidence.filter(e => e.direction === 'supports').length}↑ / {evidence.filter(e => e.direction === 'contradicts').length}↓ / {evidence.filter(e => e.direction === 'ambiguous').length}~
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
