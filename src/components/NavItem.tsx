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
          'flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        )
      }
    >
      {icon}
      {children}
    </RouterNavLink>
  );
}
