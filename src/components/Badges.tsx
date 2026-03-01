import { Domain, domainLabels, statusLabels } from '@/data/milestones';
import { domainBgClass, statusBgClass } from '@/lib/domain-styles';

export function DomainBadge({ domain }: { domain: Domain }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${domainBgClass[domain]}/15 border-current/20`}>
      <span className={`w-1.5 h-1.5 rounded-full ${domainBgClass[domain]}`} />
      {domainLabels[domain]}
    </span>
  );
}

export function StatusBadge({ status }: { status: keyof typeof statusLabels }) {
  return (
    <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBgClass[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
