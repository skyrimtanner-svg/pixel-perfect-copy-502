import { useState, useMemo } from 'react';
import { milestones, Domain, domainLabels } from '@/data/milestones';
import { TriageCard } from '@/components/TriageCard';
import { MilestoneModal } from '@/components/MilestoneModal';
import { TriageStrip } from '@/components/TriageStrip';
import { useMode } from '@/contexts/ModeContext';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import type { Milestone } from '@/data/milestones';
import { ChevronDown, FileText, Filter } from 'lucide-react';

const domains: (Domain | 'all')[] = ['all', 'compute', 'energy', 'connectivity', 'manufacturing', 'biology'];

const domainPillColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  all: { bg: 'hsla(43, 96%, 56%, 0.08)', border: 'hsla(43, 96%, 56%, 0.22)', text: 'hsl(43, 96%, 56%)', glow: 'hsla(43, 96%, 56%, 0.15)' },
  compute: { bg: 'hsla(192, 100%, 52%, 0.08)', border: 'hsla(192, 100%, 52%, 0.22)', text: 'hsl(192, 100%, 52%)', glow: 'hsla(192, 100%, 52%, 0.15)' },
  energy: { bg: 'hsla(36, 100%, 56%, 0.08)', border: 'hsla(36, 100%, 56%, 0.22)', text: 'hsl(36, 100%, 56%)', glow: 'hsla(36, 100%, 56%, 0.15)' },
  connectivity: { bg: 'hsla(268, 90%, 68%, 0.08)', border: 'hsla(268, 90%, 68%, 0.22)', text: 'hsl(268, 90%, 68%)', glow: 'hsla(268, 90%, 68%, 0.15)' },
  manufacturing: { bg: 'hsla(342, 82%, 62%, 0.08)', border: 'hsla(342, 82%, 62%, 0.22)', text: 'hsl(342, 82%, 62%)', glow: 'hsla(342, 82%, 62%, 0.15)' },
  biology: { bg: 'hsla(155, 82%, 48%, 0.08)', border: 'hsla(155, 82%, 48%, 0.22)', text: 'hsl(155, 82%, 48%)', glow: 'hsla(155, 82%, 48%, 0.15)' },
};

const INITIAL_COUNT = 15;
const LOAD_MORE_COUNT = 8;

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
    <motion.div
      key={isWonder ? 'wonder' : 'analyst'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Triage Strip */}
      <TriageStrip />

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <motion.h1
            className={`font-display font-bold ${isWonder ? 'text-gold text-2xl' : 'text-foreground text-xl'}`}
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {isWonder ? '✦ Triage Queue' : 'Triage Queue'}
          </motion.h1>
          <p className={`text-muted-foreground mt-1 ${isWonder ? 'text-xs' : 'text-[10px] font-mono'}`}>
            {isWonder
              ? 'The most urgent milestones shaping humanity\'s future — ranked by what matters most.'
              : 'Ranked by urgency × proximity × magnitude | sorted: triageScore DESC'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold btn-gold shine-sweep"
          >
            <FileText className="w-3.5 h-3.5" />
            Export LP Memo
          </button>
          <div className="font-mono text-[10px] text-chrome tabular-nums">
            {filtered.length} items
          </div>
        </div>
      </div>

      {/* Domain pills */}
      <div className="flex items-center gap-2 mb-5">
        <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
        {domains.map(d => {
          const isActive = selectedDomain === d;
          const colors = domainPillColors[d];
          return (
            <motion.button
              key={d}
              onClick={() => { setSelectedDomain(d); setVisibleCount(INITIAL_COUNT); }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all duration-200"
              style={{
                background: isActive ? colors.bg : 'hsla(232, 26%, 8%, 0.6)',
                border: `1px solid ${isActive ? colors.border : 'hsla(220, 12%, 70%, 0.08)'}`,
                color: isActive ? colors.text : 'hsl(218, 15%, 46%)',
                boxShadow: isActive
                  ? `0 0 16px -6px ${colors.glow}, inset 0 1px 0 hsla(220, 14%, 88%, 0.05)`
                  : 'inset 0 1px 0 hsla(220, 14%, 88%, 0.03)',
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {d === 'all' ? 'All Domains' : domainLabels[d]}
            </motion.button>
          );
        })}
      </div>

      {/* Column headers — Analyst mode only */}
      {!isWonder && (
        <div
          className="flex items-center gap-2.5 px-2.5 py-1.5 mb-0.5 rounded-md text-[8px] uppercase tracking-[0.14em] text-chrome font-mono font-semibold"
          style={{
            background: 'hsla(232, 26%, 4%, 0.5)',
            borderBottom: '1px solid hsla(220, 12%, 70%, 0.06)',
          }}
        >
          <div className="w-5 text-center">#</div>
          <div className="w-[30px]">P(x)</div>
          <div className="flex-1">MILESTONE</div>
          <div className="w-8 text-right">YR</div>
          <div className="w-7 text-right">MAG</div>
          <div className="w-14 text-right">Δ LO</div>
          <div className="w-8 text-right">TRI</div>
        </div>
      )}

      {/* Milestone list */}
      <LayoutGroup>
        <div className={isWonder ? 'space-y-3' : 'space-y-px'}>
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
      </LayoutGroup>

      {/* Load More */}
      {hasMore && (
        <motion.div
          className="flex justify-center mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={() => setVisibleCount(v => v + LOAD_MORE_COUNT)}
            className="rounded-xl px-6 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all flex items-center gap-2 group glass-chrome"
          >
            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            Load {Math.min(LOAD_MORE_COUNT, filtered.length - visibleCount)} more
            <span className="font-mono text-[10px] text-muted-foreground ml-1 tabular-nums">
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
    </motion.div>
  );
}
