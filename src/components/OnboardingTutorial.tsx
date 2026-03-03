import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, FileText, ChevronRight, Check, Sparkles } from 'lucide-react';
import { glassPanelStrong, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMode } from '@/contexts/ModeContext';

const steps = [
  {
    icon: Target,
    title: 'Explore the Triage Queue',
    wonderTitle: '✦ Discover What Matters Most',
    description: 'Milestones are ranked by urgency, proximity, and magnitude. Click any card to see its full evidence waterfall.',
    wonderDescription: 'Every milestone represents a possible future — ranked by how much the world shifts when it arrives.',
    highlight: '[data-onboarding="triage-card"]',
    color: 'hsl(192, 95%, 50%)',
  },
  {
    icon: Zap,
    title: 'Try a Commit on Fusion',
    wonderTitle: '✦ Shape the Probability',
    description: 'Open "Commercial Fusion Power" → toggle evidence in the Why It Changed panel → click Commit to create an immutable trust snapshot.',
    wonderDescription: 'Toggle evidence to see how each discovery reshapes the probability of fusion energy — then commit your assessment to the permanent ledger.',
    highlight: '[data-onboarding="commit-btn"]',
    color: 'hsl(43, 96%, 56%)',
  },
  {
    icon: FileText,
    title: 'Export Your First LP Memo',
    wonderTitle: '✦ Create Your First Memo',
    description: 'Click "Export LP Memo" to generate a PDF with evidence breakdown, embedded waterfall chart, and SHA-256 verification hash.',
    wonderDescription: 'Craft a beautiful memo capturing the evidence, the probability, and the story — verified with a cryptographic seal.',
    highlight: '[data-onboarding="export-btn"]',
    color: 'hsl(155, 82%, 48%)',
  },
];

export function OnboardingTutorial() {
  const { profile, user } = useAuth();
  const { isWonder } = useMode();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (profile && !profile.onboarding_completed && profile.onboarding_step === 0) {
      // Small delay so the app renders first
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [profile]);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      setOpen(false);
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true, onboarding_step: 3 })
          .eq('user_id', user.id);
      }
    }
  };

  const handleSkip = async () => {
    setOpen(false);
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true, onboarding_step: 3 })
        .eq('user_id', user.id);
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-lg p-0 border-0 bg-transparent shadow-none"
        style={{ background: 'none' }}
      >
        <div className="rounded-2xl p-6 relative overflow-hidden" style={glassPanelStrong}>
          <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
          <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-2xl pointer-events-none" style={specularReflection} />

          <DialogTitle className="sr-only">Welcome to ÆTH Observatory</DialogTitle>
          <DialogDescription className="sr-only">A 3-step onboarding tutorial</DialogDescription>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full flex-1 transition-all duration-500"
                style={{
                  background: i <= currentStep
                    ? `linear-gradient(90deg, ${steps[i].color}, ${steps[Math.min(i, steps.length - 1)].color})`
                    : 'hsla(220, 12%, 70%, 0.12)',
                  boxShadow: i <= currentStep ? `0 0 8px ${steps[i].color}40` : 'none',
                }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: `linear-gradient(145deg, ${step.color}20, hsla(230, 22%, 8%, 0.9))`,
                  border: `1px solid ${step.color}40`,
                  boxShadow: `0 0 24px -4px ${step.color}30`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: step.color, filter: `drop-shadow(0 0 6px ${step.color}80)` }} />
              </div>

              {/* Content */}
              <h2 className="font-display font-bold text-lg text-foreground mb-2">
                {isWonder ? step.wonderTitle : step.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {isWonder ? step.wonderDescription : step.description}
              </p>

              {/* Step count */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                  STEP {currentStep + 1} OF {steps.length}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSkip}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
                  >
                    Skip tour
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-5 py-2 rounded-lg text-xs font-semibold btn-gold flex items-center gap-1.5"
                  >
                    {currentStep < steps.length - 1 ? (
                      <>
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        {isWonder ? <Sparkles className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        Start Exploring
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
