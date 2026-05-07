import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export default function AgentReadmePage() {
  return (
    <div className="min-h-screen nebula-bg text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-mono uppercase tracking-widest">Agent README</h1>
            <Badge variant="outline" className="font-mono text-[10px]">FOR HUMANS & AGENTS</Badge>
          </div>
          <p className="text-sm text-muted-foreground">A guide for browser-based AI agents and curious humans inspecting ÆTH Observatory.</p>
        </header>

        <Section title="What is ÆTH Observatory?">
          <p>A Bayesian forecasting engine for technology breakthroughs. Each milestone (e.g. AGI, Fusion) carries a prior, a stream of immutable evidence, and a posterior that updates via Bayesian log-odds.</p>
        </Section>

        <Section title="How to navigate /demo">
          <ul className="list-disc list-inside space-y-1">
            <li>Open <Link className="text-primary underline" to="/demo">/demo</Link> — no login required.</li>
            <li>Use <code className="text-primary">data-agent-id</code> selectors to locate elements.</li>
            <li>Click <code>triage-card-agi</code> to open the AGI milestone modal.</li>
            <li>Inspect <code>posterior-value</code>, <code>prior-value</code>, <code>delta-log-odds-value</code>.</li>
            <li>Toggle <code>whatif-toggle-{'{evidence_id}'}</code> to simulate posterior changes.</li>
            <li>Read <code>whatif-simulated-posterior</code>, <code>trust-ledger-latest-hash</code>.</li>
          </ul>
        </Section>

        <Section title="Real data vs sandbox behavior">
          <ul className="list-disc list-inside space-y-1">
            <li>Milestones, evidence, latent_states, trust_ledger are <strong>real</strong> data, public read-only via RLS.</li>
            <li>The What-If sandbox runs locally in the browser — it does <strong>not</strong> mutate Supabase.</li>
          </ul>
        </Section>

        <Section title="Read-only actions (public)">
          <ul className="list-disc list-inside space-y-1">
            <li>View triage queue, milestone modal, evidence rows, waterfall, provenance.</li>
            <li>Toggle evidence on/off in What-If sandbox.</li>
            <li>Inspect System Health panel.</li>
          </ul>
        </Section>

        <Section title="Admin-only actions (require sign-in)">
          <ul className="list-disc list-inside space-y-1">
            <li>Approve / reject pending evidence.</li>
            <li>Trigger scout runs, recalculate-all, evidence decay.</li>
            <li>Read pending_evidence and scout_logs.</li>
            <li>Edit scout directives or beta invites.</li>
          </ul>
        </Section>

        <Section title="Successful functionality check">
          <ol className="list-decimal list-inside space-y-1">
            <li>Open /demo — page renders with triage cards and System Health.</li>
            <li>Open AGI milestone — modal shows prior, posterior, evidence rows.</li>
            <li>Toggle one evidence row — <code>whatif-simulated-posterior</code> changes.</li>
            <li>Trust Ledger panel shows at least one hash, or a clear empty state.</li>
            <li>System Health shows <code>supabase-status = ok</code>.</li>
          </ol>
        </Section>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border/30">
          <Link to="/demo" className="text-primary underline">→ Go to /demo</Link>
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border/40 bg-background/40 backdrop-blur-md p-4">
      <h2 className="text-sm font-mono uppercase tracking-wider text-primary mb-2">{title}</h2>
      <div className="text-sm text-foreground/90 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}
