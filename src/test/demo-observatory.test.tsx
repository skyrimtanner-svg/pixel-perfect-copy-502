import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DemoObservatoryPage from '@/pages/DemoObservatoryPage';
import { ModeProvider } from '@/contexts/ModeContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock Supabase client with deterministic data
vi.mock('@/integrations/supabase/client', () => {
  const milestones = [
    { id: 'agi', title: 'AGI', year: 2030, domain: 'compute', tier: 'speculative', status: 'projected', magnitude: 10, prior: 0.2, posterior: 0.45, delta_log_odds: 1.1, success_criteria: '', falsification: '', dependencies: [], description: '', archetype: 'wildcard', triage_score: 9.5, created_at: '2025-01-01' },
    { id: 'fusion', title: 'Fusion', year: 2035, domain: 'energy', tier: 'plausible', status: 'projected', magnitude: 9, prior: 0.3, posterior: 0.5, delta_log_odds: 0.8, success_criteria: '', falsification: '', dependencies: [], description: '', archetype: 'breakthrough', triage_score: 8.2, created_at: '2025-01-02' },
  ];
  const evidence = [
    { id: 'ev1', milestone_id: 'agi', source: 'OpenAI o4', type: 'benchmark', direction: 'supports', credibility: 0.9, recency: 0.95, consensus: 0.7, criteria_match: 0.8, composite: 0.48, delta_log_odds: 0.96, date: '2026-01', summary: 'GPT-5 strong reasoning' },
    { id: 'ev2', milestone_id: 'agi', source: 'Skeptic Paper', type: 'peer_reviewed', direction: 'contradicts', credibility: 0.85, recency: 0.6, consensus: 0.5, criteria_match: 0.6, composite: 0.15, delta_log_odds: -0.3, date: '2025-09', summary: 'Reasoning gap' },
  ];
  const ledger = [
    { id: 'l1', snapshot_type: 'evidence_update', posterior: 0.45, prior: 0.2, delta_log_odds: 1.1, sha256_hash: 'abc123def4567890abc123def4567890abc123def4567890abc123def4567890', created_at: '2026-04-01' },
  ];

  const builder = (table: string) => {
    const state: any = { table, filters: {}, _order: null, _limit: null, _head: false, _count: null };
    const exec = async () => {
      let rows: any[] = [];
      if (table === 'milestones') rows = milestones;
      else if (table === 'evidence') rows = evidence;
      else if (table === 'trust_ledger') rows = ledger;
      else if (table === 'latent_states') rows = [];
      else rows = [];
      if (state.filters.eq) {
        const [col, val] = state.filters.eq;
        rows = rows.filter((r: any) => r[col] === val);
      }
      if (state._head) return { data: null, count: rows.length, error: null };
      return { data: rows, count: rows.length, error: null };
    };
    const chain: any = {
      select: (_cols?: string, opts?: any) => { if (opts?.head) state._head = true; return chain; },
      eq: (col: string, val: any) => { state.filters.eq = [col, val]; return chain; },
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => { const r = await exec(); return { data: r.data?.[0] ?? null, error: r.error }; },
      single: async () => { const r = await exec(); return { data: r.data?.[0] ?? null, error: r.error }; },
      then: (resolve: any) => exec().then(resolve),
    };
    return chain;
  };

  return {
    supabase: {
      from: (table: string) => builder(table),
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => {},
      },
      channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
      removeChannel: () => {},
    },
  };
});

function renderDemo() {
  return render(
    <MemoryRouter initialEntries={['/demo']}>
      <AuthProvider>
        <ModeProvider>
          <DemoObservatoryPage />
        </ModeProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('DemoObservatoryPage (E2E-style)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without auth', async () => {
    renderDemo();
    expect(await screen.findByText(/Triage Queue/i)).toBeInTheDocument();
    expect(screen.getByText(/PUBLIC DEMO/i)).toBeInTheDocument();
  });

  it('shows at least one milestone card', async () => {
    renderDemo();
    await waitFor(() => {
      expect(document.querySelector('[data-agent-id="triage-card-agi"]')).toBeInTheDocument();
    });
  });

  it('opens AGI milestone modal', async () => {
    renderDemo();
    const card = await waitFor(() => {
      const el = document.querySelector('[data-agent-id="triage-card-agi"] button');
      if (!el) throw new Error('not yet');
      return el;
    });
    fireEvent.click(card);
    await waitFor(() => {
      expect(document.querySelector('[data-agent-id="milestone-modal"]')).toBeInTheDocument();
    });
  });

  it('renders evidence rows and what-if toggle changes simulated posterior', async () => {
    renderDemo();
    const card = await waitFor(() => {
      const el = document.querySelector('[data-agent-id="triage-card-agi"] button') as HTMLElement | null;
      if (!el) throw new Error('no card');
      return el;
    });
    fireEvent.click(card);

    await waitFor(() => {
      if (!document.querySelector('[data-agent-id="evidence-row-ev1"]')) throw new Error('no row');
    });

    const before = document.querySelector('[data-agent-id="whatif-simulated-posterior"]')?.textContent;
    const toggle = document.querySelector('[data-agent-id="whatif-toggle-ev1"]') as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    fireEvent.click(toggle);

    await waitFor(() => {
      const after = document.querySelector('[data-agent-id="whatif-simulated-posterior"]')?.textContent;
      expect(after).not.toEqual(before);
    });
  });

  it('displays trust ledger panel with hash or empty state', async () => {
    renderDemo();
    const card = await waitFor(() => {
      const el = document.querySelector('[data-agent-id="triage-card-agi"] button') as HTMLElement | null;
      if (!el) throw new Error('no card');
      return el;
    });
    fireEvent.click(card);
    await waitFor(() => {
      const panel = document.querySelector('[data-agent-id="trust-ledger-panel"]');
      expect(panel).toBeInTheDocument();
    });
  });

  it('system health panel displays Supabase status', async () => {
    renderDemo();
    await waitFor(() => {
      expect(document.querySelector('[data-agent-id="system-health-panel"]')).toBeInTheDocument();
      expect(document.querySelector('[data-agent-id="supabase-status"]')).toBeInTheDocument();
    });
  });
});
