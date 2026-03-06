import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { glassInner } from '@/lib/glass-styles';
import { WhatIfResult } from '@/hooks/useMilestoneAPI';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const, WebkitTextFillColor: 'transparent' as const, backgroundClip: 'text' as const,
};

interface ScenarioHashBarProps {
  displayHash: string | null;
  isSimActive: boolean;
  isDropping: boolean | null | undefined;
  effectiveWhatIf: WhatIfResult | null;
  excludedCount: number;
}

export function ScenarioHashBar({ displayHash, isSimActive, isDropping, effectiveWhatIf, excludedCount }: ScenarioHashBarProps) {
  const [hashCopied, setHashCopied] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const copyHash = useCallback(() => {
    if (displayHash) {
      navigator.clipboard.writeText(displayHash);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    }
  }, [displayHash]);

  if (!displayHash || !isSimActive) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -6, height: 0 }} className="overflow-hidden relative z-10">
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg" style={{
          ...glassInner, border: '1px solid hsla(43, 96%, 56%, 0.2)',
          boxShadow: 'inset 0 1px 0 hsla(48, 100%, 80%, 0.08), 0 0 24px -6px hsla(43, 96%, 56%, 0.2)',
        }}>
          <div className="flex items-center gap-1.5">
            <Hash className="w-2.5 h-2.5" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.5))' }} />
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">SCENARIO HASH</span>
            <motion.span
              className="text-[9px] font-mono font-bold tabular-nums cursor-pointer"
              style={{ ...goldGradientStyle, filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.25))' }}
              onClick={copyHash}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Click to copy full hash"
            >
              {displayHash.slice(0, 16)}…
            </motion.span>
            <AnimatePresence>
              {hashCopied && (
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[8px] font-mono font-bold" style={{ color: 'hsl(155, 82%, 55%)' }}>
                  <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" />Copied
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={copyHash} className="p-1 rounded transition-all hover:scale-110" style={{ color: 'hsl(43, 82%, 60%)' }}>
                  <Copy className="w-2.5 h-2.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[9px] font-mono" style={glassInner}>
                Verified on blockchain ledger
              </TooltipContent>
            </Tooltip>
            <button onClick={() => setShowReceipt(!showReceipt)} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold transition-all hover:scale-105" style={{
              background: 'hsla(43, 96%, 56%, 0.08)', border: '1px solid hsla(43, 96%, 56%, 0.2)', color: 'hsl(43, 82%, 60%)',
            }}>
              <ExternalLink className="w-2.5 h-2.5" />{showReceipt ? 'HIDE' : 'VIEW RECEIPT'}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {showReceipt && effectiveWhatIf && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 rounded-lg p-3 space-y-1 overflow-hidden" style={{ ...glassInner, border: '1px solid hsla(43, 96%, 56%, 0.12)' }}>
              <div className="text-[9px] font-mono text-muted-foreground space-y-1">
                <div>SHA-256: <span className="font-bold tabular-nums break-all" style={goldGradientStyle}>{displayHash}</span></div>
                <div>Prior: <span className="font-bold tabular-nums" style={goldGradientStyle}>{(effectiveWhatIf.update_result.prior * 100).toFixed(2)}%</span></div>
                <div>Posterior: <span className="font-bold tabular-nums" style={isDropping ? { color: 'hsl(4, 82%, 63%)', textShadow: '0 0 8px hsla(4, 82%, 63%, 0.4)' } : goldGradientStyle}>{(effectiveWhatIf.update_result.posterior * 100).toFixed(2)}%</span></div>
                <div>Excluded: <span className="font-bold" style={goldGradientStyle}>{excludedCount} evidence items</span></div>
                <div>Δ Log-Odds: <span className="font-bold tabular-nums" style={isDropping ? { color: 'hsl(4, 82%, 63%)' } : goldGradientStyle}>{effectiveWhatIf.update_result.delta_log_odds.toFixed(4)}</span></div>
                <div className="text-[8px] italic text-muted-foreground pt-1" style={{ opacity: 0.6 }}>⚠ Sandbox only — not committed to Trust Ledger</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
