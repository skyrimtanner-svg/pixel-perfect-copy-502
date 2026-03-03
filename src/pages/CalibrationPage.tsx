import { useState, useEffect, useMemo } from 'react';
import { useMode } from '@/contexts/ModeContext';
import { useMilestones } from '@/hooks/useMilestones';
import { motion } from 'framer-motion';
import { Award, Target, CheckCircle2, TrendingDown, Sparkles, Star, Info, Loader2 } from 'lucide-react';
import { glassPanelGold, glassPanelChrome, glassInner, specularReflection, goldChromeLine, chromeTopLine } from '@/lib/glass-styles';
import { supabase } from '@/integrations/supabase/client';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

const chromeGradientStyle = {
  background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 78%), hsl(220, 16%, 94%), hsl(220, 14%, 82%), hsl(220, 10%, 58%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

interface ResolvedEntry {
  id: string;
  title: string;
  domain: string;
  posterior: number;
  outcome: number; // 1 = accomplished, 0 = falsified
  brier: number;
}

export default function CalibrationPage() {
  const { isWonder } = useMode();
  const { milestones, loading } = useMilestones();

  // Compute resolved milestones and Brier score from live data
  const resolved = useMemo((): ResolvedEntry[] => {
    return milestones
      .filter(m => m.status === 'accomplished' || m.status === 'falsified')
      .filter(m => m.tier !== 'historical') // exclude historical anchors
      .map(m => {
        const outcome = m.status === 'accomplished' ? 1 : 0;
        const brier = (m.posterior - outcome) ** 2;
        return {
          id: m.id,
          title: m.title,
          domain: m.domain,
          posterior: m.posterior,
          outcome,
          brier,
        };
      });
  }, [milestones]);

  const brierScore = useMemo(() => {
    if (resolved.length === 0) return 0;
    return resolved.reduce((sum, r) => sum + r.brier, 0) / resolved.length;
  }, [resolved]);

  // Also compute a baseline across ALL non-historical milestones (treating current posterior as forecast)
  const allActive = useMemo(() => milestones.filter(m => m.tier !== 'historical'), [milestones]);
  const avgPosterior = useMemo(() => {
    if (allActive.length === 0) return 0;
    return allActive.reduce((s, m) => s + m.posterior, 0) / allActive.length;
  }, [allActive]);

  const calibrationLabel = brierScore < 0.1 ? 'Excellent' : brierScore < 0.15 ? 'Well Calibrated' : brierScore < 0.2 ? 'Fair' : 'Needs Improvement';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(43, 96%, 56%)' }} />
        <span className="ml-3 text-sm text-muted-foreground font-mono">Loading calibration data…</span>
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
      <div className="mb-5">
        <h1 className={`font-display font-bold ${isWonder ? 'text-gold text-2xl' : 'text-foreground text-xl'}`}>
          {isWonder ? '✦ Calibration' : 'Calibration'}
        </h1>
        <p className={`mt-1 ${isWonder ? 'text-xs text-muted-foreground' : 'text-[10px] font-mono text-chrome'}`}>
          {isWonder
            ? 'How accurate are our predictions? A lower Brier Score means we\'re getting closer to the truth!'
            : `Brier Score | 0 = perfect | 0.25 = random | ${resolved.length} resolved | ${allActive.length} active milestones`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Brier Score — Hero Gold Card */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden shine-sweep"
          style={{
            ...glassPanelGold,
            border: '1px solid hsla(43, 96%, 56%, 0.35)',
            boxShadow: [
              'inset 0 1px 0 hsla(48, 100%, 85%, 0.2)',
              'inset 0 -1px 0 hsla(38, 88%, 20%, 0.6)',
              '0 0 60px -12px hsla(43, 96%, 56%, 0.25)',
              '0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
            ].join(', '),
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -3 }}
        >
          <div className="absolute top-0 left-3 right-3 h-px" style={goldChromeLine} />
          <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-xl" style={{
            background: 'linear-gradient(180deg, hsla(48, 100%, 90%, 0.08) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />
          <TrendingDown className="w-5 h-5 mx-auto mb-2 relative z-10" style={{
            color: 'hsl(43, 96%, 56%)',
            filter: 'drop-shadow(0 0 10px hsla(43, 96%, 56%, 0.7))',
          }} />
          <div
            className="font-mono text-4xl font-bold tabular-nums relative z-10"
            style={{
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 20px hsla(43, 96%, 56%, 0.5))',
            }}
          >
            {resolved.length > 0 ? brierScore.toFixed(3) : '—'}
          </div>
          <div className="text-[9px] mt-2 uppercase tracking-[0.15em] font-semibold font-mono relative z-10" style={chromeGradientStyle}>
            Brier Score
          </div>
        </motion.div>

        {/* Resolved count */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden chrome-sweep"
          style={{
            ...glassPanelChrome,
            border: '1px solid hsla(220, 14%, 70%, 0.2)',
            boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.12), 0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -3 }}
        >
          <div className="absolute top-0 left-3 right-3 h-px" style={chromeTopLine} />
          <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-xl" style={specularReflection} />
          <CheckCircle2 className="w-5 h-5 mx-auto mb-2 relative z-10" style={{
            color: 'hsl(220, 14%, 78%)',
            filter: 'drop-shadow(0 0 8px hsla(220, 14%, 75%, 0.4))',
          }} />
          <div className="font-mono text-4xl font-bold tabular-nums relative z-10" style={chromeGradientStyle}>
            {resolved.length}
          </div>
          <div className="text-[9px] mt-2 uppercase tracking-[0.15em] font-semibold font-mono relative z-10" style={chromeGradientStyle}>Resolved</div>
        </motion.div>

        {/* Calibration Badge */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden shine-sweep"
          style={{
            ...glassPanelGold,
            border: '1px solid hsla(43, 96%, 56%, 0.35)',
            boxShadow: [
              'inset 0 1px 0 hsla(48, 100%, 85%, 0.2)',
              'inset 0 -1px 0 hsla(38, 88%, 20%, 0.6)',
              '0 0 60px -12px hsla(43, 96%, 56%, 0.25)',
              '0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
            ].join(', '),
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -3 }}
        >
          <div className="absolute top-0 left-3 right-3 h-px" style={goldChromeLine} />
          <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-xl" style={{
            background: 'linear-gradient(180deg, hsla(48, 100%, 90%, 0.08) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />
          {isWonder && (
            <motion.div
              className="absolute top-2 right-3"
              animate={{ rotate: [0, 20, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-4 h-4" style={{
                color: 'hsl(43, 96%, 56%)',
                filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.6))',
                opacity: 0.55,
              }} />
            </motion.div>
          )}
          <div className="flex items-center justify-center gap-2.5 relative z-10">
            <Award className="w-8 h-8" style={{
              color: 'hsl(43, 96%, 56%)',
              filter: 'drop-shadow(0 0 14px hsla(43, 96%, 56%, 0.7))',
            }} />
            <span className="font-display text-lg font-bold" style={{
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.3))',
            }}>{calibrationLabel}</span>
          </div>
          <div className="text-[9px] mt-2 uppercase tracking-[0.15em] font-semibold font-mono relative z-10" style={chromeGradientStyle}>Bias Assessment</div>
        </motion.div>
      </div>

      {/* Score range indicator */}
      <motion.div
        className="rounded-xl p-4 mb-6 relative overflow-hidden"
        style={{
          ...glassPanelChrome,
          border: '1px solid hsla(220, 14%, 70%, 0.18)',
          boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.1), 0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="absolute top-0 left-6 right-6 h-px" style={chromeTopLine} />
        <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl" style={specularReflection} />
        <div className="flex items-center gap-3 mb-2.5 relative z-10">
          <Target className="w-3.5 h-3.5" style={{ color: 'hsl(220, 14%, 70%)' }} />
          <span className="text-[10px] uppercase tracking-[0.12em] font-semibold font-mono" style={chromeGradientStyle}>Brier Score Range</span>
        </div>
        <div className="relative h-7 rounded-full overflow-hidden" style={{
          background: 'rgba(8, 10, 28, 0.7)',
          border: '1px solid hsla(220, 14%, 70%, 0.12)',
          boxShadow: 'inset 0 2px 4px hsla(232, 30%, 2%, 0.5)',
        }}>
          <div className="absolute inset-0 rounded-full" style={{
            background: 'linear-gradient(90deg, hsla(155, 82%, 48%, 0.4), hsla(155, 82%, 48%, 0.2) 25%, hsla(43, 96%, 56%, 0.3) 50%, hsla(36, 100%, 56%, 0.25) 72%, hsla(0, 72%, 55%, 0.4))',
          }} />
          <div className="absolute inset-x-0 top-0 h-[40%] rounded-t-full" style={{
            background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.08), transparent)',
            pointerEvents: 'none',
          }} />
          {/* Needle */}
          {resolved.length > 0 && (
            <motion.div
              className="absolute top-0 h-full w-2 rounded-full"
              style={{
                left: `${Math.min(100, (brierScore / 0.25) * 100)}%`,
                background: 'linear-gradient(180deg, hsl(50, 100%, 90%), hsl(48, 100%, 80%), hsl(43, 96%, 56%), hsl(40, 90%, 40%))',
                boxShadow: '0 0 16px hsla(43, 96%, 56%, 0.85), 0 0 6px hsla(43, 96%, 56%, 1)',
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            />
          )}
        </div>
        <div className="flex justify-between mt-2.5 font-mono text-[9px] tabular-nums relative z-10">
          <span style={{ color: 'hsl(155, 82%, 55%)' }}>0 perfect</span>
          <span className="font-bold text-[10px]" style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.35))',
          }}>{resolved.length > 0 ? brierScore.toFixed(3) : 'N/A'}</span>
          <span style={{ color: 'hsl(0, 72%, 58%)' }}>0.25 random</span>
        </div>
      </motion.div>

      {/* Portfolio Overview */}
      <motion.div
        className="rounded-xl p-5 mb-6 relative overflow-hidden"
        style={{
          ...glassPanelChrome,
          border: '1px solid hsla(220, 14%, 70%, 0.18)',
          boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.1), 0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="absolute top-0 left-6 right-6 h-px" style={chromeTopLine} />
        <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl" style={specularReflection} />
        <h3 className="font-display font-semibold text-sm mb-3 relative z-10" style={{
          ...goldGradientStyle,
          filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.2))',
        }}>
          {isWonder ? '📊 Forecast Portfolio' : 'Active Forecast Portfolio'}
        </h3>
        <div className="grid grid-cols-5 gap-3 relative z-10">
          {['compute', 'energy', 'connectivity', 'manufacturing', 'biology'].map(domain => {
            const domainMs = allActive.filter(m => m.domain === domain);
            const avgP = domainMs.length > 0 ? domainMs.reduce((s, m) => s + m.posterior, 0) / domainMs.length : 0;
            const domainColors: Record<string, string> = {
              compute: 'hsl(192, 100%, 52%)',
              energy: 'hsl(36, 100%, 56%)',
              connectivity: 'hsl(268, 90%, 68%)',
              manufacturing: 'hsl(342, 82%, 62%)',
              biology: 'hsl(155, 82%, 48%)',
            };
            return (
              <div key={domain} className="text-center">
                <div className="font-mono text-xl font-bold tabular-nums" style={{
                  color: domainColors[domain],
                  textShadow: `0 0 12px ${domainColors[domain]}44`,
                }}>
                  {(avgP * 100).toFixed(0)}%
                </div>
                <div className="text-[8px] uppercase tracking-wider font-mono mt-1" style={chromeGradientStyle}>
                  {domain}
                </div>
                <div className="text-[9px] font-mono mt-0.5" style={{ color: 'hsl(218, 15%, 50%)' }}>
                  {domainMs.length} active
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Resolved Milestones Table */}
      {resolved.length > 0 && (
        <motion.div
          className="rounded-xl p-5 mb-6 relative overflow-hidden"
          style={{
            ...glassPanelChrome,
            border: '1px solid hsla(220, 14%, 70%, 0.18)',
            boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.1), 0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="absolute top-0 left-6 right-6 h-px" style={chromeTopLine} />
          <div className="absolute top-0 left-0 right-0 h-[20%] rounded-t-xl" style={specularReflection} />
          <h3 className="font-display font-semibold text-sm mb-3 relative z-10" style={{
            ...goldGradientStyle,
          }}>Resolved Milestones</h3>
          <div className="space-y-2 relative z-10">
            {resolved.map(r => (
              <div key={r.id} className="flex items-center justify-between py-1.5 px-2 rounded-md" style={{
                background: 'hsla(232, 26%, 4%, 0.4)',
                border: '1px solid hsla(220, 12%, 70%, 0.06)',
              }}>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[11px] text-secondary-foreground truncate block">{r.title}</span>
                </div>
                <div className="flex items-center gap-4 font-mono text-[10px] tabular-nums shrink-0">
                  <span style={{ color: 'hsl(218, 15%, 55%)' }}>P={r.posterior.toFixed(2)}</span>
                  <span style={{ color: r.outcome === 1 ? 'hsl(155, 82%, 55%)' : 'hsl(0, 72%, 58%)' }}>
                    {r.outcome === 1 ? '✓ TRUE' : '✗ FALSE'}
                  </span>
                  <span style={{
                    ...goldGradientStyle,
                    filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.2))',
                  }}>BS={r.brier.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Methodology Transparency */}
      <motion.div
        className="rounded-xl p-5 relative overflow-hidden"
        style={{
          ...glassPanelChrome,
          border: '1px solid hsla(220, 14%, 70%, 0.18)',
          boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.1), 0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
      >
        <div className="absolute top-0 left-6 right-6 h-px" style={chromeTopLine} />
        <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl" style={specularReflection} />
        <h3 className="font-display font-semibold text-sm mb-3 relative z-10" style={{
          ...goldGradientStyle,
          filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.2))',
        }}>
          {isWonder ? '🎯 How We Keep Score' : 'Scoring Methodology'}
        </h3>
        <div className={`space-y-2.5 leading-relaxed relative z-10 ${isWonder ? 'text-[13px] text-secondary-foreground' : 'text-[12px] font-mono'}`}>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'Only milestones that have actually happened (or been disproven) count toward our accuracy score'
              : 'Only resolved milestones (accomplished/falsified) count toward BS'}
          </p>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'Historical anchors (things from centuries ago) don\'t count — that would be too easy!'
              : 'Historical anchors excluded from calibration'}
          </p>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'We use the last probability snapshot before the milestone was resolved'
              : 'LAST snapshot before resolution date used'}
          </p>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'Forecasts must be at least 30 days old — no last-minute cheating allowed!'
              : <>Forecast ≥<span className="text-gold-num tabular-nums" style={{ WebkitTextFillColor: 'hsl(43, 82%, 60%)' }}>30</span>d at resolution (anti-gaming)</>}
          </p>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'Sandbox experiments never count toward our real calibration — only the real deal!'
              : 'Sandbox scenarios excluded from canonical calibration'}
          </p>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'Evidence is weighted by publisher tier (1–4), freshness decay, consensus, and criteria match'
              : 'Evidence weighted: PUBLISHER_TIER_MAP × freshness_decay × consensus × criteria_match'}
          </p>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'Priors are set by domain experts and updated only through verified evidence — never guessed'
              : 'Priors set per v3_0 CRED_DRIFT_INIT; updated via Bayesian log-odds aggregation'}
          </p>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'Domain coupling means breakthroughs in one field can ripple into others (like AI helping biology!)'
              : 'DOMAIN_GRAPH coupling: cross-domain propagation via COUPLING_ALPHA=0.07'}
          </p>
          <div
            className="font-mono text-xs mt-4 px-4 py-3 rounded-lg tabular-nums relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.08), rgba(8, 10, 28, 0.85))',
              border: '1px solid hsla(43, 96%, 56%, 0.22)',
              boxShadow: 'inset 0 1px 0 hsla(43, 96%, 56%, 0.1), 0 0 24px -8px hsla(43, 96%, 56%, 0.12)',
              backdropFilter: 'blur(24px)',
              color: 'hsl(43, 82%, 60%)',
              textShadow: '0 0 10px hsla(43, 96%, 56%, 0.25)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
            <span className="relative z-10">
              BS = (<span style={{ color: 'hsl(43, 96%, 56%)' }}>1</span>/N) × Σ(predicted − outcome)² | <span style={{ color: 'hsl(43, 96%, 56%)' }}>0</span> = perfect, <span style={{ color: 'hsl(43, 96%, 56%)' }}>0.25</span> = random
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
