import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';
import { usePublicMilestoneDetail, type PublicEvidence } from '@/hooks/usePublicMilestoneDetail';
import { WaterfallChart } from '@/components/WaterfallChart';
import { motion } from 'framer-motion';

interface Props {
  milestoneId: string | null;
  open: boolean;
  onClose: () => void;
  onPosteriorSimulated?: (changed: boolean) => void;
  onLedgerSeen?: () => void;
}

const dirColor = (d: string) =>
  d === 'supports' ? 'hsl(155, 82%, 55%)' : d === 'contradicts' ? 'hsl(0, 72%, 60%)' : 'hsl(220, 10%, 60%)';

export function DemoMilestoneModal({ milestoneId, open, onClose, onPosteriorSimulated, onLedgerSeen }: Props) {
  const { bundle, loading, error, simulate } = usePublicMilestoneDetail(open ? milestoneId : null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [ledgerOpened, setLedgerOpened] = useState(false);

  const sim = useMemo(() => simulate(excluded), [simulate, excluded]);

  const toggle = (id: string) => {
    setExcluded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      onPosteriorSimulated?.(next.size > 0);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setExcluded(new Set()); setLedgerOpened(false); } }}>
      <DialogContent
        data-agent-id="milestone-modal"
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50"
      >
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="p-4 rounded bg-red-950/40 border border-red-900/40 text-sm text-red-300 font-mono">
            <div className="font-bold">Supabase read failed</div>
            <div>Table: {error.table}</div>
            <div className="opacity-80">{error.message}</div>
            <div className="opacity-60 mt-1">Hint: {error.hint}</div>
          </div>
        )}
        {bundle && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <DialogTitle className="text-2xl font-bold">{bundle.milestone.title}</DialogTitle>
                  <DialogDescription className="text-xs font-mono uppercase tracking-wider mt-1">
                    {bundle.milestone.domain} · {bundle.milestone.tier} · target {bundle.milestone.year}
                  </DialogDescription>
                </div>
                <Badge variant="outline" className="font-mono">DEMO · READ-ONLY</Badge>
              </div>
            </DialogHeader>

            {/* Posterior triplet */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <Stat label="Prior" agent="prior-value" value={`${(bundle.computed.prior * 100).toFixed(1)}%`} />
              <Stat label="Posterior" agent="posterior-value" value={`${(bundle.computed.posterior * 100).toFixed(1)}%`} />
              <Stat label="ΔLog-Odds" agent="delta-log-odds-value" value={`${bundle.computed.delta_log_odds >= 0 ? '+' : ''}${bundle.computed.delta_log_odds.toFixed(2)}`} />
            </div>

            {/* What-if sandbox */}
            <Section title="What-If Sandbox (read-only)">
              <p className="text-xs text-muted-foreground mb-2">Toggle evidence to simulate the posterior. No data is written.</p>
              {sim && (
                <div className="grid grid-cols-4 gap-2 text-[11px] font-mono mb-3">
                  <Mini label="Sim Posterior" agent="whatif-simulated-posterior" value={`${(sim.posterior * 100).toFixed(2)}%`} />
                  <Mini label="ΔLO" value={`${sim.delta_log_odds >= 0 ? '+' : ''}${sim.delta_log_odds.toFixed(2)}`} />
                  <Mini label="Included" value={sim.remaining_count} />
                  <Mini label="Excluded" value={sim.excluded_count} />
                </div>
              )}
            </Section>

            {/* Evidence table */}
            <Section title={`Evidence (${bundle.evidence.length})`}>
              <div data-agent-id="evidence-table" className="space-y-2">
                {bundle.evidence.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No evidence on file.</p>
                )}
                {bundle.evidence.map(ev => (
                  <EvidenceRow key={ev.id} ev={ev} excluded={excluded.has(ev.id)} onToggle={() => toggle(ev.id)} />
                ))}
              </div>
            </Section>

            {/* Waterfall */}
            <Section title="Bayesian Waterfall">
              <div data-agent-id="waterfall-chart">
                <WaterfallChart
                  prior={bundle.computed.prior}
                  evidence={bundle.evidence.filter(e => !excluded.has(e.id)) as any}
                />
              </div>
            </Section>

            {/* Explainability */}
            <Section title="Explainability — Top Drivers">
              <div data-agent-id="explainability-panel" className="space-y-2">
                {topDrivers(bundle.evidence).map((d, i) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 p-2 rounded border border-border/30 bg-background/40 text-xs font-mono">
                    <span className="truncate">#{i + 1} {d.source}</span>
                    <span style={{ color: dirColor(d.direction) }}>{d.delta_log_odds >= 0 ? '+' : ''}{d.delta_log_odds.toFixed(2)} LO</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Trust ledger / provenance */}
            <Section title="Decision Provenance & Trust Ledger">
              <div
                data-agent-id="trust-ledger-panel"
                onMouseEnter={() => { if (!ledgerOpened) { setLedgerOpened(true); onLedgerSeen?.(); } }}
                className="space-y-1.5"
              >
                {bundle.ledger.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No ledger entries yet for this milestone.</p>
                )}
                {bundle.ledger.map((l, i) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 p-2 rounded border border-border/30 bg-background/40 text-[11px] font-mono">
                    <Badge variant="secondary" className="text-[9px]">{l.snapshot_type}</Badge>
                    <span className="opacity-70 truncate flex-1 mx-2" data-agent-id={i === 0 ? 'trust-ledger-latest-hash' : undefined}>
                      {l.sha256_hash.slice(0, 24)}…
                    </span>
                    <span className="tabular-nums">{(l.posterior * 100).toFixed(1)}%</span>
                    <span className="opacity-60">{new Date(l.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function topDrivers(ev: PublicEvidence[]) {
  return [...ev].sort((a, b) => Math.abs(b.delta_log_odds) - Math.abs(a.delta_log_odds)).slice(0, 5);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="my-4">
      <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Stat({ label, value, agent }: { label: string; value: string; agent?: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/50 p-3 text-center">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div data-agent-id={agent} className="text-xl font-mono font-bold tabular-nums text-primary mt-1">{value}</div>
    </div>
  );
}

function Mini({ label, value, agent }: { label: string; value: React.ReactNode; agent?: string }) {
  return (
    <div className="rounded border border-border/30 bg-background/40 p-2 text-center">
      <div className="text-muted-foreground uppercase tracking-wider text-[9px]">{label}</div>
      <div data-agent-id={agent} className="tabular-nums font-bold">{value}</div>
    </div>
  );
}

function EvidenceRow({ ev, excluded, onToggle }: { ev: PublicEvidence; excluded: boolean; onToggle: () => void }) {
  return (
    <motion.div
      data-agent-id={`evidence-row-${ev.id}`}
      layout
      className="rounded-lg border border-border/30 bg-background/40 p-3 text-xs"
      style={{ opacity: excluded ? 0.45 : 1 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-[10px]" style={{ color: dirColor(ev.direction) }}>
              {ev.direction.toUpperCase()}
            </span>
            <span className="font-medium truncate">{ev.source}</span>
          </div>
          <p className="text-muted-foreground line-clamp-2">{ev.summary}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="font-mono tabular-nums text-[11px]" style={{ color: dirColor(ev.direction) }}>
            {ev.delta_log_odds >= 0 ? '+' : ''}{Number(ev.delta_log_odds).toFixed(2)} LO
          </span>
          <button
            data-agent-id={`whatif-toggle-${ev.id}`}
            onClick={onToggle}
            aria-pressed={!excluded}
            className={`text-[10px] font-mono px-2 py-1 rounded border ${excluded ? 'border-border/40 text-muted-foreground' : 'border-primary/40 text-primary'}`}
          >
            {excluded ? 'Include' : 'Exclude'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
