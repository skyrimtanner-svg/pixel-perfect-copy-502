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
          'relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-250 uppercase shine-sweep overflow-hidden',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )
      }
      style={({ isActive }) =>
        isActive
          ? {
              background: 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.1), hsla(190, 100%, 50%, 0.05))',
              border: '1px solid hsla(43, 96%, 56%, 0.2)',
              boxShadow: [
                'inset 0 1px 0 hsla(48, 100%, 80%, 0.1)',
                'inset 0 -1px 0 hsla(232, 30%, 2%, 0.35)',
                '0 0 16px -4px hsla(43, 96%, 56%, 0.18)',
              ].join(', '),
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
