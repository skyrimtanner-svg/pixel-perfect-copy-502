import { useSystemHealth } from '@/hooks/useSystemHealth';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function Row({ label, value, agentId }: { label: string; value: React.ReactNode; agentId?: string }) {
  return (
    <div className="flex items-center justify-between text-xs font-mono py-1 border-b border-border/20 last:border-0">
      <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
      <span data-agent-id={agentId} className="text-foreground tabular-nums truncate ml-3 max-w-[60%] text-right">{value}</span>
    </div>
  );
}

export function SystemHealthPanel() {
  const h = useSystemHealth();
  const StatusIcon = h.supabaseStatus === 'ok' ? CheckCircle2 : h.supabaseStatus === 'error' ? XCircle : Loader2;
  const statusColor = h.supabaseStatus === 'ok' ? 'text-emerald-400' : h.supabaseStatus === 'error' ? 'text-red-400' : 'text-amber-400 animate-spin';

  return (
    <div data-agent-id="system-health-panel" className="rounded-xl border border-border/40 bg-background/40 backdrop-blur-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <StatusIcon className={`w-4 h-4 ${statusColor}`} />
        <h3 className="text-sm font-mono uppercase tracking-wider">System Health</h3>
      </div>
      <Row label="Supabase" agentId="supabase-status" value={h.supabaseStatus} />
      {h.supabaseError && (
        <div className="my-2 p-2 rounded bg-red-950/40 border border-red-900/40 text-[11px] text-red-300 font-mono">
          <div className="font-bold">Supabase read failed</div>
          <div className="opacity-80">{h.supabaseError}</div>
          <div className="opacity-60 mt-1">Hint: check RLS policies & connectivity.</div>
        </div>
      )}
      <Row label="Auth" value={h.authState} />
      <Row label="Milestones" agentId="milestone-count" value={h.milestoneCount ?? '—'} />
      <Row label="Evidence" agentId="evidence-count" value={h.evidenceCount ?? '—'} />
      <Row label="Pending Evidence" value={h.pendingEvidenceCount ?? '—'} />
      <Row label="Latest Ledger" agentId="latest-ledger-entry" value={h.latestLedgerAt ? new Date(h.latestLedgerAt).toLocaleString() : '—'} />
      <Row label="Latest Hash" agentId="trust-ledger-latest-hash" value={h.latestLedgerHash ? `${h.latestLedgerHash.slice(0, 16)}…` : '—'} />
      <Row label="Latest Scout" value={typeof h.latestScoutAt === 'string' && h.latestScoutAt !== 'admin-only' ? new Date(h.latestScoutAt).toLocaleString() : (h.latestScoutAt ?? '—')} />
      <Row label="Build Mode" value={h.buildMode} />
      <Row label="Demo Mode" value={String(h.demoMode)} />
    </div>
  );
}
