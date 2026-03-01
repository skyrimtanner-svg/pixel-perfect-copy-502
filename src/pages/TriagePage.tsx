import { useState, useMemo } from 'react';
import { milestones, Domain, domainLabels } from '@/data/milestones';
import { TriageCard } from '@/components/TriageCard';
import { MilestoneModal } from '@/components/MilestoneModal';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import type { Milestone } from '@/data/milestones';

const domains: (Domain | 'all')[] = ['all', 'compute', 'energy', 'connectivity', 'manufacturing', 'biology'];

export default function TriagePage() {
  const { isWonder } = useMode();
  const [selectedDomain, setSelectedDomain] = useState<Domain | 'all'>('all');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const filtered = useMemo(() => {
    const list = selectedDomain === 'all' ? milestones : milestones.filter(m => m.domain === selectedDomain);
    return [...list].sort((a, b) => b.triageScore - a.triageScore);
  }, [selectedDomain]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`font-display text-2xl font-bold ${isWonder ? 'text-gold' : 'text-foreground'}`}>
            {isWonder ? '✦ Triage Queue' : 'Triage Queue'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isWonder
              ? 'The most urgent milestones shaping humanity\'s future — ranked by what matters most.'
              : 'Milestones ranked by urgency, proximity, and magnitude'}
          </p>
        </div>
        <div className={`font-mono text-xs ${isWonder ? 'text-gold-solid' : 'text-muted-foreground'}`}>
          {filtered.length} milestones
        </div>
      </div>

      {/* Domain pills */}
      <div className="flex gap-2 mb-6">
        {domains.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDomain(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              selectedDomain === d
                ? 'bg-primary/12 text-primary border border-primary/25 shadow-[0_0_12px_-4px] shadow-primary/20'
                : 'glass-chrome text-muted-foreground hover:text-foreground'
            }`}
          >
            {d === 'all' ? 'All Domains' : domainLabels[d]}
          </button>
        ))}
      </div>

      {/* Milestone list */}
      <div className={`${isWonder ? 'space-y-3' : 'space-y-1.5'}`}>
        {filtered.map((m, i) => (
          <TriageCard
            key={m.id}
            milestone={m}
            index={i}
            onClick={() => setSelectedMilestone(m)}
          />
        ))}
      </div>

      <MilestoneModal
        milestone={selectedMilestone}
        open={!!selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
      />
    </div>
  );
}
