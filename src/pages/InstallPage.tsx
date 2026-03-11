import { useState, useEffect } from 'react';
import { Eye, Download, Share, ArrowRight, CheckCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <div className="max-w-lg mx-auto px-6 pt-20 pb-16 text-center">
        {/* Logo */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
          className="flex items-center justify-center gap-2.5 mb-10"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(145deg, hsla(192,95%,50%,0.15), hsla(232,26%,8%,0.9))',
            border: '1px solid hsla(192,95%,50%,0.3)',
          }}>
            <Eye className="w-6 h-6" style={{ color: 'hsl(192,95%,50%)' }} />
          </div>
        </motion.div>

        {isInstalled ? (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <CheckCircle className="w-16 h-16 mx-auto mb-6" style={{ color: 'hsl(155, 82%, 48%)' }} />
            <h1 className="text-2xl font-display font-bold mb-3">Already Installed!</h1>
            <p className="text-muted-foreground text-sm">ÆTH Observatory is installed on your device. Open it from your home screen.</p>
          </motion.div>
        ) : (
          <>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
              <Smartphone className="w-12 h-12 mx-auto mb-6" style={{ color: 'hsl(192,95%,50%)' }} />
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-3">Install ÆTH Observatory</h1>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                Get the full app experience — offline access, instant loading, and a home screen icon.
              </p>
            </motion.div>

            {deferredPrompt ? (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
                <Button size="lg" onClick={handleInstall}
                  className="h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
                >
                  <Download className="w-4 h-4" /> Install App
                </Button>
              </motion.div>
            ) : isIOS ? (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="space-y-4"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-4">iOS Installation</p>
                {[
                  { step: 1, text: 'Tap the Share button', icon: Share },
                  { step: 2, text: 'Scroll down and tap "Add to Home Screen"', icon: ArrowRight },
                  { step: 3, text: 'Tap "Add" to confirm', icon: CheckCircle },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-card text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{
                      background: 'hsla(192,95%,50%,0.1)', border: '1px solid hsla(192,95%,50%,0.2)',
                    }}>
                      <span className="text-xs font-bold" style={{ color: 'hsl(192,95%,50%)' }}>{s.step}</span>
                    </div>
                    <span className="text-sm">{s.text}</span>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="rounded-xl border border-border/60 bg-card p-6"
              >
                <p className="text-sm text-muted-foreground">
                  Open this page in <strong>Chrome</strong> or <strong>Safari</strong> on your mobile device, then use the browser menu to "Add to Home Screen".
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
