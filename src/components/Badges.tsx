import { Domain, domainLabels, statusLabels, Archetype, archetypeConfig } from '@/data/milestones';
import { domainBgClass, statusBgClass } from '@/lib/domain-styles';

export function DomainBadge({ domain }: { domain: Domain }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full`}
      style={{
        border: '1px solid hsla(43, 96%, 56%, 0.15)',
        boxShadow: 'inset 0 1px 0 hsla(220, 10%, 85%, 0.04)',
      }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${domainBgClass[domain]}`}
        style={{ boxShadow: `0 0 6px currentColor` }}
      />
      {domainLabels[domain]}
    </span>
  );
}

export function StatusBadge({ status }: { status: keyof typeof statusLabels }) {
  return (
    <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusBgClass[status]}`}
      style={{ boxShadow: 'inset 0 1px 0 hsla(220, 10%, 85%, 0.04)' }}
    >
      {statusLabels[status]}
    </span>
  );
}

export function ArchetypeBadge({ archetype }: { archetype: Archetype }) {
  const config = archetypeConfig[archetype];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.color}`}
      style={{
        background: 'hsla(230, 22%, 10%, 0.6)',
        border: '1px solid hsla(220, 10%, 72%, 0.1)',
      }}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
