import { Domain, domainLabels, statusLabels, Archetype, archetypeConfig } from '@/data/milestones';
import { domainBgClass, statusBgClass } from '@/lib/domain-styles';
import { motion } from 'framer-motion';

export function DomainBadge({ domain }: { domain: Domain }) {
  return (
    <motion.span
      className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md"
      style={{
        border: '1px solid hsla(220, 10%, 72%, 0.12)',
        boxShadow: 'inset 0 1px 0 hsla(220, 10%, 90%, 0.05), inset 0 -1px 0 hsla(230, 25%, 3%, 0.3)',
        background: 'hsla(230, 22%, 8%, 0.7)',
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${domainBgClass[domain]}`}
        style={{ boxShadow: '0 0 6px currentColor' }}
      />
      {domainLabels[domain]}
    </motion.span>
  );
}

export function StatusBadge({ status }: { status: keyof typeof statusLabels }) {
  const isAccomplished = status === 'accomplished';
  return (
    <motion.span
      className={`inline-flex text-[9px] font-mono font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border ${statusBgClass[status]}`}
      style={{
        boxShadow: isAccomplished
          ? 'inset 0 1px 0 hsla(152, 80%, 70%, 0.08), 0 0 12px -4px hsla(152, 80%, 50%, 0.15)'
          : 'inset 0 1px 0 hsla(220, 10%, 85%, 0.04)',
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {statusLabels[status]}
    </motion.span>
  );
}

export function ArchetypeBadge({ archetype }: { archetype?: Archetype }) {
  if (!archetype) return null;
  const config = archetypeConfig[archetype];
  if (!config) return null;
  return (
    <motion.span
      className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${config.color}`}
      style={{
        background: 'hsla(230, 22%, 8%, 0.7)',
        border: '1px solid hsla(220, 10%, 72%, 0.1)',
        boxShadow: 'inset 0 1px 0 hsla(220, 10%, 90%, 0.04), inset 0 -1px 0 hsla(230, 25%, 3%, 0.3)',
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <span>{config.icon}</span>
      {config.label}
    </motion.span>
  );
}
