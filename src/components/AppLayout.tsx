import { Outlet } from 'react-router-dom';
import { NavItem } from '@/components/NavItem';
import { ModeToggle } from '@/components/ModeToggle';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { Target, LineChart, BarChart3, Eye, LogOut, Shield } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AppLayout() {
  const mainRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const { signOut, isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  
  // Parallax transforms — background layers move slower than content
  const nebula1Y = useTransform(scrollY, [0, 1000], [0, -60]);
  const nebula2Y = useTransform(scrollY, [0, 1000], [0, -30]);
  const starsY = useTransform(scrollY, [0, 1000], [0, -15]);
  const constellation1Y = useTransform(scrollY, [0, 1000], [0, -45]);
  const constellation2Y = useTransform(scrollY, [0, 1000], [0, -20]);

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#06060c' }}>
      
      {/* ═══ PARALLAX NEBULA LAYERS ═══ */}
      {/* Layer 0: Static base nebula */}
      <div className="fixed inset-0 z-0 nebula-bg" />
      
      {/* Layer 1: Slow parallax starfield */}
      <motion.div 
        className="fixed inset-0 z-0 stars-bg"
        style={{ y: starsY }}
      />
      
      {/* Layer 2: Breathing nebula (via ::before and ::after on nebula-bg, handled by CSS) */}
      
      {/* Layer 3: Constellation particles — slow drift */}
      <motion.div 
        className="constellation-particles"
        style={{ y: constellation1Y }}
      />
      
      {/* Layer 4: Constellation particles layer 2 — faster, offset */}
      <motion.div 
        className="constellation-particles-2"
        style={{ y: constellation2Y }}
      />

      {/* ═══════ PREMIUM HEADER ═══════ */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, hsla(230, 22%, 7%, 0.97) 0%, hsla(230, 22%, 4%, 0.94) 100%)',
          backdropFilter: 'blur(40px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
          borderBottom: '1px solid hsla(220, 10%, 72%, 0.07)',
          boxShadow: [
            '0 1px 0 hsla(220, 10%, 85%, 0.04)',
            '0 4px 24px -4px hsla(230, 25%, 2%, 0.7)',
            '0 12px 48px -8px hsla(230, 25%, 2%, 0.5)',
            'inset 0 1px 0 hsla(220, 10%, 85%, 0.06)',
            'inset 0 -1px 0 hsla(230, 25%, 3%, 0.5)',
          ].join(', '),
        }}
      >
        {/* Top chrome highlight line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, hsla(43, 96%, 56%, 0.18) 20%, hsla(220, 10%, 85%, 0.12) 50%, hsla(43, 96%, 56%, 0.18) 80%, transparent 95%)',
          }}
        />

        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* ── Logo group ── */}
          <motion.div
            className="flex items-center gap-3.5"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Logo icon */}
            <div
              className="relative w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, hsla(43, 96%, 56%, 0.14), hsla(230, 22%, 8%, 0.9), hsla(190, 100%, 50%, 0.08))',
                border: '1px solid hsla(43, 96%, 56%, 0.3)',
                boxShadow: [
                  '0 0 32px -4px hsla(43, 96%, 56%, 0.25)',
                  '0 0 12px -2px hsla(190, 100%, 50%, 0.15)',
                  'inset 0 1px 0 hsla(48, 100%, 80%, 0.15)',
                  'inset 0 -1px 0 hsla(230, 25%, 3%, 0.6)',
                ].join(', '),
              }}
            >
              <div
                className="absolute inset-0.5 rounded-[10px]"
                style={{
                  border: '1px solid hsla(43, 96%, 56%, 0.1)',
                  background: 'radial-gradient(circle at 30% 30%, hsla(43, 96%, 56%, 0.08), transparent 70%)',
                }}
              />
              <div
                className="absolute inset-[-2px] rounded-[14px] pointer-events-none"
                style={{
                  boxShadow: 'inset 0 0 8px hsla(190, 100%, 50%, 0.12), 0 0 16px -4px hsla(190, 100%, 50%, 0.1)',
                }}
              />
              <Eye
                className="w-[18px] h-[18px] relative z-10"
                style={{
                  color: 'hsl(43, 96%, 56%)',
                  filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.6)) drop-shadow(0 0 3px hsla(190, 100%, 50%, 0.4))',
                }}
              />
            </div>

            {/* Wordmark */}
            <div className="flex items-baseline">
              <span
                className="font-display font-bold text-[24px] tracking-tight relative"
                style={{
                  background: 'linear-gradient(135deg, hsl(38, 88%, 32%) 0%, hsl(43, 96%, 48%) 15%, hsl(48, 100%, 72%) 35%, hsl(50, 100%, 88%) 50%, hsl(48, 100%, 72%) 65%, hsl(43, 96%, 55%) 80%, hsl(38, 88%, 36%) 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: [
                    'drop-shadow(0 0 14px hsla(43, 96%, 56%, 0.6))',
                    'drop-shadow(0 0 6px hsla(190, 100%, 50%, 0.35))',
                    'drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.9))',
                    'drop-shadow(0 2px 1px hsla(230, 25%, 3%, 0.8))',
                  ].join(' '),
                  letterSpacing: '0.07em',
                }}
              >
                ÆTH
              </span>

              <span
                className="mx-2 w-1.5 h-1.5 rounded-full inline-block relative top-[-1px]"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, hsl(48, 100%, 82%), hsl(43, 96%, 56%))',
                  boxShadow: '0 0 8px hsla(43, 96%, 56%, 0.6), 0 0 3px hsla(190, 100%, 50%, 0.3)',
                }}
              />

              <span
                className="font-display font-medium text-[11px] tracking-[0.18em] uppercase"
                style={{
                  background: 'linear-gradient(135deg, hsl(220, 10%, 48%) 0%, hsl(220, 12%, 76%) 25%, hsl(220, 16%, 94%) 50%, hsl(220, 14%, 88%) 60%, hsl(220, 10%, 70%) 80%, hsl(220, 10%, 52%) 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 4px hsla(220, 10%, 72%, 0.2))',
                }}
              >
                Observatory
              </span>
            </div>
          </motion.div>

          {/* ── Navigation ── */}
          <motion.nav
            className="flex items-center gap-0.5 p-1 rounded-xl"
            style={{
              background: 'hsla(230, 22%, 8%, 0.5)',
              border: '1px solid hsla(220, 10%, 72%, 0.08)',
              boxShadow: 'inset 0 1px 0 hsla(220, 10%, 85%, 0.03), inset 0 -1px 0 hsla(230, 25%, 3%, 0.3)',
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <NavItem to="/" icon={<Target className="w-4 h-4" />}>Triage</NavItem>
            <NavItem to="/traces" icon={<LineChart className="w-4 h-4" />}>Traces</NavItem>
            <NavItem to="/calibration" icon={<BarChart3 className="w-4 h-4" />}>Calibration</NavItem>
          </motion.nav>

          {/* ── Right controls ── */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {isAdmin && (
              <button
                onClick={() => navigate('/admin/analytics')}
                className="p-2 rounded-lg transition-colors hover:bg-accent"
                title="Admin Analytics"
              >
                <Shield className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <ModeToggle />
            {profile && (
              <span className="text-[9px] font-mono text-muted-foreground/60 tracking-wider uppercase px-2 py-1 rounded" style={{
                background: 'hsla(232, 26%, 8%, 0.5)',
                border: '1px solid hsla(43, 96%, 56%, 0.15)',
                color: 'hsl(43, 96%, 56%)',
              }}>
                {profile.tier}
              </span>
            )}
            <button
              onClick={signOut}
              className="p-2 rounded-lg transition-colors hover:bg-accent"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        </div>

        {/* Bottom chrome edge */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 10%, hsla(220, 10%, 72%, 0.06) 30%, hsla(220, 10%, 72%, 0.1) 50%, hsla(220, 10%, 72%, 0.06) 70%, transparent 90%)',
          }}
        />
      </header>

      {/* ═══ CONTENT — floats above nebula with z-index ═══ */}
      <main ref={mainRef} className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-6 relative z-10">
        <Outlet />
        <OnboardingTutorial />
      </main>

      {/* ═══════ BRANDED FOOTER ═══════ */}
      <footer
        className="relative mt-auto z-10"
        style={{
          borderTop: '1px solid hsla(220, 10%, 72%, 0.06)',
          background: 'linear-gradient(180deg, hsla(230, 22%, 4%, 0.6) 0%, hsla(230, 22%, 3%, 0.9) 100%)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{
          background: 'linear-gradient(90deg, transparent 10%, hsla(43, 96%, 56%, 0.08) 30%, hsla(220, 10%, 72%, 0.06) 50%, hsla(43, 96%, 56%, 0.08) 70%, transparent 90%)',
        }} />
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="font-display font-bold text-xs tracking-tight"
              style={{
                background: 'linear-gradient(135deg, hsl(40, 85%, 36%), hsl(43, 96%, 50%), hsl(48, 100%, 74%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ÆTH
            </span>
            <span className="text-[10px] text-muted-foreground font-mono tracking-wider">
              See Why the Future Changes
            </span>
          </div>
          <div className="font-mono text-[9px] text-muted-foreground/50 tabular-nums tracking-wider">
            v3.0 • Observatory
          </div>
        </div>
      </footer>
    </div>
  );
}
