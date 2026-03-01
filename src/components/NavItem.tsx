import { NavLink as RouterNavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface NavItemProps {
  to: string;
  children: ReactNode;
  icon: ReactNode;
}

export function NavItem({ to, children, icon }: NavItemProps) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-250 uppercase',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )
      }
      style={({ isActive }) =>
        isActive
          ? {
              background: 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.08), hsla(190, 100%, 50%, 0.04))',
              border: '1px solid hsla(43, 96%, 56%, 0.15)',
              boxShadow: 'inset 0 1px 0 hsla(43, 96%, 56%, 0.08), 0 0 12px -4px hsla(43, 96%, 56%, 0.15)',
            }
          : {
              border: '1px solid transparent',
            }
      }
    >
      {icon}
      <span style={{ letterSpacing: '0.08em' }}>{children}</span>
    </RouterNavLink>
  );
}
