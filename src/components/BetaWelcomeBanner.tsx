import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { glassPanel, goldChromeLine } from '@/lib/glass-styles';

/**
 * Shows a welcome banner for new beta users on their first visit.
 * Dismisses permanently via localStorage.
 */
export function BetaWelcomeBanner() {
  const { profile } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const dismissed = localStorage.getItem('beta-banner-dismissed');
    if (dismissed) return;
    // Show for pro-tier users who haven't completed onboarding yet (new beta users)
    if (profile.tier === 'pro' && !profile.onboarding_completed) {
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, [profile]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('beta-banner-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5"
        >
          <div
            className="rounded-xl px-5 py-4 relative overflow-hidden"
            style={{
              ...glassPanel,
              border: '1px solid hsla(43, 96%, 56%, 0.25)',
              boxShadow: '0 0 48px -12px hsla(43, 96%, 56%, 0.15), 0 8px 32px -8px hsla(232, 30%, 2%, 0.7)',
            }}
          >
            {/* Gold top line */}
            <div className="absolute top-0 left-4 right-4 h-px" style={goldChromeLine} />

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(145deg, hsla(43, 96%, 56%, 0.15), hsla(230, 22%, 8%, 0.9))',
                    border: '1px solid hsla(43, 96%, 56%, 0.3)',
                    boxShadow: '0 0 20px -4px hsla(43, 96%, 56%, 0.3)',
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.5))' }} />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold" style={{
                    background: 'linear-gradient(135deg, hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(43, 96%, 56%))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    Welcome to the Private Beta
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Your <span className="font-semibold" style={{ color: 'hsl(43, 96%, 56%)' }}>Pro</span> tier is active — full access to LP Memo exports, evidence commits, and Trust Ledger verification.
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg transition-colors hover:bg-accent shrink-0"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
