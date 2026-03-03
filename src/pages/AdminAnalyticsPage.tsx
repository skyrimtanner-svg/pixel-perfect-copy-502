import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { glassPanel, glassPanelGold, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { Users, Zap, FileText, BarChart3, Eye, Loader2 } from 'lucide-react';

interface Metrics {
  activeUsers: number;
  totalCommits: number;
  memosExported: number;
  avgBrierScore: number | null;
  topMilestones: { milestone_id: string; count: number }[];
}

export default function AdminAnalyticsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchMetrics = async () => {
      // Total users (profiles)
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total commits (trust ledger entries)
      const { count: commitCount } = await supabase
        .from('trust_ledger')
        .select('*', { count: 'exact', head: true });

      // Memos exported (analytics events)
      const { count: memoCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'memo_exported');

      // Top milestones by trust ledger activity
      const { data: topData } = await supabase
        .from('trust_ledger')
        .select('milestone_id');

      const milestoneCounts: Record<string, number> = {};
      (topData || []).forEach((row: { milestone_id: string }) => {
        milestoneCounts[row.milestone_id] = (milestoneCounts[row.milestone_id] || 0) + 1;
      });
      const topMilestones = Object.entries(milestoneCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([milestone_id, count]) => ({ milestone_id, count }));

      setMetrics({
        activeUsers: userCount || 0,
        totalCommits: commitCount || 0,
        memosExported: memoCount || 0,
        avgBrierScore: null, // Placeholder — requires calibration aggregation
        topMilestones,
      });
      setLoading(false);
    };

    fetchMetrics();
  }, [isAdmin]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(43, 96%, 56%)' }} />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const cards = [
    { label: 'Active Users', value: metrics?.activeUsers ?? '—', icon: Users, color: 'hsl(192, 95%, 50%)' },
    { label: 'Total Commits', value: metrics?.totalCommits ?? '—', icon: Zap, color: 'hsl(43, 96%, 56%)' },
    { label: 'Memos Exported', value: metrics?.memosExported ?? '—', icon: FileText, color: 'hsl(155, 82%, 48%)' },
    { label: 'Avg Brier Score', value: metrics?.avgBrierScore?.toFixed(3) ?? 'N/A', icon: BarChart3, color: 'hsl(268, 90%, 68%)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-gold font-display font-bold text-2xl tracking-tight">Admin Analytics</h1>
        <p className="text-muted-foreground text-xs font-mono mt-1 tracking-wider">PRIVATE · ADMIN ONLY</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(43, 96%, 56%)' }} />
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  className="rounded-xl p-5 relative overflow-hidden"
                  style={i === 0 ? glassPanelGold : glassPanel}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="absolute top-0 left-4 right-4 h-px" style={goldChromeLine} />
                  <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl pointer-events-none" style={specularReflection} />
                  <Icon className="w-5 h-5 mb-3" style={{ color: card.color, filter: `drop-shadow(0 0 6px ${card.color}60)` }} />
                  <div className="metallic-num text-2xl font-bold">{card.value}</div>
                  <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase mt-1">{card.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Top milestones */}
          <div className="rounded-xl p-5 relative overflow-hidden" style={glassPanel}>
            <div className="absolute top-0 left-4 right-4 h-px" style={goldChromeLine} />
            <div className="absolute top-0 left-0 right-0 h-[20%] rounded-t-xl pointer-events-none" style={specularReflection} />
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4" style={{ color: 'hsl(43, 96%, 56%)' }} />
              <h2 className="text-sm font-display font-semibold text-foreground">Top Milestones by Commits</h2>
            </div>
            <div className="space-y-2">
              {metrics?.topMilestones.map((m, i) => (
                <div key={m.milestone_id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{
                  background: 'hsla(232, 26%, 8%, 0.5)',
                  border: '1px solid hsla(220, 12%, 70%, 0.06)',
                }}>
                  <div className="flex items-center gap-3">
                    <span className="chrome-num text-xs w-5">#{i + 1}</span>
                    <span className="text-xs text-foreground font-mono truncate max-w-[300px]">{m.milestone_id}</span>
                  </div>
                  <span className="metallic-num text-xs">{m.count} commits</span>
                </div>
              ))}
              {metrics?.topMilestones.length === 0 && (
                <p className="text-xs text-muted-foreground font-mono text-center py-4">No commits yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
