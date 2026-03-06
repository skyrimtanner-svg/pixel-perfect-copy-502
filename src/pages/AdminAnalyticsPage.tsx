import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { glassPanel, glassPanelGold, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { Users, Zap, FileText, BarChart3, Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Metrics {
  activeUsers: number;
  totalCommits: number;
  memosExported: number;
  avgBrierScore: number | null;
  topMilestones: { milestone_id: string; count: number }[];
}

interface PendingEvidence {
  id: string;
  milestone_id: string;
  source: string;
  source_url: string | null;
  direction: string;
  evidence_type: string;
  publisher_tier: number;
  credibility: number;
  consensus: number;
  criteria_match: number;
  composite_score: number;
  summary: string | null;
  raw_snippet: string | null;
  status: string;
  created_at: string;
}

interface ScoutLog {
  id: string;
  run_id: string;
  action: string;
  detail: any;
  created_at: string;
}

export default function AdminAnalyticsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingEvidence, setPendingEvidence] = useState<PendingEvidence[]>([]);
  const [_scoutLogs, setScoutLogs] = useState<ScoutLog[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scoutRunning, setScoutRunning] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'queue' | 'logs'>('metrics');
  const [_evidenceInflow, setEvidenceInflow] = useState<{ date: string; count: number }[]>([]);
  const [_sourceDistribution, setSourceDistribution] = useState<{ name: string; value: number }[]>([]);
  const [_domainPortfolio, setDomainPortfolio] = useState<{ name: string; avgPosterior: number; count: number }[]>([]);
  const [_topMovers, setTopMovers] = useState<{ title: string; delta: number; direction: string }[]>([]);
  const [_calibrationTrend, setCalibrationTrend] = useState<{ date: string; brier: number }[]>([]);

  const fetchPending = useCallback(async () => {
    const { data } = await supabase
      .from('pending_evidence')
      .select('*')
      .eq('status', 'pending')
      .order('composite_score', { ascending: false });
    if (data) setPendingEvidence(data as PendingEvidence[]);
  }, []);

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from('scout_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setScoutLogs(data as ScoutLog[]);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchMetrics = async () => {
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: commitCount } = await supabase
        .from('trust_ledger')
        .select('*', { count: 'exact', head: true });

      const { count: memoCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'memo_exported');

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
        avgBrierScore: null,
        topMilestones,
      });
      setLoading(false);
    };

    fetchMetrics();
    fetchPending();
    fetchLogs();

    // Fetch evidence inflow + source distribution
    const fetchInflow = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: allEvidence } = await supabase
        .from('pending_evidence')
        .select('created_at, source, direction, composite_score')
        .order('created_at', { ascending: true });

      if (!allEvidence || allEvidence.length === 0) return;

      // Group by date for inflow chart
      const grouped: Record<string, { date: string; supports: number; contradicts: number; ambiguous: number; total: number; sources: Record<string, number> }> = {};
      allEvidence.forEach((e: any) => {
        const date = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!grouped[date]) grouped[date] = { date, supports: 0, contradicts: 0, ambiguous: 0, total: 0, sources: {} };
        grouped[date][e.direction as 'supports' | 'contradicts' | 'ambiguous'] = (grouped[date][e.direction as 'supports' | 'contradicts' | 'ambiguous'] || 0) + 1;
        grouped[date].total++;
        const src = e.source?.split('.')[0] || 'unknown';
        grouped[date].sources[src] = (grouped[date].sources[src] || 0) + 1;
      });
      setEvidenceInflow(Object.values(grouped));

      // Source distribution (last 30 days)
      const recentEvidence = allEvidence.filter((e: any) => e.created_at >= thirtyDaysAgo);
      const sourceMap: Record<string, number> = {};
      const SOURCE_LABELS: Record<string, string> = {
        'arxiv': 'arXiv', 'x': 'X', 'nature': 'Nature', 'reuters': 'Reuters',
        'patents': 'patents.google.com', 'clinicaltrials': 'clinicaltrials.gov',
        'science': 'Science', 'bbc': 'BBC', 'techcrunch': 'TechCrunch',
      };
      recentEvidence.forEach((e: any) => {
        const raw = (e.source || 'unknown').toLowerCase();
        let key = raw.split('.')[0];
        if (raw.includes('patents.google')) key = 'patents';
        if (raw.includes('clinicaltrials')) key = 'clinicaltrials';
        const label = SOURCE_LABELS[key] || key;
        sourceMap[label] = (sourceMap[label] || 0) + 1;
      });
      setSourceDistribution(
        Object.entries(sourceMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );
    };
    fetchInflow();

    // Fetch domain portfolio from milestones
    const fetchDomainPortfolio = async () => {
      const { data: ms } = await supabase.from('milestones').select('domain, posterior');
      if (!ms || ms.length === 0) return;
      const domainMap: Record<string, { sum: number; count: number }> = {};
      ms.forEach((m: any) => {
        const d = m.domain || 'Unknown';
        if (!domainMap[d]) domainMap[d] = { sum: 0, count: 0 };
        domainMap[d].sum += m.posterior;
        domainMap[d].count++;
      });
      setDomainPortfolio(
        Object.entries(domainMap)
          .map(([name, { sum, count }]) => ({ name, avgPosterior: sum / count, count }))
          .sort((a, b) => b.count - a.count)
      );
    };
    fetchDomainPortfolio();

    // Fetch top movers (largest |delta_log_odds| in last 30 days)
    const fetchTopMovers = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: ev } = await supabase
        .from('evidence')
        .select('milestone_id, delta_log_odds, direction')
        .gte('created_at', thirtyDaysAgo);
      if (!ev || ev.length === 0) return;
      // Aggregate by milestone
      const agg: Record<string, { delta: number; direction: string }> = {};
      ev.forEach((e: any) => {
        if (!agg[e.milestone_id]) agg[e.milestone_id] = { delta: 0, direction: e.direction };
        agg[e.milestone_id].delta += e.delta_log_odds;
      });
      // Fetch titles
      const ids = Object.keys(agg);
      const { data: msData } = await supabase.from('milestones').select('id, title').in('id', ids);
      const titleMap: Record<string, string> = {};
      (msData || []).forEach((m: any) => { titleMap[m.id] = m.title; });
      setTopMovers(
        Object.entries(agg)
          .sort((a, b) => Math.abs(b[1].delta) - Math.abs(a[1].delta))
          .slice(0, 5)
          .map(([id, { delta }]) => ({
            title: titleMap[id] || id,
            delta: Math.round(delta * 1000) / 1000,
            direction: delta >= 0 ? 'supports' : 'contradicts',
          }))
      );
    };
    fetchTopMovers();

    // Fetch calibration trend (mock Brier from trust_ledger snapshots)
    const fetchCalibration = async () => {
      const { data: ledger } = await supabase
        .from('trust_ledger')
        .select('created_at, prior, posterior')
        .order('created_at', { ascending: true })
        .limit(500);
      if (!ledger || ledger.length === 0) return;
      // Compute rolling Brier-like score per day: (posterior - outcome_proxy)^2
      // Since we don't have outcomes, use |posterior - prior| as calibration proxy
      const dailyMap: Record<string, { sum: number; count: number }> = {};
      ledger.forEach((l: any) => {
        const date = new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyMap[date]) dailyMap[date] = { sum: 0, count: 0 };
        const brierProxy = Math.pow(l.posterior - l.prior, 2);
        dailyMap[date].sum += brierProxy;
        dailyMap[date].count++;
      });
      setCalibrationTrend(
        Object.entries(dailyMap).map(([date, { sum, count }]) => ({
          date,
          brier: Math.round((sum / count) * 10000) / 10000,
        }))
      );
    };
    fetchCalibration();
  }, [isAdmin, fetchPending, fetchLogs]);

  const triggerScoutRun = async () => {
    setScoutRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('evidence-scout');
      if (error) throw error;
      const queued = data?.evidence_queued || 0;
      const fetched = data?.articles_fetched || 0;
      const classified = data?.articles_classified || 0;
      toast.success(`Scout complete: ${fetched} articles fetched → ${classified} classified → ${queued} queued for review`);
      await fetchPending();
      await fetchLogs();
    } catch (e) {
      toast.error(`Scout error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setScoutRunning(false);
    }
  };

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-gold font-display font-bold text-2xl tracking-tight">Admin Analytics</h1>
          <p className="text-muted-foreground text-xs font-mono mt-1 tracking-wider">PRIVATE · ADMIN ONLY</p>
        </div>
        <button
          onClick={triggerScoutRun}
          disabled={scoutRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all hover:scale-[1.02]"
          style={{
            background: scoutRunning ? 'hsla(43, 96%, 56%, 0.1)' : 'hsla(43, 96%, 56%, 0.15)',
            border: '1px solid hsla(43, 96%, 56%, 0.3)',
            color: 'hsl(43, 96%, 56%)',
            opacity: scoutRunning ? 0.6 : 1,
          }}
        >
          {scoutRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
          {scoutRunning ? 'Scanning all sources…' : 'Run Evidence Scout'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: 'hsla(232, 26%, 8%, 0.5)', border: '1px solid hsla(220, 12%, 70%, 0.08)' }}>
        {(['metrics', 'queue', 'logs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-all"
            style={{
              background: activeTab === tab ? 'hsla(43, 96%, 56%, 0.12)' : 'transparent',
              color: activeTab === tab ? 'hsl(43, 96%, 56%)' : 'hsl(220, 12%, 55%)',
              border: activeTab === tab ? '1px solid hsla(43, 96%, 56%, 0.2)' : '1px solid transparent',
            }}
          >
            {tab === 'queue' ? `Queue (${pendingEvidence.length})` : tab}
          </button>
        ))}
      </div>

      {loading && activeTab === 'metrics' ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(43, 96%, 56%)' }} />
        </div>
      ) : (
        <>
          {/* ─── METRICS TAB ─── */}
          {activeTab === 'metrics' && (
            <>
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
                      
                      <div className="flex items-center gap-3 mb-2 relative z-10">
                        <Icon className="w-4 h-4" style={{ color: card.color }} />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{card.label}</span>
                      </div>
                      <div className="text-2xl font-bold font-mono relative z-10" style={{ color: 'white' }}>
                        {card.value}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
