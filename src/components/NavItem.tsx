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
          'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200',
          isActive
            ? 'bg-gold/8 text-gold-solid border border-gold/15'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
        )
      }
    >
      {icon}
      {children}
    </RouterNavLink>
  );
}
