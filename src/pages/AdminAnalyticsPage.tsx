import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { glassPanel, glassPanelGold, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { Users, Zap, FileText, BarChart3, Eye, Loader2, Check, X, Search, Bot, Clock } from 'lucide-react';
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
  const { isAdmin, loading: authLoading, session } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingEvidence, setPendingEvidence] = useState<PendingEvidence[]>([]);
  const [scoutLogs, setScoutLogs] = useState<ScoutLog[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [scoutRunning, setScoutRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'queue' | 'logs'>('metrics');

  const fetchPending = useCallback(async () => {
    const { data } = await supabase
      .from('pending_evidence')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setPendingEvidence(data as PendingEvidence[]);
  }, []);

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from('scout_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
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
  }, [isAdmin, fetchPending, fetchLogs]);

  const handleApproveReject = async (pendingId: string, action: 'approve' | 'reject') => {
    setProcessingIds(prev => new Set(prev).add(pendingId));
    try {
      const { data, error } = await supabase.functions.invoke('approve-evidence', {
        body: { action, pending_id: pendingId },
      });

      if (error) throw error;
      toast.success(action === 'approve' ? 'Evidence approved & committed' : 'Evidence rejected');
      setPendingEvidence(prev => prev.filter(p => p.id !== pendingId));
    } catch (e) {
      toast.error(`Failed to ${action}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(pendingId); return s; });
    }
  };

  const triggerScoutRun = async () => {
    setScoutRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('evidence-scout');
      if (error) throw error;
      toast.success(`Scout run complete: ${data?.evidence_queued || 0} evidence items queued`);
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

  const directionColor = (d: string) => d === 'supports' ? 'hsl(155, 82%, 48%)' : d === 'contradicts' ? 'hsl(0, 82%, 60%)' : 'hsl(43, 96%, 56%)';

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
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all"
          style={{
            background: scoutRunning ? 'hsla(43, 96%, 56%, 0.1)' : 'hsla(43, 96%, 56%, 0.15)',
            border: '1px solid hsla(43, 96%, 56%, 0.3)',
            color: 'hsl(43, 96%, 56%)',
            opacity: scoutRunning ? 0.6 : 1,
          }}
        >
          {scoutRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
          {scoutRunning ? 'Scanning…' : 'Run Evidence Scout'}
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
          {/* Metrics Tab */}
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
                      <Icon className="w-5 h-5 mb-3" style={{ color: card.color, filter: `drop-shadow(0 0 6px ${card.color}60)` }} />
                      <div className="metallic-num text-2xl font-bold">{card.value}</div>
                      <div className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase mt-1">{card.label}</div>
                    </motion.div>
                  );
                })}
              </div>

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

          {/* Approval Queue Tab */}
          {activeTab === 'queue' && (
            <div className="space-y-3">
              {pendingEvidence.length === 0 ? (
                <div className="rounded-xl p-8 text-center" style={glassPanel}>
                  <Search className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(220, 12%, 40%)' }} />
                  <p className="text-sm text-muted-foreground font-mono">No pending evidence to review</p>
                  <p className="text-xs text-muted-foreground/60 font-mono mt-1">Run the Evidence Scout to scan for new findings</p>
                </div>
              ) : (
                <AnimatePresence>
                  {pendingEvidence.map((pe, i) => (
                    <motion.div
                      key={pe.id}
                      className="rounded-xl p-4 relative overflow-hidden"
                      style={glassPanel}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
                              style={{
                                background: `${directionColor(pe.direction)}20`,
                                color: directionColor(pe.direction),
                                border: `1px solid ${directionColor(pe.direction)}30`,
                              }}
                            >
                              {pe.direction}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">T{pe.publisher_tier}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{pe.evidence_type}</span>
                            <span className="text-[10px] font-mono text-muted-foreground/50">
                              {new Date(pe.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-foreground/80 truncate">{pe.milestone_id}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pe.summary}</p>
                          {pe.source_url && (
                            <a
                              href={pe.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono mt-1 inline-block"
                              style={{ color: 'hsl(192, 95%, 50%)' }}
                            >
                              {pe.source} ↗
                            </a>
                          )}
                          <div className="flex gap-3 mt-2 text-[10px] font-mono text-muted-foreground/60">
                            <span>cred: {pe.credibility.toFixed(2)}</span>
                            <span>cons: {pe.consensus.toFixed(2)}</span>
                            <span>match: {pe.criteria_match.toFixed(2)}</span>
                            <span className="text-foreground/80">comp: {pe.composite_score.toFixed(3)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleApproveReject(pe.id, 'approve')}
                            disabled={processingIds.has(pe.id)}
                            className="p-2 rounded-lg transition-all hover:scale-105"
                            style={{
                              background: 'hsla(155, 82%, 48%, 0.12)',
                              border: '1px solid hsla(155, 82%, 48%, 0.25)',
                              color: 'hsl(155, 82%, 48%)',
                            }}
                          >
                            {processingIds.has(pe.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleApproveReject(pe.id, 'reject')}
                            disabled={processingIds.has(pe.id)}
                            className="p-2 rounded-lg transition-all hover:scale-105"
                            style={{
                              background: 'hsla(0, 82%, 60%, 0.12)',
                              border: '1px solid hsla(0, 82%, 60%, 0.25)',
                              color: 'hsl(0, 82%, 60%)',
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="rounded-xl relative overflow-hidden" style={glassPanel}>
              <div className="absolute top-0 left-4 right-4 h-px" style={goldChromeLine} />
              <div className="p-4 space-y-1 max-h-[500px] overflow-y-auto font-mono text-[11px]">
                {scoutLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No scout logs yet</p>
                ) : (
                  scoutLogs.map(log => (
                    <div key={log.id} className="flex gap-3 py-1 border-b border-border/5">
                      <span className="text-muted-foreground/40 shrink-0 w-16">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="shrink-0 w-20 text-muted-foreground/60 truncate">{log.run_id?.slice(0, 8)}</span>
                      <span style={{ color: log.action.includes('error') ? 'hsl(0, 82%, 60%)' : log.action.includes('completed') ? 'hsl(155, 82%, 48%)' : 'hsl(43, 96%, 56%)' }}>
                        {log.action}
                      </span>
                      <span className="text-muted-foreground/40 truncate">{JSON.stringify(log.detail).slice(0, 80)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
