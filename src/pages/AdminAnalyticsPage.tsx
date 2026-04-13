import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { glassPanel, glassPanelGold, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { Users, Zap, FileText, BarChart3, Bot, Loader2, Mail, AlertTriangle, Shield, Clock, CheckCircle2, XCircle, Filter } from 'lucide-react';
import ScoutDiagnosticRow from '@/components/ScoutDiagnosticRow';
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
  decayed_score: number | null;
  contradiction_pressure: number | null;
  queue_reason: string | null;
  summary: string | null;
  raw_snippet: string | null;
  status: string;
  created_at: string;
  decay_applied_at: string | null;
}

interface ScoutLog {
  id: string;
  run_id: string;
  action: string;
  detail: any;
  created_at: string;
}

type AgeBucket = 'all' | '0-3d' | '4-7d' | '8-14d' | '15+d';

const QUEUE_REASON_LABELS: Record<string, { label: string; color: string }> = {
  'scout_queued': { label: 'Queued', color: 'hsl(220, 12%, 55%)' },
  'human_review_standard': { label: 'Standard Review', color: 'hsl(192, 95%, 50%)' },
  'human_review_high_value_domain': { label: 'High-Value Domain', color: 'hsl(43, 96%, 56%)' },
  'forced_human_review_contradiction_pressure': { label: 'Contradiction Pressure', color: 'hsl(0, 72%, 51%)' },
  'blocked_contradict_auto_commit': { label: 'Blocked Contradict', color: 'hsl(25, 95%, 53%)' },
  'stale_high_value_review': { label: 'Stale (High Value)', color: 'hsl(268, 90%, 68%)' },
  'auto_commit_high_confidence': { label: 'Auto-Committed', color: 'hsl(155, 82%, 48%)' },
  'auto_commit_low_risk': { label: 'Auto Low-Risk', color: 'hsl(155, 82%, 48%)' },
};

function getAgeDays(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
}

function getAgeBucket(days: number): string {
  if (days <= 3) return '0-3d';
  if (days <= 7) return '4-7d';
  if (days <= 14) return '8-14d';
  return '15+d';
}

function getAgeColor(days: number): string {
  if (days <= 3) return 'hsl(155, 82%, 48%)';
  if (days <= 7) return 'hsl(192, 95%, 50%)';
  if (days <= 14) return 'hsl(43, 96%, 56%)';
  return 'hsl(0, 72%, 51%)';
}

function getPressureColor(pressure: number): string {
  if (pressure < 0.30) return 'hsl(155, 82%, 48%)';
  if (pressure <= 0.60) return 'hsl(43, 96%, 56%)';
  return 'hsl(0, 72%, 51%)';
}

function getCredibilityLabel(tier: number): { label: string; color: string } {
  switch (tier) {
    case 1: return { label: 'T1 Peer', color: 'hsl(155, 82%, 48%)' };
    case 2: return { label: 'T2 Quality', color: 'hsl(192, 95%, 50%)' };
    case 3: return { label: 'T3 Trade', color: 'hsl(43, 96%, 56%)' };
    default: return { label: 'T4 Low', color: 'hsl(0, 72%, 51%)' };
  }
}

export default function AdminAnalyticsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingEvidence, setPendingEvidence] = useState<PendingEvidence[]>([]);
  const [_scoutLogs, setScoutLogs] = useState<ScoutLog[]>([]);
  const [scoutRunning, setScoutRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'queue' | 'logs' | 'waitlist'>('metrics');
  const [waitlistEntries, setWaitlistEntries] = useState<{ id: string; email: string; spot_number: number; source: string; created_at: string }[]>([]);
  const [_evidenceInflow, setEvidenceInflow] = useState<{ date: string; supports: number; contradicts: number; ambiguous: number; total: number; sources: Record<string, number> }[]>([]);
  const [_sourceDistribution, setSourceDistribution] = useState<{ name: string; value: number }[]>([]);
  const [_domainPortfolio, setDomainPortfolio] = useState<{ name: string; avgPosterior: number; count: number }[]>([]);
  const [_topMovers, setTopMovers] = useState<{ title: string; delta: number; direction: string }[]>([]);
  const [_calibrationTrend, setCalibrationTrend] = useState<{ date: string; brier: number }[]>([]);

  // Queue UI state
  const [ageBucketFilter, setAgeBucketFilter] = useState<AgeBucket>('all');
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [milestoneNames, setMilestoneNames] = useState<Record<string, string>>({});

  const fetchPending = useCallback(async () => {
    const { data } = await supabase
      .from('pending_evidence')
      .select('*')
      .eq('status', 'pending')
      .order('composite_score', { ascending: false });
    if (data) {
      setPendingEvidence(data as PendingEvidence[]);
      // Fetch milestone names
      const msIds = [...new Set(data.map((d: any) => d.milestone_id))];
      if (msIds.length > 0) {
        const { data: ms } = await supabase.from('milestones').select('id, title').in('id', msIds);
        const names: Record<string, string> = {};
        (ms || []).forEach((m: any) => { names[m.id] = m.title; });
        setMilestoneNames(names);
      }
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from('scout_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setScoutLogs(data as ScoutLog[]);
  }, []);

  // Filtered and sorted queue
  const filteredQueue = useMemo(() => {
    let items = [...pendingEvidence];

    // Age filter
    if (ageBucketFilter !== 'all') {
      items = items.filter(item => {
        const days = getAgeDays(item.created_at);
        return getAgeBucket(days) === ageBucketFilter;
      });
    }

    // Sort by decayed_score (or composite if no decay applied)
    items.sort((a, b) => (b.decayed_score ?? b.composite_score) - (a.decayed_score ?? a.composite_score));

    return items;
  }, [pendingEvidence, ageBucketFilter]);

  // Bulk reject eligible items
  const bulkRejectEligible = useMemo(() => {
    return pendingEvidence.filter(item => {
      const days = getAgeDays(item.created_at);
      const score = item.decayed_score ?? item.composite_score;
      return score < 0.40 && days > 7 && item.publisher_tier >= 3 &&
        item.queue_reason !== 'stale_high_value_review' &&
        item.queue_reason !== 'forced_human_review_contradiction_pressure';
    });
  }, [pendingEvidence]);

  // Bulk reject summary for confirmation
  const bulkRejectSummary = useMemo(() => {
    const items = selectedForBulk.size > 0
      ? pendingEvidence.filter(p => selectedForBulk.has(p.id))
      : bulkRejectEligible;
    const milestones = new Set(items.map(i => i.milestone_id));
    const medCredCount = items.filter(i => i.publisher_tier <= 2).length;
    return {
      count: items.length,
      milestoneCount: milestones.size,
      medCredCount,
    };
  }, [selectedForBulk, bulkRejectEligible, pendingEvidence]);

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

    const fetchWaitlist = async () => {
      const { data } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setWaitlistEntries(data);
    };
    fetchWaitlist();

    const fetchInflow = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: allEvidence } = await supabase
        .from('pending_evidence')
        .select('created_at, source, direction, composite_score')
        .order('created_at', { ascending: true });

      if (!allEvidence || allEvidence.length === 0) return;

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

    const fetchTopMovers = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: ev } = await supabase
        .from('evidence')
        .select('milestone_id, delta_log_odds, direction')
        .gte('created_at', thirtyDaysAgo);
      if (!ev || ev.length === 0) return;
      const agg: Record<string, { delta: number; direction: string }> = {};
      ev.forEach((e: any) => {
        if (!agg[e.milestone_id]) agg[e.milestone_id] = { delta: 0, direction: e.direction };
        agg[e.milestone_id].delta += e.delta_log_odds;
      });
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

    const fetchCalibration = async () => {
      const { data: ledger } = await supabase
        .from('trust_ledger')
        .select('created_at, prior, posterior')
        .order('created_at', { ascending: true })
        .limit(500);
      if (!ledger || ledger.length === 0) return;
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

  const handleSingleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingAction(id);
    try {
      const { error } = await supabase.functions.invoke('approve-evidence', {
        body: { action, pending_id: id },
      });
      if (error) throw error;
      toast.success(`Evidence ${action}d`);
      await fetchPending();
    } catch (e) {
      toast.error(`Failed to ${action}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleBulkReject = async () => {
    const ids = selectedForBulk.size > 0
      ? Array.from(selectedForBulk)
      : bulkRejectEligible.map(i => i.id);

    if (ids.length === 0) return;

    setProcessingAction('bulk');
    try {
      const { data, error } = await supabase.functions.invoke('approve-evidence', {
        body: { action: 'reject', pending_ids: ids },
      });
      if (error) throw error;
      toast.success(`Bulk rejected ${data?.rejected || 0} items`);
      setSelectedForBulk(new Set());
      setBulkConfirmOpen(false);
      await fetchPending();
    } catch (e) {
      toast.error(`Bulk reject failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setProcessingAction(null);
    }
  };

  const toggleBulkSelect = (id: string) => {
    setSelectedForBulk(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const ageBuckets: { key: AgeBucket; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: '0-3d', label: '0–3d' },
    { key: '4-7d', label: '4–7d' },
    { key: '8-14d', label: '8–14d' },
    { key: '15+d', label: '15+d' },
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
        {(['metrics', 'queue', 'logs', 'waitlist'] as const).map(tab => (
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
            {tab === 'queue' ? `Queue (${pendingEvidence.length})` : tab === 'waitlist' ? `Waitlist (${waitlistEntries.length})` : tab}
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
              <ScoutDiagnosticRow />
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

          {/* ─── QUEUE TAB (Enhanced) ─── */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              {/* Queue Controls */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Age bucket filters */}
                <div className="flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 mr-1" style={{ color: 'hsl(220, 12%, 55%)' }} />
                  {ageBuckets.map(b => {
                    const count = b.key === 'all'
                      ? pendingEvidence.length
                      : pendingEvidence.filter(p => getAgeBucket(getAgeDays(p.created_at)) === b.key).length;
                    return (
                      <button
                        key={b.key}
                        onClick={() => setAgeBucketFilter(b.key)}
                        className="px-2.5 py-1 rounded text-[10px] font-mono transition-all"
                        style={{
                          background: ageBucketFilter === b.key ? 'hsla(192, 95%, 50%, 0.15)' : 'hsla(220, 12%, 70%, 0.05)',
                          color: ageBucketFilter === b.key ? 'hsl(192, 95%, 50%)' : 'hsl(220, 12%, 55%)',
                          border: `1px solid ${ageBucketFilter === b.key ? 'hsla(192, 95%, 50%, 0.3)' : 'hsla(220, 12%, 70%, 0.08)'}`,
                        }}
                      >
                        {b.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Bulk reject button */}
                {bulkRejectEligible.length > 0 && (
                  <button
                    onClick={() => setBulkConfirmOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono transition-all hover:scale-[1.02]"
                    style={{
                      background: 'hsla(0, 72%, 51%, 0.1)',
                      border: '1px solid hsla(0, 72%, 51%, 0.25)',
                      color: 'hsl(0, 72%, 51%)',
                    }}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Review Stale ({bulkRejectEligible.length})
                  </button>
                )}
              </div>

              {/* Bulk Reject Confirmation */}
              {bulkConfirmOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-4"
                  style={{
                    background: 'hsla(0, 72%, 51%, 0.08)',
                    border: '1px solid hsla(0, 72%, 51%, 0.2)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(0, 72%, 51%)' }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Reject {bulkRejectSummary.count} stale items across {bulkRejectSummary.milestoneCount} milestone{bulkRejectSummary.milestoneCount !== 1 ? 's' : ''}
                      </p>
                      {bulkRejectSummary.medCredCount > 0 && (
                        <p className="text-xs mb-2" style={{ color: 'hsl(43, 96%, 56%)' }}>
                          ⚠ {bulkRejectSummary.medCredCount} item{bulkRejectSummary.medCredCount !== 1 ? 's have' : ' has'} medium-credibility sources
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mb-3">
                        Criteria: decayed score &lt; 0.40 · age &gt; 7 days · source tier 3-4 · not flagged for review
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleBulkReject}
                          disabled={processingAction === 'bulk'}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all"
                          style={{
                            background: 'hsla(0, 72%, 51%, 0.2)',
                            border: '1px solid hsla(0, 72%, 51%, 0.4)',
                            color: 'hsl(0, 72%, 51%)',
                          }}
                        >
                          {processingAction === 'bulk' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => setBulkConfirmOpen(false)}
                          className="px-3 py-1.5 rounded text-xs font-mono text-muted-foreground"
                          style={{ border: '1px solid hsla(220, 12%, 70%, 0.15)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Queue Items */}
              {filteredQueue.length === 0 ? (
                <div className="rounded-xl p-8 text-center text-muted-foreground text-sm" style={glassPanel}>
                  No pending evidence in this filter.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredQueue.map(item => {
                    const days = getAgeDays(item.created_at);
                    const effectiveScore = item.decayed_score ?? item.composite_score;
                    const scoreChanged = item.decayed_score !== null && Math.abs(item.decayed_score - item.composite_score) > 0.001;
                    const reasonInfo = QUEUE_REASON_LABELS[item.queue_reason || 'scout_queued'] || QUEUE_REASON_LABELS['scout_queued'];
                    const credInfo = getCredibilityLabel(item.publisher_tier);
                    const pressure = item.contradiction_pressure ?? 0;
                    const isSelected = selectedForBulk.has(item.id);

                    return (
                      <motion.div
                        key={item.id}
                        className="rounded-xl p-4 relative overflow-hidden"
                        style={{
                          ...glassPanel,
                          borderColor: isSelected ? 'hsla(0, 72%, 51%, 0.3)' : undefined,
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {/* Top row: reason + chips */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {/* Queue reason badge */}
                          <span
                            className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider"
                            style={{
                              background: `${reasonInfo.color}15`,
                              color: reasonInfo.color,
                              border: `1px solid ${reasonInfo.color}30`,
                            }}
                          >
                            {reasonInfo.label}
                          </span>

                          {/* Source credibility chip */}
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center gap-1"
                            style={{ color: credInfo.color }}
                          >
                            <Shield className="w-2.5 h-2.5" />
                            {credInfo.label}
                          </span>

                          {/* Contradiction pressure chip */}
                          {pressure > 0 && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center gap-1"
                              style={{ color: getPressureColor(pressure) }}
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Pressure: {pressure.toFixed(2)}
                            </span>
                          )}

                          {/* Age chip */}
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center gap-1 ml-auto"
                            style={{ color: getAgeColor(days) }}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {Math.round(days)}d ago
                          </span>
                        </div>

                        {/* Middle: content */}
                        <div className="mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono" style={{
                              color: item.direction === 'supports' ? 'hsl(155, 82%, 48%)' :
                                item.direction === 'contradicts' ? 'hsl(0, 72%, 51%)' : 'hsl(43, 96%, 56%)',
                            }}>
                              {item.direction === 'supports' ? '↑' : item.direction === 'contradicts' ? '↓' : '↔'}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono truncate">
                              {milestoneNames[item.milestone_id] || item.milestone_id}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/80 line-clamp-2">
                            {item.summary || item.raw_snippet || 'No summary'}
                          </p>
                          <span className="text-[10px] text-muted-foreground mt-1 block truncate">
                            {item.source_url || item.source}
                          </span>
                        </div>

                        {/* Bottom: scores + actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Scores */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-muted-foreground">Score:</span>
                              {scoreChanged ? (
                                <>
                                  <span className="text-[10px] font-mono line-through text-muted-foreground/50">
                                    {item.composite_score.toFixed(3)}
                                  </span>
                                  <span className="text-[10px] font-mono" style={{
                                    color: effectiveScore < 0.30 ? 'hsl(0, 72%, 51%)' :
                                      effectiveScore < 0.50 ? 'hsl(43, 96%, 56%)' : 'hsl(155, 82%, 48%)',
                                  }}>
                                    {effectiveScore.toFixed(3)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[10px] font-mono" style={{
                                  color: effectiveScore < 0.30 ? 'hsl(0, 72%, 51%)' :
                                    effectiveScore < 0.50 ? 'hsl(43, 96%, 56%)' : 'hsl(155, 82%, 48%)',
                                }}>
                                  {effectiveScore.toFixed(3)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleBulkSelect(item.id)}
                              className="w-3.5 h-3.5 rounded accent-[hsl(0,72%,51%)]"
                              title="Select for bulk action"
                            />
                            <button
                              onClick={() => handleSingleAction(item.id, 'approve')}
                              disabled={processingAction === item.id}
                              className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono transition-all hover:scale-[1.02]"
                              style={{
                                background: 'hsla(155, 82%, 48%, 0.1)',
                                border: '1px solid hsla(155, 82%, 48%, 0.25)',
                                color: 'hsl(155, 82%, 48%)',
                              }}
                            >
                              {processingAction === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleSingleAction(item.id, 'reject')}
                              disabled={processingAction === item.id}
                              className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono transition-all hover:scale-[1.02]"
                              style={{
                                background: 'hsla(0, 72%, 51%, 0.1)',
                                border: '1px solid hsla(0, 72%, 51%, 0.25)',
                                color: 'hsl(0, 72%, 51%)',
                              }}
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── WAITLIST TAB ─── */}
          {activeTab === 'waitlist' && (
            <div className="rounded-xl overflow-hidden" style={{ ...glassPanel }}>
              <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid hsla(220, 12%, 70%, 0.08)' }}>
                <Mail className="w-4 h-4" style={{ color: 'hsl(192, 95%, 50%)' }} />
                <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'hsl(192, 95%, 50%)' }}>
                  Waitlist Signups — {waitlistEntries.length} total
                </span>
              </div>
              {waitlistEntries.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No waitlist signups yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-muted-foreground" style={{ borderBottom: '1px solid hsla(220, 12%, 70%, 0.08)' }}>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Spot #</th>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3">Signed Up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waitlistEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid hsla(220, 12%, 70%, 0.05)' }}>
                          <td className="px-4 py-3 font-mono text-foreground">{entry.email}</td>
                          <td className="px-4 py-3 font-mono" style={{ color: 'hsl(192, 95%, 50%)' }}>#{entry.spot_number}</td>
                          <td className="px-4 py-3 text-muted-foreground">{entry.source}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
