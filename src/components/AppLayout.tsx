import { Outlet } from 'react-router-dom';
import { NavItem } from '@/components/NavItem';
import { ModeToggle } from '@/components/ModeToggle';
import { Target, LineChart, BarChart3, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AppLayout() {
  return (
    <div className="min-h-screen nebula-bg stars-bg flex flex-col">
      {/* ═══════ PREMIUM HEADER ═══════ */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, hsla(230, 22%, 7%, 0.96) 0%, hsla(230, 22%, 5%, 0.92) 100%)',
          backdropFilter: 'blur(32px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
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
            background: 'linear-gradient(90deg, transparent 5%, hsla(43, 96%, 56%, 0.15) 20%, hsla(220, 10%, 85%, 0.1) 50%, hsla(43, 96%, 56%, 0.15) 80%, transparent 95%)',
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
            {/* Logo icon – layered gold/cyan glass */}
            <div
              className="relative w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, hsla(43, 96%, 56%, 0.12), hsla(230, 22%, 8%, 0.9), hsla(190, 100%, 50%, 0.06))',
                border: '1px solid hsla(43, 96%, 56%, 0.25)',
                boxShadow: [
                  '0 0 28px -4px hsla(43, 96%, 56%, 0.2)',
                  '0 0 10px -2px hsla(190, 100%, 50%, 0.12)',
                  'inset 0 1px 0 hsla(48, 100%, 80%, 0.12)',
                  'inset 0 -1px 0 hsla(230, 25%, 3%, 0.6)',
                ].join(', '),
              }}
            >
              {/* Inner glow ring */}
              <div
                className="absolute inset-0.5 rounded-[10px]"
                style={{
                  border: '1px solid hsla(43, 96%, 56%, 0.08)',
                  background: 'radial-gradient(circle at 30% 30%, hsla(43, 96%, 56%, 0.06), transparent 70%)',
                }}
              />
              <Eye
                className="w-[18px] h-[18px] relative z-10"
                style={{
                  color: 'hsl(43, 96%, 56%)',
                  filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.5)) drop-shadow(0 0 2px hsla(190, 100%, 50%, 0.3))',
                }}
              />
            </div>

            {/* Wordmark */}
            <div className="flex items-baseline">
              {/* ÆTH – premium metallic gold */}
              <span
                className="font-display font-bold text-[22px] tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, hsl(40, 85%, 36%) 0%, hsl(43, 96%, 50%) 20%, hsl(48, 100%, 74%) 45%, hsl(43, 96%, 58%) 65%, hsl(40, 90%, 40%) 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: [
                    'drop-shadow(0 0 10px hsla(43, 96%, 56%, 0.5))',
                    'drop-shadow(0 0 4px hsla(190, 100%, 50%, 0.3))',
                    'drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.9))',
                  ].join(' '),
                  letterSpacing: '0.06em',
                }}
              >
                ÆTH
              </span>

              {/* Separator dot */}
              <span
                className="mx-2 w-1 h-1 rounded-full inline-block relative top-[-1px]"
                style={{
                  background: 'hsl(43, 96%, 56%)',
                  boxShadow: '0 0 6px hsla(43, 96%, 56%, 0.5)',
                }}
              />

              {/* OBSERVATORY – polished chrome */}
              <span
                className="font-display font-medium text-[11px] tracking-[0.18em] uppercase"
                style={{
                  background: 'linear-gradient(135deg, hsl(220, 10%, 50%) 0%, hsl(220, 12%, 78%) 30%, hsl(220, 14%, 92%) 55%, hsl(220, 10%, 72%) 80%, hsl(220, 10%, 55%) 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 3px hsla(220, 10%, 72%, 0.15))',
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
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <ModeToggle />
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

      {/* Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
