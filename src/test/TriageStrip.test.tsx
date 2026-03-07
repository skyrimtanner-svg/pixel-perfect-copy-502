import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TriageStrip } from '@/components/TriageStrip';
import type { Milestone } from '@/data/milestones';

// Mock dependencies
vi.mock('@/contexts/ModeContext', () => ({
  useMode: () => ({ isWonder: false }),
}));
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/glass-styles', () => ({
  glassPanelGold: {},
  specularReflection: {},
  goldChromeLine: {},
}));

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'test-1',
    title: 'Test Milestone',
    description: 'A test milestone',
    domain: 'compute',
    tier: 'active',
    status: 'projected',
    year: 2030,
    magnitude: 8,
    prior: 0.3,
    posterior: 0.4,
    delta_log_odds: 0.5,
    archetype: 'breakthrough',
    triageScore: 55,
    dependencies: [],
    success_criteria: '',
    falsification: '',
    evidence: [],
    ...overrides,
  } as Milestone;
}

describe('TriageStrip', () => {
  it('renders null when no breakthroughs or bottlenecks', () => {
    const milestones = [
      makeMilestone({ archetype: 'sleeper', delta_log_odds: -0.1 }),
    ];
    const { container } = render(<TriageStrip milestones={milestones} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders breakthroughs with positive delta', () => {
    const milestones = [
      makeMilestone({ id: 'b1', title: 'Fusion Power', archetype: 'breakthrough', delta_log_odds: 1.2, triageScore: 80 }),
      makeMilestone({ id: 'b2', title: 'Quantum Compute', archetype: 'breakthrough', delta_log_odds: 0.8, triageScore: 70 }),
    ];
    render(<TriageStrip milestones={milestones} />);
    expect(screen.getByText('Fusion Power')).toBeDefined();
    expect(screen.getByText('Quantum Compute')).toBeDefined();
  });

  it('renders bottleneck items', () => {
    const milestones = [
      makeMilestone({ id: 'bn1', title: 'Energy Storage', archetype: 'bottleneck', delta_log_odds: -0.5, triageScore: 60 }),
    ];
    render(<TriageStrip milestones={milestones} />);
    expect(screen.getByText('Energy Storage')).toBeDefined();
  });

  it('limits breakthroughs to top 3', () => {
    const milestones = Array.from({ length: 5 }, (_, i) =>
      makeMilestone({
        id: `b${i}`,
        title: `BT-${i}`,
        archetype: 'breakthrough',
        delta_log_odds: 1.0 + i,
        triageScore: 50 + i * 10,
      })
    );
    render(<TriageStrip milestones={milestones} />);
    // Only top 3 by triage score should appear
    const items = screen.getAllByText(/BT-/);
    expect(items.length).toBe(3);
  });

  it('shows TRIAGE STRIP label in analyst mode', () => {
    const milestones = [
      makeMilestone({ archetype: 'breakthrough', delta_log_odds: 0.5 }),
    ];
    render(<TriageStrip milestones={milestones} />);
    expect(screen.getByText('TRIAGE STRIP')).toBeDefined();
  });
});
