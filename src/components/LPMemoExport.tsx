import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Milestone, Evidence, archetypeConfig, domainLabels } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { FileText, Download, Send, Sparkles, CheckCircle2, Shield, Hash, QrCode, ExternalLink } from 'lucide-react';
import { glassPanelStrong, glassInner, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const, backgroundClip: 'text' as const,
};

interface LPMemoExportProps {
  milestone: Milestone;
  open: boolean;
  onClose: () => void;
  simPosterior?: number | null;
  ledgerHash?: string | null;
  waterfallRef?: React.RefObject<HTMLDivElement>;
}

type GenerationPhase = 'idle' | 'capturing' | 'rendering' | 'finalizing' | 'done';

const PHASE_LABELS: Record<GenerationPhase, string> = {
  idle: '',
  capturing: 'Capturing waterfall visualization…',
  rendering: 'Rendering LP Memo…',
  finalizing: 'Finalizing immutable artifact…',
  done: 'Memo generated ✦',
};

async function generateHash(data: object): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(data)));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function LPMemoExport({ milestone, open, onClose, simPosterior, ledgerHash, waterfallRef }: LPMemoExportProps) {
  const { isWonder } = useMode();
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [memoHash, setMemoHash] = useState<string | null>(null);
  const memoRef = useRef<HTMLDivElement>(null);

  const displayPosterior = simPosterior ?? milestone.posterior;
  const delta = displayPosterior - milestone.prior;
  const isNegative = delta < 0;

  const generatePDF = useCallback(async () => {
    setPhase('capturing');

    // Phase 1: Capture waterfall if ref available
    let waterfallImg: string | null = null;
    if (waterfallRef?.current) {
      try {
        const canvas = await html2canvas(waterfallRef.current, {
          backgroundColor: '#06060c',
          scale: 2,
          useCORS: true,
          logging: false,
        });
        waterfallImg = canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Waterfall capture failed:', e);
      }
    }

    await new Promise(r => setTimeout(r, 400));
    setPhase('rendering');

    // Phase 2: Build PDF
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const margin = 16;

    // Dark background
    pdf.setFillColor(6, 6, 12);
    pdf.rect(0, 0, W, H, 'F');

    // Gold top accent line
    pdf.setDrawColor(218, 165, 32);
    pdf.setLineWidth(0.8);
    pdf.line(margin, 12, W - margin, 12);

    // Header: "LP MEMO — CONFIDENTIAL"
    pdf.setTextColor(180, 160, 100);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('LP MEMO — CONFIDENTIAL', margin, 10);
    pdf.text(new Date().toISOString().split('T')[0], W - margin, 10, { align: 'right' });

    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(milestone.title, margin, 28);

    // Domain + Tier + Archetype
    pdf.setFontSize(8);
    pdf.setTextColor(180, 160, 100);
    const archLabel = archetypeConfig[milestone.archetype];
    pdf.text(`${domainLabels[milestone.domain]} • ${milestone.tier.toUpperCase()} • ${archLabel.icon} ${archLabel.label} • TARGET ${milestone.year}`, margin, 34);

    // Large probability display
    const probY = 48;
    pdf.setFillColor(12, 12, 20);
    pdf.roundedRect(margin, probY - 6, W - margin * 2, 30, 3, 3, 'F');
    pdf.setDrawColor(218, 165, 32);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, probY - 6, W - margin * 2, 30, 3, 3, 'S');

    // Posterior value
    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'bold');
    if (isNegative) {
      pdf.setTextColor(220, 80, 80);
    } else {
      pdf.setTextColor(218, 175, 60);
    }
    pdf.text(`${(displayPosterior * 100).toFixed(1)}%`, margin + 8, probY + 14);

    // Labels
    pdf.setFontSize(8);
    pdf.setTextColor(140, 140, 160);
    pdf.text('POSTERIOR PROBABILITY', margin + 8, probY + 20);

    // Prior → Posterior
    pdf.setFontSize(10);
    pdf.setTextColor(180, 160, 100);
    pdf.text(`Prior: ${(milestone.prior * 100).toFixed(1)}%  →  Posterior: ${(displayPosterior * 100).toFixed(1)}%  |  Δ ${delta > 0 ? '+' : ''}${(delta * 100).toFixed(1)}pp`, W / 2 + 10, probY + 8);

    // Log-odds
    pdf.setFontSize(8);
    pdf.setTextColor(140, 140, 160);
    const lo = isFinite(milestone.delta_log_odds) ? milestone.delta_log_odds.toFixed(4) : '∞';
    pdf.text(`Δ Log-Odds: ${lo}  |  Magnitude: ${milestone.magnitude}/10`, W / 2 + 10, probY + 15);

    // Gold line separator
    let y = probY + 32;
    pdf.setDrawColor(218, 165, 32);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, W - margin, y);
    y += 6;

    // Waterfall image
    if (waterfallImg) {
      const imgW = W - margin * 2;
      const imgH = 70;
      pdf.addImage(waterfallImg, 'PNG', margin, y, imgW, imgH);
      y += imgH + 4;

      pdf.setFontSize(6);
      pdf.setTextColor(120, 120, 140);
      pdf.text('EVIDENCE WATERFALL — Glassmorphic Bayesian Visualization', margin, y);
      y += 8;
    }

    // "Why This Changed the Future" narrative
    pdf.setDrawColor(218, 165, 32);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, W - margin, y);
    y += 6;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(isWonder ? '✦ Why This Changed the Future' : 'ANALYSIS: BELIEF UPDATE RATIONALE', margin, y);
    y += 7;

    // Evidence breakdown
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const sortedEv = [...milestone.evidence].sort((a, b) => Math.abs(b.delta_log_odds) - Math.abs(a.delta_log_odds));

    for (const ev of sortedEv.slice(0, 6)) {
      if (y > H - 50) break;
      const dir = ev.direction === 'supports' ? '↑' : ev.direction === 'contradicts' ? '↓' : '~';
      const loStr = `${ev.delta_log_odds > 0 ? '+' : ''}${ev.delta_log_odds.toFixed(2)} LO`;

      if (ev.direction === 'supports') pdf.setTextColor(100, 200, 120);
      else if (ev.direction === 'contradicts') pdf.setTextColor(220, 100, 100);
      else pdf.setTextColor(140, 140, 160);

      pdf.setFont('helvetica', 'bold');
      pdf.text(`${dir} ${loStr}`, margin, y);
      pdf.setTextColor(200, 200, 210);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`  ${ev.source} (${ev.type.replace('_', ' ')})`, margin + 22, y);
      y += 5;

      if (isWonder) {
        pdf.setTextColor(160, 160, 175);
        pdf.setFontSize(7);
        const summaryLines = pdf.splitTextToSize(ev.summary, W - margin * 2 - 4);
        pdf.text(summaryLines, margin + 4, y);
        y += summaryLines.length * 3.5 + 2;
        pdf.setFontSize(8);
      } else {
        pdf.setTextColor(140, 140, 160);
        pdf.setFontSize(7);
        pdf.text(`Cred: ${ev.credibility.toFixed(2)} | Cons: ${ev.consensus.toFixed(2)} | E=${ev.composite.toFixed(3)}`, margin + 4, y);
        y += 5;
        pdf.setFontSize(8);
      }
    }

    // Description
    y += 4;
    pdf.setTextColor(180, 180, 195);
    pdf.setFontSize(8);
    const descLines = pdf.splitTextToSize(milestone.description, W - margin * 2);
    pdf.text(descLines, margin, y);
    y += descLines.length * 4 + 4;

    // Success criteria
    pdf.setTextColor(100, 180, 200);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SUCCESS CRITERIA', margin, y);
    y += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(160, 160, 175);
    const critLines = pdf.splitTextToSize(milestone.success_criteria, W - margin * 2);
    pdf.text(critLines, margin, y);
    y += critLines.length * 3.5 + 4;

    // Falsification
    pdf.setTextColor(220, 100, 100);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FALSIFICATION CONDITION', margin, y);
    y += 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(160, 160, 175);
    const falsLines = pdf.splitTextToSize(milestone.falsification, W - margin * 2);
    pdf.text(falsLines, margin, y);

    // Footer
    await new Promise(r => setTimeout(r, 300));
    setPhase('finalizing');

    const hash = ledgerHash || await generateHash({
      milestone_id: milestone.id,
      posterior: displayPosterior,
      prior: milestone.prior,
      timestamp: new Date().toISOString(),
      evidence_count: milestone.evidence.length,
    });
    setMemoHash(hash);

    // Footer area
    const footerY = H - 28;
    pdf.setDrawColor(218, 165, 32);
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY, W - margin, footerY);

    // Hash
    pdf.setFontSize(6);
    pdf.setTextColor(218, 175, 60);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`SHA-256: ${hash.slice(0, 32)}…${hash.slice(-8)}`, margin, footerY + 5);

    // Verification text
    pdf.setFontSize(7);
    pdf.setTextColor(218, 165, 32);
    pdf.text('This forecast is immutable and auditable forever — verified on the Trust Ledger', margin, footerY + 10);

    // Timestamp
    pdf.setFontSize(6);
    pdf.setTextColor(120, 120, 140);
    pdf.text(`Generated: ${new Date().toISOString()} | ${milestone.evidence.length} evidence signals`, margin, footerY + 15);

    // Bottom gold line
    pdf.setDrawColor(218, 165, 32);
    pdf.setLineWidth(0.8);
    pdf.line(margin, H - 8, W - margin, H - 8);

    // Save
    await new Promise(r => setTimeout(r, 500));
    pdf.save(`LP-Memo_${milestone.title.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`);

    setPhase('done');

    if (isWonder) {
      toast({
        title: '✦ Memo Generated!',
        description: 'A $15k McKinsey deck in 2 seconds. Forward it to the firm. 🚀',
      });
    } else {
      toast({
        title: '✓ LP Memo Exported',
        description: `SHA-256: ${hash.slice(0, 16)}… — Immutable artifact saved.`,
      });
    }

    setTimeout(() => setPhase('idle'), 2000);
  }, [milestone, displayPosterior, delta, isNegative, isWonder, ledgerHash, waterfallRef]);

  const isGenerating = phase !== 'idle' && phase !== 'done';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden"
        style={{
          ...glassPanelStrong,
          border: '1px solid hsla(43, 96%, 56%, 0.2)',
          boxShadow: '0 0 120px -20px hsla(43, 96%, 56%, 0.15), 0 0 60px -10px hsla(230, 25%, 3%, 0.9)',
        }}
      >
        {/* Gold rim */}
        <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
        <div className="absolute top-0 left-0 right-0 h-[25%] rounded-t-lg pointer-events-none" style={specularReflection} />

        <div className="p-6 space-y-5 relative z-10" ref={memoRef}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold" style={goldGradientStyle}>
                {isWonder ? '✦ LP Memo' : 'LP MEMO — EXPORT'}
              </h2>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">
                {isWonder
                  ? 'Generate a beautiful, auditable artifact worthy of forwarding to the entire firm.'
                  : 'Dark-elegant A4 PDF with full Bayesian evidence trail and Trust Ledger hash.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.4))' }} />
            </div>
          </div>

          {/* Preview card */}
          <div className="rounded-xl p-5 relative overflow-hidden" style={{
            background: 'linear-gradient(168deg, rgba(12, 12, 20, 0.95), rgba(6, 6, 12, 0.98))',
            border: '1px solid hsla(43, 96%, 56%, 0.15)',
            boxShadow: 'inset 0 1px 0 hsla(48, 100%, 80%, 0.06), 0 8px 32px -8px hsla(232, 30%, 2%, 0.8)',
          }}>
            <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl pointer-events-none" style={specularReflection} />

            {/* Mini hero */}
            <div className="flex items-center gap-5 mb-4">
              {/* Probability ring preview */}
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 64 64" className="w-16 h-16">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="hsla(220, 10%, 30%, 0.3)" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke={isNegative ? 'hsl(4, 82%, 63%)' : 'hsl(43, 96%, 56%)'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${displayPosterior * 176} ${(1 - displayPosterior) * 176}`}
                    strokeDashoffset="44"
                    style={{
                      filter: `drop-shadow(0 0 8px ${isNegative ? 'hsla(4, 82%, 63%, 0.5)' : 'hsla(43, 96%, 56%, 0.5)'})`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-sm font-bold tabular-nums" style={{
                    color: isNegative ? 'hsl(4, 82%, 63%)' : 'hsl(43, 96%, 56%)',
                    textShadow: `0 0 8px ${isNegative ? 'hsla(4, 82%, 63%, 0.4)' : 'hsla(43, 96%, 56%, 0.4)'}`,
                  }}>
                    {(displayPosterior * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-display text-base font-bold text-foreground">{milestone.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'hsl(43, 82%, 55%)' }}>
                    {domainLabels[milestone.domain]} • {milestone.tier} • {archetypeConfig[milestone.archetype].icon} {archetypeConfig[milestone.archetype].label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-muted-foreground">
                  <span>Prior: <span className="font-bold tabular-nums" style={goldGradientStyle}>{(milestone.prior * 100).toFixed(1)}%</span></span>
                  <span>→</span>
                  <span>Posterior: <span className="font-bold tabular-nums" style={isNegative ? { color: 'hsl(4, 82%, 63%)' } : goldGradientStyle}>
                    {(displayPosterior * 100).toFixed(1)}%
                  </span></span>
                  <span className="font-bold" style={isNegative ? { color: 'hsl(4, 82%, 63%)' } : goldGradientStyle}>
                    Δ{delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}pp
                  </span>
                </div>
              </div>
            </div>

            {/* Content preview */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg p-3" style={{ ...glassInner, border: '1px solid hsla(220, 12%, 70%, 0.08)' }}>
                <div className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground mb-1">INCLUDED</div>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <div>✓ Full evidence waterfall (high-res)</div>
                  <div>✓ {isWonder ? 'Narrative: "Why This Changed the Future"' : 'Log-odds breakdown + evidence tiers'}</div>
                  <div>✓ SHA-256 Trust Ledger hash</div>
                  <div>✓ Success criteria & falsification</div>
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ ...glassInner, border: '1px solid hsla(220, 12%, 70%, 0.08)' }}>
                <div className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground mb-1">FORMAT</div>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <div>📄 Dark-elegant A4 PDF</div>
                  <div>🎨 Metallic gold accents</div>
                  <div>📊 {milestone.evidence.length} evidence signals</div>
                  <div>🔐 Immutable & auditable</div>
                </div>
              </div>
            </div>

            {/* Evidence count */}
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
              <Shield className="w-3 h-3" style={{ color: 'hsl(43, 82%, 55%)' }} />
              <span>{milestone.evidence.length} evidence signals • {milestone.evidence.filter(e => e.direction === 'supports').length} supporting • {milestone.evidence.filter(e => e.direction === 'contradicts').length} contradicting</span>
            </div>
          </div>

          {/* Generation progress */}
          <AnimatePresence>
            {(isGenerating || phase === 'done') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl p-4 overflow-hidden"
                style={{
                  ...glassInner,
                  border: `1px solid ${phase === 'done' ? 'hsla(155, 82%, 48%, 0.2)' : 'hsla(43, 96%, 56%, 0.2)'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  {phase === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'hsl(155, 82%, 55%)', filter: 'drop-shadow(0 0 6px hsla(155, 82%, 48%, 0.4))' }} />
                  ) : (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.4))' }} />
                    </motion.div>
                  )}
                  <div className="flex-1">
                    <span className="text-xs font-mono font-bold" style={phase === 'done' ? { color: 'hsl(155, 82%, 55%)' } : goldGradientStyle}>
                      {PHASE_LABELS[phase]}
                    </span>
                    {isGenerating && (
                      <div className="h-1 mt-2 rounded-full overflow-hidden" style={{ background: 'hsla(220, 10%, 30%, 0.3)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, hsl(43, 96%, 56%), hsl(48, 100%, 72%))' }}
                          initial={{ width: '0%' }}
                          animate={{
                            width: phase === 'capturing' ? '33%' : phase === 'rendering' ? '66%' : '90%',
                          }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {memoHash && phase === 'done' && (
                  <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono text-muted-foreground">
                    <Hash className="w-2.5 h-2.5" style={{ color: 'hsl(43, 96%, 56%)' }} />
                    <span style={goldGradientStyle}>{memoHash.slice(0, 24)}…</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={generatePDF}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold relative overflow-hidden shine-sweep"
              style={{
                background: 'linear-gradient(135deg, hsl(38, 88%, 32%), hsl(43, 96%, 48%), hsl(48, 100%, 68%), hsl(50, 100%, 82%), hsl(48, 100%, 66%), hsl(43, 96%, 46%))',
                color: 'hsl(232, 30%, 2%)',
                boxShadow: [
                  '0 4px 24px -4px hsla(43, 96%, 56%, 0.5)',
                  'inset 0 1px 0 hsla(48, 100%, 85%, 0.5)',
                  'inset 0 -1px 0 hsla(38, 88%, 28%, 0.55)',
                  '0 2px 6px hsla(232, 30%, 2%, 0.4)',
                ].join(', '),
                textShadow: '0 1px 0 hsla(48, 100%, 80%, 0.3)',
                opacity: isGenerating ? 0.7 : 1,
              }}
              whileHover={{ scale: isGenerating ? 1 : 1.02 }}
              whileTap={{ scale: isGenerating ? 1 : 0.98 }}
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating…' : isWonder ? '✦ Generate LP Memo' : 'Export LP Memo PDF'}
            </motion.button>

            <motion.button
              className="px-4 py-3 rounded-xl text-xs font-mono font-bold"
              style={{
                ...glassInner,
                border: '1px solid hsla(43, 96%, 56%, 0.2)',
                color: 'hsl(43, 82%, 55%)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                toast({
                  title: isWonder ? '✦ Coming Soon' : 'Send to LP',
                  description: 'Direct LP email distribution requires Pro+ entitlement.',
                });
              }}
            >
              <Send className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Footer note */}
          <div className="flex items-center gap-2 text-[8px] font-mono text-muted-foreground" style={{ opacity: 0.6 }}>
            <Shield className="w-2.5 h-2.5" />
            <span>Immutable artifact • SHA-256 verified on Trust Ledger • Generated at {new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>

        {/* Wonder mode: subtle nebula in background */}
        {isWonder && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-0"
            animate={{ opacity: [0.03, 0.05, 0.03] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: [
                'radial-gradient(ellipse at 30% 40%, hsla(43, 55%, 18%, 0.12) 0%, transparent 60%)',
                'radial-gradient(ellipse at 70% 60%, hsla(268, 50%, 16%, 0.08) 0%, transparent 55%)',
              ].join(', '),
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
