import { motion } from 'framer-motion';

interface EvidenceToggleProps {
  enabled: boolean;
  onToggle: () => void;
  direction: 'supports' | 'contradicts' | 'ambiguous';
}

const GLOW_COLORS = {
  supports: {
    track: 'hsl(123, 38%, 50%)',
    glow: '0 0 12px -2px hsla(123, 50%, 55%, 0.6)',
    knob: 'linear-gradient(135deg, hsl(123, 42%, 62%), hsl(123, 50%, 72%))',
  },
  contradicts: {
    track: 'hsl(4, 72%, 52%)',
    glow: '0 0 12px -2px hsla(4, 82%, 55%, 0.6)',
    knob: 'linear-gradient(135deg, hsl(4, 72%, 60%), hsl(4, 82%, 70%))',
  },
  ambiguous: {
    track: 'hsl(220, 10%, 45%)',
    glow: '0 0 8px -2px hsla(220, 10%, 50%, 0.4)',
    knob: 'linear-gradient(135deg, hsl(220, 10%, 55%), hsl(220, 12%, 68%))',
  },
};

export function EvidenceToggle({ enabled, onToggle, direction }: EvidenceToggleProps) {
  const colors = GLOW_COLORS[direction] || GLOW_COLORS.ambiguous;
  const W = 28;
  const H = 16;
  const KNOB = 12;
  const TRAVEL = W - KNOB - 4; // 2px padding each side

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="relative shrink-0 rounded-full transition-all duration-300 cursor-pointer"
      style={{
        width: W,
        height: H,
        background: enabled
          ? `linear-gradient(135deg, ${colors.track}, ${colors.track}cc)`
          : 'hsla(220, 10%, 25%, 0.6)',
        border: `1px solid ${enabled ? `${colors.track}88` : 'hsla(220, 10%, 40%, 0.3)'}`,
        boxShadow: enabled ? colors.glow : 'inset 0 1px 2px hsla(0,0%,0%,0.3)',
      }}
      aria-label={enabled ? 'Exclude evidence' : 'Include evidence'}
    >
      <motion.div
        className="absolute top-[1px] rounded-full"
        style={{
          width: KNOB,
          height: KNOB,
          background: enabled ? colors.knob : 'linear-gradient(135deg, hsl(220, 10%, 45%), hsl(220, 10%, 55%))',
          boxShadow: enabled
            ? `0 1px 3px hsla(0,0%,0%,0.3), 0 0 6px -1px ${colors.track}66`
            : '0 1px 2px hsla(0,0%,0%,0.4)',
        }}
        animate={{ x: enabled ? TRAVEL + 2 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
