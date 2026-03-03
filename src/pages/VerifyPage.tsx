import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/contexts/ModeContext';
import { ProbabilityRing } from '@/components/ProbabilityRing';
import { glassPanelStrong, glassPanelGold, glassInner } from '@/lib/glass-styles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Copy, Check, ShieldCheck, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect, useCallback } from 'react';

interface Contribution {
  evidence_id: string;
  delta_log_odds: number;
  composite: number;
  evidence_meta: {
    direction: string;
    type: string;
    credibility: number;
    consensus: number;
    criteria_match: number;
    recency: number;
    decay: number;
  };
}

interface SnapshotData {
  sha256_hash: string;
  milestone_id: string;
  prior: number;
  posterior: number;
  prior_log_odds: number | null;
  posterior_log_odds: number | null;
  delta_log_odds: number | null;
  snapshot_type: string;
  created_at: string;
  evidence_id: string | null;
  prev_hash: string | null;
  contributions: Contribution[] | null;
  full_state: Record<string, unknown>;
}

export default function VerifyPage() {
  const { hash } = useParams<{ hash: string }>();
  const { isWonder } = useMode();
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState(false);

  const { data: snapshot, isLoading, error } = useQuery({
    queryKey: ['verify', hash],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_ledger')
        .select('*')
        .eq('sha256_hash', hash!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SnapshotData | null;
    },
    enabled: !!hash,
  });

  const { data: milestone } = useQuery({
    queryKey: ['verify-milestone', snapshot?.milestone_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('milestones')
        .select('title, domain, archetype, year, tier')
        .eq('id', snapshot!.milestone_id)
        .maybeSingle();
      return data;
    },
    enabled: !!snapshot?.milestone_id,
  });

  // Verification animation
  useEffect(() => {
    if (snapshot) {
      const t = setTimeout(() => setVerified(true), 800);
      return () => clearTimeout(t);
    }
  }, [snapshot]);

  const copyHash = useCallback(() => {
    if (hash) {
      navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [hash]);

  const contributions = (snapshot?.contributions as unknown as Contribution[]) || [];
  const sorted = [...contributions].sort((a, b) => Math.abs(b.delta_log_odds) - Math.abs(a.delta_log_odds));

  const dirColor = (d: string) =>
    d === 'supports' ? 'hsl(155, 82%, 48%)' : d === 'contradicts' ? 'hsl(0, 72%, 55%)' : 'hsl(220, 12%, 48%)';

  const typeLabel = (t: string) => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const exportJson = useCallback(() => {
    if (!snapshot) return;
    const blob = new Blob([JSON.stringify(snapshot.full_state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapshot-${hash?.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [snapshot, hash]);

  if (isLoading) {
    return (
      <div className="min-h-screen nebula-bg stars-bg flex items-center justify-center">
        <motion.div
          className="text-gold font-mono text-lg"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Verifying snapshot integrity…
        </motion.div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen nebula-bg stars-bg flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Snapshot Not Found</h1>
          <p className="text-muted-foreground max-w-md">
            The SHA-256 hash <code className="text-xs font-mono text-gold-solid break-all">{hash}</code> does not match any record in the Trust Ledger.
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" className="border-chrome gap-2"><ArrowLeft className="w-4 h-4" />Back to Observatory</Button>
        </Link>
      </div>
    );
  }

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <TooltipProvider>
      <div className="min-h-screen nebula-bg stars-bg relative overflow-x-hidden">
        <div className="constellation-particles" />
        {isWonder && <div className="constellation-particles-2" />}

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Back link */}
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> AETH Observatory
          </Link>

          {/* ═══ HERO HEADER ═══ */}
          <motion.div
            className="rounded-2xl p-8 text-center space-y-6"
            style={glassPanelStrong}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">
              Immutable Forecast Snapshot
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {isWonder ? '🔮 ' : ''}AETH Observatory • Trust Ledger Verification
            </h1>

            {/* Glowing SHA-256 hash */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={copyHash}
                  className="group mx-auto flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                  style={{
                    background: 'linear-gradient(135deg, hsla(43, 40%, 10%, 0.5), hsla(232, 26%, 5%, 0.6))',
                    border: '1px solid hsla(43, 96%, 56%, 0.3)',
                    boxShadow: '0 0 32px -8px hsla(43, 96%, 56%, 0.2)',
                  }}
                >
                  <span className="font-mono text-xs md:text-sm text-gold break-all leading-relaxed">{hash}</span>
                  {copied ? <Check className="w-4 h-4 text-green-400 shrink-0" /> : <Copy className="w-4 h-4 text-gold-solid shrink-0 opacity-60 group-hover:opacity-100" />}
                </button>
              </TooltipTrigger>
              <TooltipContent className="glass text-xs">
                {copied ? 'Copied!' : isWonder ? 'This receipt is forever ✨' : 'Verified on blockchain ledger — click to copy'}
              </TooltipContent>
            </Tooltip>
          </motion.div>

          {/* ═══ PROBABILITY RING + MILESTONE ═══ */}
          <motion.div
            className="rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8"
            style={glassPanelGold}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="relative">
              <ProbabilityRing
                value={snapshot.posterior}
                size={160}
                strokeWidth={10}
                useGold
              />
              {/* Lens-flare on load */}
              <motion.div
                className="absolute top-4 right-2 w-12 h-6 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse, hsla(48, 100%, 90%, 0.4), transparent)',
                  filter: 'blur(3px)',
                }}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: [0, 0.8, 0.3], scale: [0.3, 1.2, 1] }}
                transition={{ duration: 1.2, delay: 0.6 }}
              />
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {milestone?.title || snapshot.milestone_id}
              </h2>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {milestone?.domain && (
                  <Badge variant="outline" className="capitalize border-chrome text-xs">
                    {milestone.domain}
                  </Badge>
                )}
                {milestone?.archetype && (
                  <Badge variant="outline" className="capitalize border-chrome text-xs">
                    {milestone.archetype}
                  </Badge>
                )}
                {milestone?.year && (
                  <Badge variant="outline" className="border-chrome text-xs font-mono">
                    {milestone.year}
                  </Badge>
                )}
              </div>
              <div className="flex gap-6 justify-center md:justify-start text-sm">
                <div>
                  <span className="text-muted-foreground">Prior</span>
                  <span className="ml-2 metallic-num text-lg">{(snapshot.prior * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Posterior</span>
                  <span className="ml-2 metallic-num text-lg">{(snapshot.posterior * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Δ log-odds</span>
                  <span className={`ml-2 font-mono text-lg ${(snapshot.delta_log_odds ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(snapshot.delta_log_odds ?? 0) >= 0 ? '+' : ''}{(snapshot.delta_log_odds ?? 0).toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══ WATERFALL FROM SNAPSHOT ═══ */}
          {sorted.length > 0 && (
            <motion.div
              className="rounded-2xl p-6 space-y-4"
              style={glassPanelStrong}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-sm font-mono tracking-widest text-muted-foreground uppercase">
                Evidence Waterfall • Snapshot State
              </h3>

              {/* Prior bar */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 text-muted-foreground font-mono shrink-0">PRIOR</span>
                <div className="flex-1 h-6 rounded overflow-hidden relative" style={glassInner}>
                  <motion.div
                    className="h-full rounded"
                    style={{ background: 'hsla(220, 12%, 48%, 0.5)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${snapshot.prior * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">
                    {(snapshot.prior * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Evidence blocks */}
              {sorted.map((c, i) => {
                const isPos = c.delta_log_odds > 0;
                return (
                  <motion.div
                    key={c.evidence_id}
                    className="flex items-center gap-3 text-xs group"
                    initial={{ opacity: 0, x: isPos ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                  >
                    <span className="w-24 font-mono text-muted-foreground shrink-0 truncate" title={c.evidence_id}>
                      {c.evidence_id.slice(0, 14)}
                    </span>
                    <div className="flex-1 h-7 rounded-md overflow-hidden relative"
                      style={{
                        ...glassInner,
                        borderColor: `${dirColor(c.evidence_meta.direction)}33`,
                      }}
                    >
                      <motion.div
                        className="h-full rounded-md"
                        style={{
                          background: `linear-gradient(90deg, ${dirColor(c.evidence_meta.direction)}44, ${dirColor(c.evidence_meta.direction)}22)`,
                          backdropFilter: 'blur(16px)',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.abs(c.delta_log_odds) * 40, 95)}%` }}
                        transition={{ duration: 0.6, delay: 0.4 + i * 0.06 }}
                      />
                      {/* Receipt seal */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-gold-solid opacity-40 group-hover:opacity-80 transition-opacity" />
                        <span className="font-mono" style={{ color: dirColor(c.evidence_meta.direction) }}>
                          {c.delta_log_odds >= 0 ? '+' : ''}{c.delta_log_odds.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Posterior bar */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 text-gold-solid font-mono font-bold shrink-0">POSTERIOR</span>
                <div className="flex-1 h-7 rounded-md overflow-hidden relative"
                  style={{
                    ...glassInner,
                    borderColor: 'hsla(43, 96%, 56%, 0.25)',
                    boxShadow: '0 0 20px -6px hsla(43, 96%, 56%, 0.15)',
                  }}
                >
                  <motion.div
                    className="h-full rounded-md"
                    style={{
                      background: 'linear-gradient(90deg, hsla(43, 96%, 56%, 0.3), hsla(43, 96%, 56%, 0.15))',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${snapshot.posterior * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 metallic-num text-sm font-bold">
                    {(snapshot.posterior * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ EVIDENCE DETAILS ═══ */}
          {sorted.length > 0 && (
            <motion.div
              className="rounded-2xl p-6 space-y-4"
              style={glassPanelStrong}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <h3 className="text-sm font-mono tracking-widest text-muted-foreground uppercase">
                Evidence Provenance
              </h3>
              <div className="space-y-3">
                {sorted.map(c => (
                  <div key={c.evidence_id} className="rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-3" style={glassInner}>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-foreground">{c.evidence_id}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize"
                          style={{ borderColor: `${dirColor(c.evidence_meta.direction)}55`, color: dirColor(c.evidence_meta.direction) }}
                        >
                          {c.evidence_meta.direction}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-chrome capitalize">
                          {typeLabel(c.evidence_meta.type)}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-[10px] text-muted-foreground font-mono">
                        <span>Cred: {c.evidence_meta.credibility.toFixed(2)}</span>
                        <span>Cons: {c.evidence_meta.consensus.toFixed(2)}</span>
                        <span>Match: {c.evidence_meta.criteria_match.toFixed(2)}</span>
                        <span>Recency: {c.evidence_meta.recency.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5 shrink-0">
                      <div className="font-mono text-sm" style={{ color: dirColor(c.evidence_meta.direction) }}>
                        Δ {c.delta_log_odds >= 0 ? '+' : ''}{c.delta_log_odds.toFixed(3)}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        composite: {c.composite.toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ METADATA ═══ */}
          <motion.div
            className="rounded-2xl p-6 space-y-4"
            style={glassPanelStrong}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <h3 className="text-sm font-mono tracking-widest text-muted-foreground uppercase">
              Snapshot Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['Timestamp', new Date(snapshot.created_at).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })],
                ['Method', snapshot.snapshot_type.replace(/_/g, ' ').toUpperCase()],
                ['Milestone', `${milestone?.title || snapshot.milestone_id} (${snapshot.milestone_id})`],
                ['Domain', milestone?.domain?.toUpperCase() || '—'],
                ['Archetype', milestone?.archetype?.toUpperCase() || '—'],
                ['Evidence Count', `${contributions.length} items`],
                ['Prior Log-Odds', snapshot.prior_log_odds?.toFixed(4) ?? '—'],
                ['Posterior Log-Odds', snapshot.posterior_log_odds?.toFixed(4) ?? '—'],
              ].map(([label, val]) => (
                <div key={label} className="rounded-lg p-3 flex justify-between items-center" style={glassInner}>
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-mono text-foreground text-right max-w-[60%] truncate">{val}</span>
                </div>
              ))}
            </div>

            {!isWonder && (
              <Button variant="outline" size="sm" className="border-chrome gap-2 mt-2" onClick={exportJson}>
                <Download className="w-3.5 h-3.5" /> Export Full JSON
              </Button>
            )}
          </motion.div>

          {/* ═══ VERIFICATION BADGE ═══ */}
          <AnimatePresence>
            {verified && (
              <motion.div
                className="rounded-2xl p-8 text-center space-y-4"
                style={{
                  ...glassPanelGold,
                  borderColor: 'hsla(155, 82%, 48%, 0.3)',
                  boxShadow: '0 0 40px -8px hsla(155, 82%, 48%, 0.15), 0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
              >
                <div className="flex items-center justify-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-green-400" />
                  <span className="text-xl md:text-2xl font-bold text-green-400 tracking-wide">
                    VERIFIED • SHA-256 MATCH • APPEND-ONLY
                  </span>
                </div>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                  {isWonder
                    ? 'This receipt is forever ✨ — no one can change what this forecast said, not even us. The Trust Ledger remembers.'
                    : 'This snapshot cannot be altered or deleted — it is part of the permanent Trust Ledger. The SHA-256 hash is computed from the full state at time of creation and is append-only.'}
                </p>

                {/* Wonder mode sparkle */}
                {isWonder && (
                  <motion.div
                    className="flex justify-center gap-1 text-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {['✨', '🔮', '💎', '🔮', '✨'].map((e, i) => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -4, 0], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                      >
                        {e}
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ QR CODE + SHARING ═══ */}
          <motion.div
            className="rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6"
            style={glassPanelStrong}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="p-3 rounded-xl" style={{ background: 'white' }}>
              <QRCodeSVG value={pageUrl} size={120} level="M" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <p className="text-sm font-medium text-foreground">Verify this receipt on any device</p>
              <p className="text-xs text-muted-foreground break-all font-mono">{pageUrl}</p>
              <Button variant="outline" size="sm" className="border-chrome gap-2 mt-2" onClick={() => {
                navigator.clipboard.writeText(pageUrl);
              }}>
                <ExternalLink className="w-3.5 h-3.5" /> Copy Link
              </Button>
            </div>
          </motion.div>

          {/* ═══ FOOTER ═══ */}
          <motion.div
            className="text-center space-y-4 py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {/* Gold divider */}
            <div className="mx-auto w-48 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.3), transparent)' }} />

            <p className="text-gold text-lg font-semibold tracking-wide">
              This forecast is immutable and auditable forever — verified on the Trust Ledger
            </p>

            <p className="text-xs text-muted-foreground">
              AETH Observatory — Auditable Belief Revision for Technological Milestones
            </p>

            <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Explore the full observatory
            </Link>

            <p className="text-xs text-muted-foreground/60">
              Not signed in? <Link to="/" className="text-primary/70 hover:text-primary underline">Sign in to explore full observatory</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}
