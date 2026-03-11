import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { TrendingUp, ExternalLink, Users, RefreshCw, Loader2 } from 'lucide-react';

interface MarketData {
  source: 'metaculus' | 'polymarket';
  question: string;
  probability: number | null;
  url: string;
  lastUpdated: string;
  participantCount?: number;
}

interface PredictionMarketsProps {
  milestoneId: string;
  posterior: number;
}

export function PredictionMarkets({ milestoneId, posterior }: PredictionMarketsProps) {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('prediction-markets', {
        body: null,
        headers: { 'Content-Type': 'application/json' },
      });

      // Use query param approach via direct fetch
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/prediction-markets?milestone_id=${milestoneId}`,
        {
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to fetch markets');
      const result = await res.json();
      setMarkets(result.markets || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load market data');
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [milestoneId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-xs">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="font-mono">Loading market data…</span>
      </div>
    );
  }

  if (error || markets.length === 0) {
    return (
      <div className="rounded-xl p-4 text-center" style={{
        background: 'hsla(232, 26%, 8%, 0.4)',
        border: '1px solid hsla(220, 12%, 70%, 0.08)',
      }}>
        <TrendingUp className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs text-muted-foreground font-mono">
          {error || 'No prediction market data available for this milestone'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: 'hsl(192, 95%, 50%)' }} />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Prediction Markets
          </span>
        </div>
        <button
          onClick={fetchMarkets}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {markets.map((market, i) => {
        const marketProb = market.probability;
        const delta = marketProb !== null ? ((marketProb - posterior) * 100) : null;
        const sourceColor = market.source === 'metaculus' ? 'hsl(220, 80%, 60%)' : 'hsl(155, 82%, 48%)';

        return (
          <motion.div
            key={`${market.source}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl p-4 relative overflow-hidden"
            style={{
              background: 'hsla(232, 26%, 8%, 0.5)',
              border: '1px solid hsla(220, 12%, 70%, 0.08)',
            }}
          >
            {/* Source badge */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{
                  background: `${sourceColor}15`,
                  color: sourceColor,
                  border: `1px solid ${sourceColor}30`,
                }}
              >
                {market.source}
              </span>
              <a
                href={market.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Question */}
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">
              {market.question}
            </p>

            {/* Probability comparison */}
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                  Market Price
                </span>
                <div className="text-xl font-mono font-bold tabular-nums" style={{ color: sourceColor }}>
                  {marketProb !== null ? `${(marketProb * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>

              {delta !== null && (
                <div className="text-right">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                    vs ÆTH
                  </span>
                  <div
                    className="text-sm font-mono font-bold tabular-nums"
                    style={{
                      color: Math.abs(delta) < 5
                        ? 'hsl(220, 12%, 55%)'
                        : delta > 0
                          ? 'hsl(155, 82%, 48%)'
                          : 'hsl(0, 72%, 55%)',
                    }}
                  >
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}pp
                  </div>
                </div>
              )}

              {market.participantCount !== undefined && market.participantCount > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span className="text-[10px] font-mono">{market.participantCount}</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
