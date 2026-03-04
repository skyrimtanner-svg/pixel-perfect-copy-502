import { useState, useMemo } from 'react';
import { BetaWelcomeBanner } from '@/components/BetaWelcomeBanner';
import { Domain, domainLabels } from '@/data/milestones';
import { TriageCard } from '@/components/TriageCard';
import { MilestoneModal } from '@/components/MilestoneModal';

import { UpgradePrompt } from '@/components/UpgradePrompt';
import { TriageStrip } from '@/components/TriageStrip';
import { useMode } from '@/contexts/ModeContext';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useMilestones } from '@/hooks/useMilestones';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import type { Milestone } from '@/data/milestones';
import { ChevronDown, FileText, Filter, Loader2 } from 'lucide-react';
import { specularReflection } from '@/lib/glass-styles';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { domainColorClass } from '@/lib/domain-styles';

const domains: (Domain | 'all')[] = ['all', 'compute', 'energy', 'connectivity', 'manufacturing', 'biology'];

const domainPillColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  all: { bg: 'hsla(43, 96%, 56%, 0.08)', border: 'hsla(43, 96%, 56%, 0.22)', text: 'hsl(43, 96%, 56%)', glow: 'hsla(43, 96%, 56%, 0.15)' },
  compute: { bg: 'hsla(192, 100%, 52%, 0.08)', border: 'hsla(192, 100%, 52%, 0.22)', text: 'hsl(192, 100%, 52%)', glow: 'hsla(192, 100%, 52%, 0.15)' },
  energy: { bg: 'hsla(36, 100%, 56%, 0.08)', border: 'hsla(36, 100%, 56%, 0.22)', text: 'hsl(36, 100%, 56%)', glow: 'hsla(36, 100%, 56%, 0.15)' },
  connectivity: { bg: 'hsla(268, 90%, 68%, 0.08)', border: 'hsla(268, 90%, 68%, 0.22)', text: 'hsl(268, 90%, 68%)', glow: 'hsla(268, 90%, 68%, 0.15)' },
  manufacturing: { bg: 'hsla(342, 82%, 62%, 0.08)', border: 'hsla(342, 82%, 62%, 0.22)', text: 'hsl(342, 82%, 62%)', glow: 'hsla(342, 82%, 62%, 0.15)' },
  biology: { bg: 'hsla(155, 82%, 48%, 0.08)', border: 'hsla(155, 82%, 48%, 0.22)', text: 'hsl(155, 82%, 48%)', glow: 'hsla(155, 82%, 48%, 0.15)' },
};

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

const INITIAL_COUNT = 15;
const LOAD_MORE_COUNT = 8;

export default function TriagePage() {
  const { isWonder } = useMode();
  const { canExportMemo } = useEntitlement();
  const { milestones, loading } = useMilestones();
  const [selectedDomain, setSelectedDomain] = useState<Domain | 'all'>('all');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [memoSearch, setMemoSearch] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);

  const filtered = useMemo(() => {
    const list = selectedDomain === 'all' ? milestones : milestones.filter(m => m.domain === selectedDomain);
    return [...list].sort((a, b) => b.triageScore - a.triageScore);
  }, [selectedDomain, milestones]);

  const memoFiltered = useMemo(() => {
    const list = filtered.slice(0, 20);
    if (!memoSearch.trim()) return list;
    const q = memoSearch.toLowerCase();
    return list.filter(m => m.title.toLowerCase().includes(q));
  }, [filtered, memoSearch]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(43, 96%, 56%)' }} />
        <span className="ml-3 text-sm text-muted-foreground font-mono">Loading milestones…</span>
      </div>
    );
  }

  return (
    <motion.div
      key={isWonder ? 'wonder' : 'analyst'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Beta Welcome Banner */}
      <BetaWelcomeBanner />

      {/* Triage Strip */}
      <TriageStrip milestones={milestones} />

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shine-sweep relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, hsl(38, 88%, 32%), hsl(43, 96%, 48%), hsl(48, 100%, 68%), hsl(50, 100%, 82%), hsl(48, 100%, 66%), hsl(43, 96%, 46%))',
                  color: 'hsl(232, 30%, 2%)',
                  boxShadow: [
                    '0 2px 16px -2px hsla(43, 96%, 56%, 0.4)',
                    'inset 0 1px 0 hsla(48, 100%, 85%, 0.5)',
                    'inset 0 -1px 0 hsla(38, 88%, 28%, 0.55)',
                    '0 1px 3px hsla(232, 30%, 2%, 0.3)',
                  ].join(', '),
                  textShadow: '0 1px 0 hsla(48, 100%, 80%, 0.3)',
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                Export LP Memo
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-72"
              style={{
                background: 'hsl(232, 26%, 6%)',
                border: '1px solid hsla(220, 12%, 70%, 0.12)',
                backdropFilter: 'blur(24px)',
              }}
              onCloseAutoFocus={() => setMemoSearch('')}
            >
              <div className="p-2 border-b border-border/20">
                <input
                  type="text"
                  placeholder="Search milestones…"
                  value={memoSearch}
                  onChange={(e) => setMemoSearch(e.target.value)}
                  className="w-full bg-transparent border border-border/30 rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {memoFiltered.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-muted-foreground text-center font-mono">No matches</div>
                ) : (
                  memoFiltered.map((m) => (
                    <DropdownMenuItem
                      key={m.id}
                      onClick={() => {
                        if (!canExportMemo) { setShowUpgrade(true); return; }
                        setSelectedMilestone(m);
                      }}
                      className="flex items-center gap-2 cursor-pointer text-xs font-mono py-2"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: domainPillColors[m.domain]?.text || 'hsl(220, 10%, 50%)' }}
                      />
                      <span className="truncate text-foreground">{m.title}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {Math.round(m.posterior * 100)}%
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="font-mono text-[10px] tabular-nums font-semibold" style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.15))',
          }}>
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
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all duration-200 relative overflow-hidden shine-sweep"
              style={{
                background: isActive ? colors.bg : 'hsla(232, 26%, 8%, 0.6)',
                border: `1px solid ${isActive ? colors.border : 'hsla(220, 12%, 70%, 0.08)'}`,
                color: isActive ? colors.text : 'hsl(218, 15%, 46%)',
                backdropFilter: 'blur(16px)',
                boxShadow: isActive
                  ? `0 0 18px -6px ${colors.glow}, inset 0 1px 0 hsla(220, 14%, 88%, 0.1), inset 0 -1px 0 hsla(232, 30%, 2%, 0.3)`
                  : 'inset 0 1px 0 hsla(220, 14%, 88%, 0.04), inset 0 -1px 0 hsla(232, 30%, 2%, 0.2)',
                textShadow: isActive ? `0 0 8px ${colors.glow}` : 'none',
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
          className="flex items-center gap-2.5 px-2.5 py-1.5 mb-0.5 rounded-md text-[8px] uppercase tracking-[0.14em] font-mono font-semibold relative overflow-hidden"
          style={{
            background: 'hsla(232, 26%, 4%, 0.6)',
            borderBottom: '1px solid hsla(220, 12%, 70%, 0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[60%] rounded-t-md pointer-events-none" style={specularReflection} />
          <div className="w-5 text-center" style={{
            background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 72%), hsl(220, 16%, 88%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>#</div>
          <div className="w-[30px]" style={{
            background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 72%), hsl(220, 16%, 88%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>P(x)</div>
          <div className="flex-1" style={{
            background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 72%), hsl(220, 16%, 88%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>MILESTONE</div>
          <div className="w-8 text-right" style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
          }}>YR</div>
          <div className="w-7 text-right" style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
          }}>MAG</div>
          <div className="w-14 text-right" style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
          }}>Δ LO</div>
          <div className="w-8 text-right" style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 3px hsla(43, 96%, 56%, 0.15))',
          }}>TRI</div>
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


      <UpgradePrompt
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="Export LP Memo"
        requiredTier="Pro+"
      />
    </motion.div>
  );
}
