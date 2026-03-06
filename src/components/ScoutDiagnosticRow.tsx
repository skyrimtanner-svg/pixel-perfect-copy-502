import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { glassPanel, goldChromeLine, specularReflection } from '@/lib/glass-styles';
import { Bot, AlertTriangle } from 'lucide-react';

interface SourceBreakdown {
  rss: number;
  x_twitter: number;
  clinicaltrials: number;
  patents: number;
}

interface LastRun {
  run_id: string;
  timestamp: string;
  sources: SourceBreakdown;
}

const SOURCE_LABELS: { key: keyof SourceBreakdown; label: string }[] = [
  { key: 'rss', label: 'RSS' },
  { key: 'x_twitter', label: 'X / Twitter' },
  { key: 'clinicaltrials', label: 'ClinicalTrials' },
  { key: 'patents', label: 'Patents' },
];

export default function ScoutDiagnosticRow() {
  const [lastRun, setLastRun] = useState<LastRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Get the most recent run_id
      const { data: latest } = await supabase
        .from('scout_logs')
        .select('run_id, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!latest || latest.length === 0) {
        setLoading(false);
        return;
      }

      const runId = latest[0].run_id;
      const timestamp = latest[0].created_at;

      // Get all logs for that run
      const { data: logs } = await supabase
        .from('scout_logs')
        .select('action, detail')
        .eq('run_id', runId);

      const sources: SourceBreakdown = { rss: 0, x_twitter: 0, clinicaltrials: 0, patents: 0 };

      (logs || []).forEach((log) => {
        const detail = log.detail as Record<string, any> | null;
        if (!detail) return;

        const src = (detail.source || detail.feed || log.action || '').toLowerCase();
        const count = detail.articles_fetched ?? detail.count ?? detail.fetched ?? 1;

        if (src.includes('x.com') || src.includes('twitter') || src.includes('x_search')) {
          sources.x_twitter += Number(count) || 0;
        } else if (src.includes('clinicaltrials')) {
          sources.clinicaltrials += Number(count) || 0;
        } else if (src.includes('patent')) {
          sources.patents += Number(count) || 0;
        } else if (src.includes('rss') || src.includes('arxiv') || src.includes('nature') || src.includes('science') || src.includes('reuters') || src.includes('bbc') || src.includes('techcrunch') || src.includes('feed')) {
          sources.rss += Number(count) || 0;
        }
      });

      setLastRun({ run_id: runId, timestamp, sources });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return null;

  if (!lastRun) {
    return (
      <div className="rounded-xl p-4 mb-6" style={glassPanel}>
        <p className="text-muted-foreground text-xs font-mono">No scout runs found.</p>
      </div>
    );
  }

  const ts = new Date(lastRun.timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="rounded-xl p-5 mb-6 relative overflow-hidden" style={glassPanel}>
      <div className="absolute top-0 left-4 right-4 h-px" style={goldChromeLine} />
      <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl pointer-events-none" style={specularReflection} />

      <div className="flex items-center gap-2 mb-3 relative z-10">
        <Bot className="w-4 h-4" style={{ color: 'hsl(43, 96%, 56%)' }} />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Last Scout Run</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-3 relative z-10">
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Run ID</span>
          <p className="text-xs font-mono" style={{ color: 'hsl(220, 12%, 70%)' }}>
            {lastRun.run_id.slice(0, 8)}…
          </p>
        </div>
        <div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Timestamp</span>
          <p className="text-xs font-mono" style={{ color: 'hsl(220, 12%, 70%)' }}>{ts}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        {SOURCE_LABELS.map(({ key, label }) => {
          const count = lastRun.sources[key];
          const isZero = count === 0;
          return (
            <div
              key={key}
              className="rounded-lg px-3 py-2.5 flex items-center gap-2"
              style={{
                background: isZero ? 'hsla(0, 70%, 50%, 0.1)' : 'hsla(220, 12%, 70%, 0.06)',
                border: isZero ? '1px solid hsla(0, 70%, 50%, 0.3)' : '1px solid hsla(220, 12%, 70%, 0.08)',
              }}
            >
              {isZero && <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: 'hsl(0, 70%, 50%)' }} />}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: isZero ? 'hsl(0, 70%, 50%)' : 'hsl(220, 12%, 55%)' }}>
                  {label}
                </span>
                <p className="text-sm font-bold font-mono" style={{ color: isZero ? 'hsl(0, 70%, 50%)' : 'white' }}>
                  {count}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
