import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { glassPanelStrong, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { useMode } from '@/contexts/ModeContext';

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  requiredTier: string;
}

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

export function UpgradePrompt({ open, onClose, feature, requiredTier }: UpgradePromptProps) {
  const { isWonder } = useMode();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        style={{
          ...glassPanelStrong,
          border: '1px solid hsla(43, 96%, 56%, 0.25)',
          boxShadow: '0 0 80px -16px hsla(43, 96%, 56%, 0.2), 0 0 40px -8px hsla(232, 30%, 2%, 0.9)',
        }}
      >
        <DialogTitle className="sr-only">Upgrade Required for {feature}</DialogTitle>
        <DialogDescription className="sr-only">This feature requires {requiredTier} tier</DialogDescription>
        <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
        <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-lg pointer-events-none" style={specularReflection} />

        <div className="p-8 text-center space-y-5 relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2"
              style={{
                background: 'linear-gradient(135deg, hsla(43, 40%, 12%, 0.8), hsla(43, 96%, 56%, 0.15))',
                border: '2px solid hsla(43, 96%, 56%, 0.3)',
                boxShadow: '0 0 32px -6px hsla(43, 96%, 56%, 0.25)',
              }}
            >
              <Lock className="w-7 h-7" style={{ color: 'hsl(43, 96%, 56%)' }} />
            </div>
          </motion.div>

          <div>
            <h2 className="text-lg font-bold" style={goldGradientStyle}>
              {isWonder ? '✦ Unlock This Power' : 'Feature Requires Upgrade'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {isWonder
                ? `"${feature}" is reserved for ${requiredTier} members — the ones shaping the future's portfolio.`
                : `"${feature}" requires a ${requiredTier} subscription or higher.`}
            </p>
          </div>

          <div className="space-y-2">
            {['Pro', 'VC Alpha'].map(plan => (
              <div key={plan} className="rounded-lg px-4 py-3 flex items-center justify-between text-xs"
                style={{
                  background: 'hsla(232, 26%, 8%, 0.6)',
                  border: `1px solid ${plan === 'VC Alpha' ? 'hsla(43, 96%, 56%, 0.25)' : 'hsla(220, 12%, 70%, 0.1)'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: plan === 'VC Alpha' ? 'hsl(43, 96%, 56%)' : 'hsl(220, 12%, 60%)' }} />
                  <span className="font-semibold text-foreground">{plan}</span>
                </div>
                <span className="font-mono text-muted-foreground">
                  {plan === 'Pro' ? 'Export LP Memos' : 'Export + Send to LP'}
                </span>
              </div>
            ))}
          </div>

          <motion.button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold shine-sweep"
            style={{
              background: 'linear-gradient(135deg, hsl(38, 88%, 32%), hsl(43, 96%, 48%), hsl(48, 100%, 68%), hsl(50, 100%, 82%), hsl(48, 100%, 66%), hsl(43, 96%, 46%))',
              color: 'hsl(232, 30%, 2%)',
              boxShadow: '0 4px 24px -4px hsla(43, 96%, 56%, 0.5), inset 0 1px 0 hsla(48, 100%, 85%, 0.5)',
              textShadow: '0 1px 0 hsla(48, 100%, 80%, 0.3)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isWonder ? '✦ Upgrade Now' : 'View Plans'}
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          <p className="text-[10px] text-muted-foreground/50 font-mono">
            {isWonder ? 'Every great forecast deserves a great audience.' : 'Contact team@aeth.observatory for enterprise plans.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
