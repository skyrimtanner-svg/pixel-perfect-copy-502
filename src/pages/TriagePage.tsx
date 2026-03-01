import { useState, useMemo } from 'react';
import { milestones, Domain, domainLabels } from '@/data/milestones';
import { TriageCard } from '@/components/TriageCard';
import { MilestoneModal } from '@/components/MilestoneModal';
import { TriageStrip } from '@/components/TriageStrip';
import { useMode } from '@/contexts/ModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { Milestone } from '@/data/milestones';
import { ChevronDown, FileText } from 'lucide-react';

const domains: (Domain | 'all')[] = ['all', 'compute', 'energy', 'connectivity', 'manufacturing', 'biology'];

const domainPillColors: Record<string, { bg: string; border: string; text: string }> = {
  all: { bg: 'hsla(43, 96%, 56%, 0.08)', border: 'hsla(43, 96%, 56%, 0.2)', text: 'hsl(43, 96%, 56%)' },
  compute: { bg: 'hsla(190, 100%, 50%, 0.08)', border: 'hsla(190, 100%, 50%, 0.2)', text: 'hsl(190, 100%, 50%)' },
  energy: { bg: 'hsla(38, 100%, 58%, 0.08)', border: 'hsla(38, 100%, 58%, 0.2)', text: 'hsl(38, 100%, 58%)' },
  connectivity: { bg: 'hsla(270, 90%, 68%, 0.08)', border: 'hsla(270, 90%, 68%, 0.2)', text: 'hsl(270, 90%, 68%)' },
  manufacturing: { bg: 'hsla(340, 80%, 62%, 0.08)', border: 'hsla(340, 80%, 62%, 0.2)', text: 'hsl(340, 80%, 62%)' },
  biology: { bg: 'hsla(152, 80%, 50%, 0.08)', border: 'hsla(152, 80%, 50%, 0.2)', text: 'hsl(152, 80%, 50%)' },
};

const INITIAL_COUNT = 10;
const LOAD_MORE_COUNT = 6;

export default function TriagePage() {
  const { isWonder } = useMode();
  const [selectedDomain, setSelectedDomain] = useState<Domain | 'all'>('all');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const filtered = useMemo(() => {
    const list = selectedDomain === 'all' ? milestones : milestones.filter(m => m.domain === selectedDomain);
    return [...list].sort((a, b) => b.triageScore - a.triageScore);
  }, [selectedDomain]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div>
      {/* Triage Strip */}
      <TriageStrip />

      <div className="flex items-center justify-between mb-5">
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
        <div className="flex items-center gap-3">
          <button className="btn-gold flex items-center gap-2 px-4 py-2 rounded-lg text-xs">
            <FileText className="w-3.5 h-3.5" />
            Export LP Memo
          </button>
          <div className="font-mono text-xs text-gold-num">
            {filtered.length} milestones
          </div>
        </div>
      </div>

      {/* Domain pills with gold rims */}
      <div className="flex gap-2 mb-5">
        {domains.map(d => {
          const isActive = selectedDomain === d;
          const colors = domainPillColors[d];
          return (
            <button
              key={d}
              onClick={() => { setSelectedDomain(d); setVisibleCount(INITIAL_COUNT); }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: isActive ? colors.bg : 'hsla(230, 22%, 9%, 0.6)',
                border: `1px solid ${isActive ? colors.border : 'hsla(220, 10%, 72%, 0.08)'}`,
                color: isActive ? colors.text : 'hsl(215, 15%, 48%)',
                boxShadow: isActive
                  ? `0 0 16px -6px ${colors.border}, inset 0 1px 0 hsla(220, 10%, 85%, 0.04)`
                  : 'inset 0 1px 0 hsla(220, 10%, 85%, 0.03)',
              }}
            >
              {d === 'all' ? 'All Domains' : domainLabels[d]}
            </button>
          );
        })}
      </div>

      {/* Milestone list */}
      <div className={`${isWonder ? 'space-y-3' : 'space-y-1.5'}`}>
        <AnimatePresence mode="popLayout">
          {visible.map((m, i) => (
            <TriageCard
              key={m.id}
              milestone={m}
              index={i}
              onClick={() => setSelectedMilestone(m)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {hasMore && (
        <motion.div
          className="flex justify-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={() => setVisibleCount(v => v + LOAD_MORE_COUNT)}
            className="glass-chrome rounded-xl px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 group"
            style={{ boxShadow: 'inset 0 1px 0 hsla(220, 10%, 85%, 0.04)' }}
          >
            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            Load {Math.min(LOAD_MORE_COUNT, filtered.length - visibleCount)} more milestones
            <span className="font-mono text-xs text-muted-foreground ml-1">
              ({visibleCount}/{filtered.length})
            </span>
          </button>
        </motion.div>
      )}

      <MilestoneModal
        milestone={selectedMilestone}
        open={!!selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
      />
    </div>
  );
}
