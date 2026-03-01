import { Outlet } from 'react-router-dom';
import { NavItem } from '@/components/NavItem';
import { ModeToggle } from '@/components/ModeToggle';
import { Target, LineChart, BarChart3, Eye } from 'lucide-react';

export default function AppLayout() {
  return (
    <div className="min-h-screen nebula-bg stars-bg flex flex-col">
      {/* Top bar */}
      <header className="glass-strong border-b border-chrome/10 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.15), hsla(190, 100%, 50%, 0.1))',
                border: '1px solid hsla(43, 96%, 56%, 0.2)',
                boxShadow: '0 0 16px -4px hsla(43, 96%, 56%, 0.2)',
              }}
            >
              <Eye className="w-4 h-4 text-gold-solid" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight flex items-baseline">
              <span
                className="text-gold"
                style={{
                  filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.5)) drop-shadow(0 0 2px hsla(190, 100%, 50%, 0.3))',
                }}
              >ÆTH</span>
              <span className="text-chrome ml-1.5 font-normal text-sm">Observatory</span>
            </span>
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
