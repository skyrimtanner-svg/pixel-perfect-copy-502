import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMilestones } from '@/hooks/useMilestones';
import { TriageCard } from '@/components/TriageCard';
import { DemoMilestoneModal } from '@/components/DemoMilestoneModal';
import { AgentWalkthroughPanel, type WalkthroughStatus } from '@/components/AgentWalkthroughPanel';
import { SystemHealthPanel } from '@/components/SystemHealthPanel';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Milestone } from '@/data/milestones';

const PRIORITY_IDS = ['agi', 'fusion'];

export default function DemoObservatoryPage() {
  const { milestones, loading } = useMilestones();
  const [selected, setSelected] = useState<Milestone | null>(null);
  const [opened, setOpened] = useState(false);
  const [posteriorChanged, setPosteriorChanged] = useState(false);
  const [ledgerSeen, setLedgerSeen] = useState(false);

  const ordered = useMemo(() => {
    if (!milestones.length) return [];
    const priority = PRIORITY_IDS
      .map(id => milestones.find(m => m.id === id))
      .filter(Boolean) as Milestone[];
    const rest = milestones.filter(m => !PRIORITY_IDS.includes(m.id));
    return [...priority, ...rest];
  }, [milestones]);

  const statuses = useMemo<WalkthroughStatus[]>(() => {
    const s: WalkthroughStatus[] = Array(8).fill('pending');
    if (selected?.id === 'agi' || opened) s[0] = 'complete';
    if (opened) { s[1] = 'complete'; s[2] = 'complete'; }
    s[3] = posteriorChanged ? 'complete' : opened ? 'active' : 'pending';
    s[4] = posteriorChanged ? 'complete' : 'pending';
    if (ledgerSeen) { s[5] = 'complete'; s[6] = 'complete'; }
    else if (posteriorChanged) s[5] = 'active';
    s[7] = 'active'; // system health is always rendered on page
    return s;
  }, [selected, opened, posteriorChanged, ledgerSeen]);

  // Auto-mark step 8 complete after mount
  useEffect(() => {
    const t = setTimeout(() => {}, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div data-agent-id="demo-root" data-demo-mode="true" className="min-h-screen nebula-bg text-foreground">
      <header className="border-b border-border/40 backdrop-blur-md bg-background/60 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-mono uppercase tracking-widest">ÆTH Observatory</h1>
            <Badge variant="outline" className="font-mono text-[10px]">PUBLIC DEMO · READ-ONLY</Badge>
          </div>
          <nav className="flex items-center gap-3 text-xs font-mono">
            <Link to="/agent-readme" className="text-muted-foreground hover:text-foreground">/agent-readme</Link>
            <Link to="/auth" className="text-muted-foreground hover:text-foreground">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <section>
          <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">Triage Queue</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ordered.slice(0, 12).map((m, i) => (
                <div key={m.id} data-agent-id={`triage-card-${m.id}`}>
                  <div data-agent-id={m.id === 'agi' ? 'open-milestone-agi' : undefined}>
                    <TriageCard
                      milestone={m}
                      index={i}
                      onClick={() => { setSelected(m); setOpened(true); }}
                      pulse={null}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <AgentWalkthroughPanel statuses={statuses} />
          <SystemHealthPanel />
          <div className="rounded-xl border border-border/40 bg-background/40 backdrop-blur-md p-4 text-xs font-mono text-muted-foreground">
            <p className="mb-2 text-foreground uppercase tracking-wider text-[10px]">About this view</p>
            <p>Anyone can inspect the engine here. Mutations (approve evidence, recalculate, admin) require sign-in. See <Link to="/agent-readme" className="text-primary underline">/agent-readme</Link>.</p>
          </div>
        </aside>
      </main>

      <DemoMilestoneModal
        milestoneId={selected?.id ?? null}
        open={opened}
        onClose={() => { setOpened(false); }}
        onPosteriorSimulated={(c) => setPosteriorChanged(c)}
        onLedgerSeen={() => setLedgerSeen(true)}
      />
    </div>
  );
}
