import { Outlet } from 'react-router-dom';
import { NavItem } from '@/components/NavItem';
import { BarChart3, Activity, Target, LineChart, Eye } from 'lucide-react';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background stars-bg flex flex-col">
      {/* Top bar */}
      <header className="glass-strong border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Eye className="w-4.5 h-4.5 text-primary" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              <span className="text-primary">AETH</span>
              <span className="text-muted-foreground ml-1.5 font-normal text-sm">Observatory</span>
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <NavItem to="/" icon={<Target className="w-4 h-4" />}>Triage</NavItem>
            <NavItem to="/traces" icon={<LineChart className="w-4 h-4" />}>Traces</NavItem>
            <NavItem to="/calibration" icon={<BarChart3 className="w-4 h-4" />}>Calibration</NavItem>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground px-2.5 py-1 rounded-md bg-muted/50 border border-border/50">
              ANALYST MODE
            </span>
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
