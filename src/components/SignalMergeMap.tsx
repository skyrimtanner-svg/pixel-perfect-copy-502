import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useMode } from '@/contexts/ModeContext';
import { glassPanelStrong, glassInner, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { ChevronDown, GitMerge, Loader2 } from 'lucide-react';

interface EvidenceGroup {
  milestoneId: string;
  milestoneTitle: string;
  items: {
    id: string;
    source: string;
    direction: string;
    composite: number;
    delta_log_odds: number;
    summary: string | null;
    created_at: string;
  }[];
  totalDelta: number;
  priorPosterior: { prior: number; posterior: number } | null;
}

const directionColors: Record<string, string> = {
  supports: 'hsl(43, 96%, 56%)',
  contradicts: 'hsl(0, 72%, 58%)',
  ambiguous: 'hsl(218, 15%, 68%)',
};

function MergeTree({ group }: { group: EvidenceGroup }) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = group.totalDelta >= 0;

  return (
    <div className="rounded-lg overflow-hidden" style={{
      ...glassInner,
      borderColor: isPositive ? 'hsla(43, 96%, 56%, 0.1)' : 'hsla(0, 72%, 58%, 0.1)',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-3 py-2 flex items-center gap-3 text-left"
      >
        <GitMerge className="w-3.5 h-3.5" style={{
          color: isPositive ? 'hsl(43, 96%, 56%)' : 'hsl(0, 72%, 58%)',
          filter: `drop-shadow(0 0 4px ${isPositive ? 'hsla(43, 96%, 56%, 0.4)' : 'hsla(0, 72%, 58%, 0.4)'})`,
        }} />
        <span className="text-[10px] font-mono font-semibold truncate max-w-[200px]" style={{ color: 'hsl(218, 15%, 78%)' }}>
          {group.milestoneTitle}
        </span>
        <span className="text-[9px] font-mono tabular-nums font-bold" style={{
          color: isPositive ? 'hsl(43, 96%, 56%)' : 'hsl(0, 72%, 58%)',
        }}>
          {group.items.length} signals → Σ {isPositive ? '+' : ''}{group.totalDelta.toFixed(3)} LO
        </span>
        {group.priorPosterior && (
          <span className="text-[8px] font-mono text-muted-foreground/60 ml-auto">
            {(group.priorPosterior.prior * 100).toFixed(0)}% → {(group.priorPosterior.posterior * 100).toFixed(0)}%
          </span>
        )}
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1">
              {/* Merge tree visualization */}
              <div className="relative pl-5">
                {/* Vertical merge line */}
                <div className="absolute left-2 top-0 bottom-4 w-px" style={{
                  background: `linear-gradient(180deg, ${isPositive ? 'hsla(43, 96%, 56%, 0.3)' : 'hsla(0, 72%, 58%, 0.3)'}, transparent)`,
                }} />

                {group.items.map((item, i) => {
                  const dirColor = directionColors[item.direction] || directionColors.ambiguous;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-2 py-1 relative"
                    >
                      {/* Branch connector */}
                      <div className="absolute -left-3 top-1/2 w-3 h-px" style={{ background: `${dirColor.replace('hsl', 'hsla').replace(')', ', 0.4)')}` }} />
                      <div className="w-2 h-2 rounded-full shrink-0" style={{
                        background: dirColor,
                        boxShadow: `0 0 6px ${dirColor.replace('hsl', 'hsla').replace(')', ', 0.5)')}`,
                      }} />
                      <span className="text-[8px] font-mono text-muted-foreground truncate max-w-[120px]">
                        {item.source}
                      </span>
                      <span className="text-[8px] font-mono tabular-nums" style={{ color: dirColor }}>
                        {item.delta_log_odds >= 0 ? '+' : ''}{item.delta_log_odds.toFixed(3)}
                      </span>
                      <span className="text-[7px] font-mono text-muted-foreground/40 truncate max-w-[150px]">
                        {item.summary}
                      </span>
                    </motion.div>
                  );
                })}

                {/* Merge result node */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: group.items.length * 0.06 + 0.1, type: 'spring' }}
                  className="flex items-center gap-2 pt-2 mt-1 relative"
                  style={{ borderTop: `1px solid ${isPositive ? 'hsla(43, 96%, 56%, 0.15)' : 'hsla(0, 72%, 58%, 0.15)'}` }}
                >
                  <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{
                    background: isPositive ? 'hsla(43, 96%, 56%, 0.15)' : 'hsla(0, 72%, 58%, 0.15)',
                    border: `1px solid ${isPositive ? 'hsla(43, 96%, 56%, 0.4)' : 'hsla(0, 72%, 58%, 0.4)'}`,
                  }}>
                    <GitMerge className="w-2 h-2" style={{ color: isPositive ? 'hsl(43, 96%, 56%)' : 'hsl(0, 72%, 58%)' }} />
                  </div>
                  <span className="text-[9px] font-mono font-bold" style={{
                    color: isPositive ? 'hsl(43, 96%, 56%)' : 'hsl(0, 72%, 58%)',
                  }}>
                    Compound: Σ {isPositive ? '+' : ''}{group.totalDelta.toFixed(3)} LO
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SignalMergeMap() {
  const [groups, setGroups] = useState<EvidenceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { isWonder } = useMode();

  useEffect(() => {
    async function load() {
      // Fetch recent evidence grouped by milestone
      const { data: evidence, error } = await supabase
        .from('evidence')
        .select('id, milestone_id, source, direction, composite, delta_log_odds, summary, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error || !evidence) { setLoading(false); return; }

      // Group by milestone
      const map = new Map<string, typeof evidence>();
      for (const e of evidence) {
        const arr = map.get(e.milestone_id) || [];
        arr.push(e);
        map.set(e.milestone_id, arr);
      }

      // Only show milestones with 2+ evidence items (compound signals)
      const milestoneIds = [...map.entries()].filter(([, v]) => v.length >= 2).map(([k]) => k);

      const { data: milestones } = await supabase
        .from('milestones')
        .select('id, title, prior, posterior')
        .in('id', milestoneIds.length > 0 ? milestoneIds : ['__none__']);

      const msMap = new Map((milestones || []).map(m => [m.id, m]));

      const result: EvidenceGroup[] = milestoneIds
        .map(id => {
          const items = map.get(id)!;
          const ms = msMap.get(id);
          const totalDelta = items.reduce((sum, e) => sum + (e.delta_log_odds || 0), 0);
          return {
            milestoneId: id,
            milestoneTitle: ms?.title || id,
            items: items.slice(0, 10).map(e => ({
              id: e.id,
              source: e.source,
              direction: e.direction,
              composite: e.composite,
              delta_log_odds: e.delta_log_odds,
              summary: e.summary,
              created_at: e.created_at,
            })),
            totalDelta,
            priorPosterior: ms ? { prior: ms.prior, posterior: ms.posterior } : null,
          };
        })
        .sort((a, b) => Math.abs(b.totalDelta) - Math.abs(a.totalDelta))
        .slice(0, 15);

      setGroups(result);
      setLoading(false);
    }
    load();
  }, []);

  if (!loading && groups.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mt-6 rounded-xl overflow-hidden relative"
      style={glassPanelStrong}
    >
      <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
      <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl pointer-events-none" style={specularReflection} />

      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left relative z-10"
      >
        <GitMerge className="w-4 h-4" style={{
          color: 'hsl(268, 90%, 68%)',
          filter: 'drop-shadow(0 0 6px hsla(268, 90%, 68%, 0.4))',
        }} />
        <div className="flex-1">
          <span className="text-xs font-mono font-semibold" style={{
            background: 'linear-gradient(135deg, hsl(268, 90%, 58%), hsl(192, 100%, 52%), hsl(43, 96%, 56%))',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {isWonder ? '🔗 Signal Merge Map' : 'SIGNAL MERGE MAP'}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground ml-2">
            {loading ? 'analyzing…' : `${groups.length} compound signals`}
          </span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                groups.map(group => <MergeTree key={group.milestoneId} group={group} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
