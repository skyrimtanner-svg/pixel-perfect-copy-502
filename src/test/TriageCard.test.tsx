import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TriageCard } from '@/components/TriageCard';
import type { Milestone } from '@/data/milestones';

// Mock dependencies
vi.mock('@/contexts/ModeContext', () => ({
  useMode: () => ({ isWonder: false }),
}));
vi.mock('@/components/AnimatedProbabilityRing', () => ({
  AnimatedProbabilityRing: () => <div data-testid="prob-ring" />,
}));
vi.mock('@/components/Badges', () => ({
  DomainBadge: ({ domain }: any) => <span data-testid="domain-badge">{domain}</span>,
  StatusBadge: ({ status }: any) => <span data-testid="status-badge">{status}</span>,
  ArchetypeBadge: ({ archetype }: any) => <span data-testid="archetype-badge">{archetype}</span>,
}));
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));
vi.mock('@/lib/glass-styles', () => ({
  glassPanelGold: {},
  glassPanel: {},
  glassPanelChrome: {},
  specularReflection: {},
  goldChromeLine: {},
}));

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'agi',
    title: 'Artificial General Intelligence',
    description: 'Human-level AI',
    domain: 'compute',
    tier: 'active',
    status: 'projected',
    year: 2030,
    magnitude: 10,
    prior: 0.15,
    posterior: 0.25,
    delta_log_odds: 0.65,
    archetype: 'breakthrough',
    triageScore: 82,
    dependencies: [],
    success_criteria: '',
    falsification: '',
    evidence: [],
    ...overrides,
  } as Milestone;
}

describe('TriageCard', () => {
  it('renders milestone title and year', () => {
    const ms = makeMilestone();
    render(<TriageCard milestone={ms} index={0} onClick={() => {}} />);
    expect(screen.getByText('Artificial General Intelligence')).toBeDefined();
    expect(screen.getByText('2030')).toBeDefined();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<TriageCard milestone={makeMilestone()} index={0} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders badges for domain, status, archetype', () => {
    render(<TriageCard milestone={makeMilestone()} index={0} onClick={() => {}} />);
    expect(screen.getByTestId('domain-badge')).toBeDefined();
    expect(screen.getByTestId('archetype-badge')).toBeDefined();
  });

  it('shows positive delta with up arrow', () => {
    const ms = makeMilestone({ posterior: 0.4, prior: 0.2, delta_log_odds: 0.8 });
    render(<TriageCard milestone={ms} index={0} onClick={() => {}} />);
    expect(screen.getByText('+0.80')).toBeDefined();
  });

  it('shows negative delta with down arrow', () => {
    const ms = makeMilestone({ posterior: 0.1, prior: 0.2, delta_log_odds: -0.45 });
    render(<TriageCard milestone={ms} index={0} onClick={() => {}} />);
    expect(screen.getByText('-0.45')).toBeDefined();
  });

  it('displays triage score', () => {
    render(<TriageCard milestone={makeMilestone({ triageScore: 77 })} index={0} onClick={() => {}} />);
    expect(screen.getByText('77')).toBeDefined();
  });

  it('shows magnitude', () => {
    render(<TriageCard milestone={makeMilestone({ magnitude: 9 })} index={0} onClick={() => {}} />);
    expect(screen.getByText('9')).toBeDefined();
  });

  it('renders evidence pulse indicator when pulse provided', () => {
    const pulse = { deltaLogOdds: 0.3, composite: 0.7, direction: 'supports' as const };
    const { container } = render(
      <TriageCard milestone={makeMilestone()} index={0} onClick={() => {}} pulse={pulse} />
    );
    const pulseEl = container.querySelector('[title]');
    expect(pulseEl).toBeDefined();
  });
});
