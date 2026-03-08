import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { glassPanelStrong, glassInner, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { ChevronDown, ChevronRight, Activity, Clock, Zap, Database, GitBranch, Gauge } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ScoutLogEntry {
  id: string;
  run_id: string;
  action: string;
  detail: any;
  created_at: string;
}

interface TelemetryMetrics {
  totalRuns: number;
  avgLatencyMs: number;
  autoCommitCount: number;
  pendingCount: number;
  classificationSuccessRate: number;
  latencyTimeline: { t: number; v: number }[];
  throughputTimeline: { t: number; v: number }[];
  directiveVersions: { key: string; updatedAt: string }[];
  sourceBreakdown: Record<string, number>;
}

function computeMetrics(logs: ScoutLogEntry[]): TelemetryMetrics {
  const runIds = new Set(logs.map(l => l.run_id));
  const classifyLogs = logs.filter(l => l.action === 'classify' || l.action === 'score');
  const autoCommitLogs = logs.filter(l => l.action === 'auto_commit' || l.action === 'auto-commit');
  const queueLogs = logs.filter(l => l.action === 'queue' || l.action === 'queued');
  const directiveLogs = logs.filter(l => l.action === 'directives_loaded' || l.action === 'directive_applied');

  // Latency from detail.latency_ms or estimate from timestamps within same run
  const latencies: number[] = [];
  classifyLogs.forEach(l => {
    const ms = l.detail?.latency_ms || l.detail?.duration_ms;
    if (typeof ms === 'number') latencies.push(ms);
  });

  const avgLatencyMs = latencies.length > 0
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;

  const successCount = classifyLogs.filter(l => !l.detail?.error).length;
  const classificationSuccessRate = classifyLogs.length > 0
    ? successCount / classifyLogs.length
    : 1;

  // Build timeline sparkline data (last 20 points)
  const sorted = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const latencyTimeline = latencies.slice(-20).map((v, i) => ({ t: i, v }));

  // Throughput: items per run
  const runCounts: Record<string, number> = {};
  classifyLogs.forEach(l => {
    runCounts[l.run_id] = (runCounts[l.run_id] || 0) + 1;
  });
  const throughputTimeline = Object.values(runCounts).slice(-20).map((v, i) => ({ t: i, v }));

  // Source breakdown
  const sourceBreakdown: Record<string, number> = {};
  logs.forEach(l => {
    const src = l.detail?.source || l.detail?.source_type;
    if (src) sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
  });

  // Directive versions
  const directiveVersions: { key: string; updatedAt: string }[] = [];
  directiveLogs.forEach(l => {
    if (l.detail?.directives && Array.isArray(l.detail.directives)) {
      l.detail.directives.forEach((d: any) => {
        directiveVersions.push({ key: d.key || 'unknown', updatedAt: d.updated_at || l.created_at });
      });
    }
  });

  return {
    totalRuns: runIds.size,
    avgLatencyMs,
    autoCommitCount: autoCommitLogs.length,
    pendingCount: queueLogs.length,
    classificationSuccessRate,
    latencyTimeline,
    throughputTimeline,
    directiveVersions,
    sourceBreakdown,
  };
}

function MetricCell({ icon: Icon, label, value, unit, color }: {
  icon: any; label: string; value: string; unit?: string; color: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg relative overflow-hidden" style={glassInner}>
      <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
      <div className="flex items-center gap-1.5 relative z-10">
        <Icon size={12} style={{ color }} />
        <span className="text-[9px] font-mono uppercase tracking-wider" style={{
          background: 'linear-gradient(135deg, hsl(220, 10%, 55%), hsl(220, 14%, 78%))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1 relative z-10">
        <span className="text-lg font-display font-bold tabular-nums" style={{
          color,
          textShadow: `0 0 12px ${color.replace('hsl', 'hsla').replace(')', ', 0.4)')}`,
        }}>{value}</span>
        {unit && <span className="text-[9px] font-mono" style={{ color: 'hsl(218, 15%, 46%)' }}>{unit}</span>}
      </div>
    </div>
  );
}

function Sparkline({ data, color, height = 32 }: { data: { t: number; v: number }[]; color: string; height?: number }) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <span className="text-[9px] font-mono" style={{ color: 'hsl(218, 15%, 38%)' }}>awaiting data…</span>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          style={{ filter: `drop-shadow(0 0 6px ${color.replace('hsl', 'hsla').replace(')', ', 0.5)')})` }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function CommitDistribution({ autoCount, pendingCount }: { autoCount: number; pendingCount: number }) {
  const total = autoCount + pendingCount;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[60px]">
        <span className="text-[9px] font-mono" style={{ color: 'hsl(218, 15%, 38%)' }}>no commit data</span>
      </div>
    );
  }
  const data = [
    { name: 'Auto', value: autoCount },
    { name: 'Pending', value: pendingCount },
  ];
  const colors = ['hsl(43, 96%, 56%)', 'hsl(218, 15%, 46%)'];

  return (
    <div className="flex items-center gap-3">
      <div className="w-[60px] h-[60px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={16} outerRadius={26} strokeWidth={0}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} style={{ filter: i === 0 ? 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.4))' : 'none' }} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: colors[i], boxShadow: i === 0 ? '0 0 6px hsla(43, 96%, 56%, 0.5)' : 'none' }} />
            <span className="text-[9px] font-mono" style={{ color: colors[i] }}>{d.name}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EngineTelemetry() {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<ScoutLogEntry[]>([]);
  const [directives, setDirectives] = useState<{ key: string; updated_at: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin || !open) return;
    setLoading(true);

    const fetchData = async () => {
      const [logsRes, directivesRes] = await Promise.all([
        supabase.from('scout_logs').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('scout_directives').select('key, updated_at').order('updated_at', { ascending: false }),
      ]);
      if (logsRes.data) setLogs(logsRes.data);
      if (directivesRes.data) setDirectives(directivesRes.data);
      setLoading(false);
    };

    fetchData();
  }, [isAdmin, open]);

  const metrics = useMemo(() => computeMetrics(logs), [logs]);

  if (!isAdmin) return null;

  return (
    <motion.div
      className="mt-6 rounded-xl relative overflow-hidden"
      style={glassPanelStrong}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
      <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl pointer-events-none" style={specularReflection} />

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 relative z-10 group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <Activity size={14} style={{ color: 'hsl(43, 96%, 56%)' }} />
          <span className="text-xs font-mono font-bold uppercase tracking-widest" style={{
            background: 'linear-gradient(135deg, hsl(43, 96%, 56%), hsl(43, 80%, 72%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
          }}>Engine Telemetry</span>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full" style={{
            background: 'hsla(43, 96%, 56%, 0.08)',
            color: 'hsl(43, 96%, 56%)',
            border: '1px solid hsla(43, 96%, 56%, 0.15)',
          }}>ADMIN</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: 'hsl(218, 15%, 46%)' }} />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Gauge size={16} style={{ color: 'hsl(43, 96%, 56%)' }} />
                  </motion.div>
                  <span className="text-xs font-mono" style={{ color: 'hsl(218, 15%, 46%)' }}>Loading telemetry…</span>
                </div>
              ) : (
                <>
                  {/* Top metrics row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCell
                      icon={Zap}
                      label="Scout Runs"
                      value={String(metrics.totalRuns)}
                      color="hsl(192, 100%, 52%)"
                    />
                    <MetricCell
                      icon={Clock}
                      label="Avg Latency"
                      value={metrics.avgLatencyMs > 0 ? metrics.avgLatencyMs.toFixed(0) : '—'}
                      unit="ms"
                      color="hsl(36, 100%, 56%)"
                    />
                    <MetricCell
                      icon={Database}
                      label="Success Rate"
                      value={`${(metrics.classificationSuccessRate * 100).toFixed(0)}%`}
                      color="hsl(155, 82%, 48%)"
                    />
                    <MetricCell
                      icon={GitBranch}
                      label="Total Processed"
                      value={String(logs.length)}
                      unit="events"
                      color="hsl(268, 90%, 68%)"
                    />
                  </div>

                  {/* Sparklines row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg" style={glassInner}>
                      <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'hsl(218, 15%, 46%)' }}>
                        Classification Latency
                      </span>
                      <Sparkline data={metrics.latencyTimeline} color="hsl(36, 100%, 56%)" />
                    </div>
                    <div className="p-3 rounded-lg" style={glassInner}>
                      <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'hsl(218, 15%, 46%)' }}>
                        Throughput (items/run)
                      </span>
                      <Sparkline data={metrics.throughputTimeline} color="hsl(192, 100%, 52%)" />
                    </div>
                  </div>

                  {/* Bottom row: commit distribution + directives */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg" style={glassInner}>
                      <span className="text-[9px] font-mono uppercase tracking-wider mb-2 block" style={{ color: 'hsl(218, 15%, 46%)' }}>
                        Auto-Commit vs Pending
                      </span>
                      <CommitDistribution autoCount={metrics.autoCommitCount} pendingCount={metrics.pendingCount} />
                    </div>

                    <div className="p-3 rounded-lg" style={glassInner}>
                      <span className="text-[9px] font-mono uppercase tracking-wider mb-2 block" style={{ color: 'hsl(218, 15%, 46%)' }}>
                        Active Directives
                      </span>
                      {directives.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {directives.map(d => (
                            <div key={d.key} className="flex items-center justify-between">
                              <span className="text-[10px] font-mono" style={{ color: 'hsl(43, 96%, 56%)' }}>{d.key}</span>
                              <span className="text-[8px] font-mono" style={{ color: 'hsl(218, 15%, 38%)' }}>
                                {new Date(d.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[9px] font-mono" style={{ color: 'hsl(218, 15%, 38%)' }}>no directives configured</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
