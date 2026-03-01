import { Outlet } from 'react-router-dom';
import { NavItem } from '@/components/NavItem';
import { ModeToggle } from '@/components/ModeToggle';
import { Target, LineChart, BarChart3, Eye } from 'lucide-react';

export default function AppLayout() {
  return (
    <div className="min-h-screen nebula-bg stars-bg flex flex-col">
      {/* Top bar */}
      <header className="glass-strong sticky top-0 z-50"
        style={{
          borderBottom: '1px solid hsla(220, 10%, 72%, 0.08)',
          boxShadow: '0 4px 30px -8px hsla(230, 25%, 3%, 0.6)',
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo icon – gold/cyan glass capsule */}
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, hsla(43, 96%, 56%, 0.15), hsla(230, 22%, 10%, 0.8), hsla(190, 100%, 50%, 0.08))',
                border: '1px solid hsla(43, 96%, 56%, 0.3)',
                boxShadow:
                  '0 0 24px -4px hsla(43, 96%, 56%, 0.25), 0 0 8px -2px hsla(190, 100%, 50%, 0.15), inset 0 1px 0 hsla(48, 100%, 80%, 0.15), inset 0 -1px 0 hsla(230, 25%, 3%, 0.5)',
              }}
            >
              <Eye className="w-4.5 h-4.5" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.4))' }} />
            </div>

            {/* Brand wordmark */}
            <div className="flex items-baseline gap-0">
              {/* ÆTH – metallic gold with specular highlight & cyan neon edge */}
              <span
                className="font-display font-bold text-xl tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, hsl(40, 85%, 38%) 0%, hsl(43, 96%, 52%) 25%, hsl(48, 100%, 72%) 50%, hsl(43, 96%, 56%) 75%, hsl(40, 90%, 42%) 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.6)) drop-shadow(0 0 3px hsla(190, 100%, 50%, 0.35)) drop-shadow(0 1px 0 hsla(40, 90%, 30%, 0.8))',
                  letterSpacing: '0.04em',
                }}
              >
                ÆTH
              </span>

              {/* Observatory – polished chrome */}
              <span
                className="font-display font-normal text-sm ml-2 tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, hsl(220, 10%, 55%) 0%, hsl(220, 12%, 82%) 40%, hsl(220, 14%, 92%) 60%, hsl(220, 10%, 68%) 100%)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 4px hsla(220, 10%, 72%, 0.2))',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Observatory
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <NavItem to="/" icon={<Target className="w-4 h-4" />}>Triage</NavItem>
            <NavItem to="/traces" icon={<LineChart className="w-4 h-4" />}>Traces</NavItem>
            <NavItem to="/calibration" icon={<BarChart3 className="w-4 h-4" />}>Calibration</NavItem>
          </nav>

          <div className="flex items-center gap-3">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
