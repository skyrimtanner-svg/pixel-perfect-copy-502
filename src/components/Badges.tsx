import { Domain, domainLabels, statusLabels, Archetype, archetypeConfig } from '@/data/milestones';
import { domainBgClass } from '@/lib/domain-styles';
import { motion } from 'framer-motion';

const archetypeGradients: Record<string, { bg: string; border: string; glow: string; specular: string }> = {
  breakthrough: {
    bg: 'linear-gradient(145deg, hsla(155, 70%, 28%, 0.35), hsla(155, 82%, 42%, 0.15))',
    border: 'hsla(155, 82%, 48%, 0.3)',
    glow: '0 0 16px -4px hsla(155, 82%, 48%, 0.3)',
    specular: 'hsla(155, 82%, 70%, 0.15)',
  },
  bottleneck: {
    bg: 'linear-gradient(145deg, hsla(0, 60%, 30%, 0.3), hsla(0, 72%, 48%, 0.12))',
    border: 'hsla(0, 72%, 55%, 0.28)',
    glow: '0 0 16px -4px hsla(0, 72%, 55%, 0.25)',
    specular: 'hsla(0, 72%, 70%, 0.12)',
  },
  convergence: {
    bg: 'linear-gradient(145deg, hsla(268, 70%, 40%, 0.3), hsla(268, 90%, 60%, 0.12))',
    border: 'hsla(268, 90%, 68%, 0.28)',
    glow: '0 0 16px -4px hsla(268, 90%, 68%, 0.25)',
    specular: 'hsla(268, 90%, 80%, 0.12)',
  },
};

const chromeGradientText = {
  background: 'linear-gradient(135deg, hsl(220, 10%, 55%), hsl(220, 14%, 82%), hsl(220, 16%, 94%), hsl(220, 14%, 85%), hsl(220, 10%, 60%))',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

export function DomainBadge({ domain }: { domain: Domain }) {
  return (
    <motion.span
      className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md relative overflow-hidden shine-sweep"
      style={{
        border: '1px solid hsla(220, 10%, 72%, 0.18)',
        boxShadow: [
          'inset 0 1px 0 hsla(220, 16%, 95%, 0.1)',
          'inset 0 -1px 0 hsla(230, 25%, 3%, 0.45)',
          '0 1px 4px hsla(230, 25%, 3%, 0.35)',
        ].join(', '),
        background: 'linear-gradient(168deg, hsla(230, 22%, 11%, 0.85), hsla(230, 22%, 7%, 0.75))',
        backdropFilter: 'blur(16px)',
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${domainBgClass[domain]}`}
        style={{ boxShadow: '0 0 8px currentColor, 0 0 3px currentColor' }}
      />
      <span style={chromeGradientText}>
        {domainLabels[domain]}
      </span>
    </motion.span>
  );
}

export function StatusBadge({ status }: { status: keyof typeof statusLabels }) {
  const isAccomplished = status === 'accomplished';
  const isEmerging = status === 'evidence_emerging';
  return (
    <motion.span
      className="inline-flex text-[9px] font-mono font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md relative overflow-hidden shine-sweep"
      style={{
        background: isAccomplished
          ? 'linear-gradient(145deg, hsla(155, 70%, 20%, 0.4), hsla(155, 82%, 35%, 0.15))'
          : isEmerging
          ? 'linear-gradient(145deg, hsla(43, 80%, 20%, 0.35), hsla(43, 96%, 45%, 0.12))'
          : 'linear-gradient(168deg, hsla(230, 22%, 10%, 0.8), hsla(230, 22%, 7%, 0.7))',
        border: `1px solid ${isAccomplished ? 'hsla(155, 82%, 48%, 0.3)' : isEmerging ? 'hsla(43, 96%, 56%, 0.25)' : 'hsla(220, 12%, 70%, 0.15)'}`,
        color: isAccomplished ? 'hsl(155, 82%, 55%)' : isEmerging ? 'hsl(43, 96%, 56%)' : 'hsl(192, 100%, 52%)',
        boxShadow: isAccomplished
          ? 'inset 0 1px 0 hsla(155, 82%, 70%, 0.15), 0 0 16px -4px hsla(155, 82%, 50%, 0.25), inset 0 -1px 0 hsla(230, 25%, 3%, 0.35)'
          : isEmerging
          ? 'inset 0 1px 0 hsla(43, 96%, 70%, 0.12), 0 0 14px -4px hsla(43, 96%, 56%, 0.2), inset 0 -1px 0 hsla(230, 25%, 3%, 0.35)'
          : 'inset 0 1px 0 hsla(220, 10%, 85%, 0.06), inset 0 -1px 0 hsla(230, 25%, 3%, 0.35)',
        backdropFilter: 'blur(14px)',
        textShadow: isAccomplished ? '0 0 10px hsla(155, 82%, 48%, 0.35)' : isEmerging ? '0 0 8px hsla(43, 96%, 56%, 0.3)' : 'none',
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
  const gradient = archetypeGradients[archetype] || {
    bg: 'linear-gradient(168deg, hsla(230, 22%, 10%, 0.8), hsla(230, 22%, 7%, 0.7))',
    border: 'hsla(220, 10%, 72%, 0.15)',
    glow: 'none',
    specular: 'hsla(220, 16%, 95%, 0.06)',
  };

  return (
    <motion.span
      className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md relative overflow-hidden shine-sweep"
      style={{
        background: gradient.bg,
        border: `1px solid ${gradient.border}`,
        boxShadow: [
          `inset 0 1px 0 ${gradient.specular}`,
          'inset 0 -1px 0 hsla(230, 25%, 3%, 0.45)',
          gradient.glow,
        ].join(', '),
        backdropFilter: 'blur(14px)',
        color: archetype === 'breakthrough' ? 'hsl(155, 82%, 58%)' : archetype === 'bottleneck' ? 'hsl(0, 72%, 62%)' : 'hsl(268, 90%, 72%)',
        textShadow: `0 0 10px ${gradient.border}`,
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* Mini specular highlight */}
      <span className="absolute top-0 left-0 right-0 h-[50%] rounded-t-md pointer-events-none" style={{
        background: `linear-gradient(180deg, ${gradient.specular}, transparent)`,
      }} />
      <span className="relative z-10" style={{ filter: `drop-shadow(0 0 5px ${gradient.border})` }}>{config.icon}</span>
      <span className="relative z-10">{config.label}</span>
    </motion.span>
  );
}
