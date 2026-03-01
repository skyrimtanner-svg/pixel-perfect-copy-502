import { motion } from 'framer-motion';
import { useMode } from '@/contexts/ModeContext';

interface ProbabilityRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  domainColor?: string;
  useGold?: boolean;
}

export function ProbabilityRing({
  value,
  size = 64,
  strokeWidth = 5,
  className = '',
  domainColor = 'hsl(var(--primary))',
  useGold = false,
}: ProbabilityRingProps) {
  const { isWonder } = useMode();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * value;
  const gradientId = `ring-${Math.random().toString(36).slice(2, 8)}`;
  const showGold = useGold || isWonder || value > 0.7;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {showGold ? (
              <>
                <stop offset="0%" stopColor="hsl(43, 96%, 46%)" />
                <stop offset="50%" stopColor="hsl(48, 100%, 67%)" />
                <stop offset="100%" stopColor="hsl(43, 96%, 56%)" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={domainColor} />
                <stop offset="100%" stopColor={domainColor} />
              </>
            )}
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsla(228, 14%, 16%, 0.6)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - filled }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={showGold ? { filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.3))' } : undefined}
        />
      </svg>
      <span className={`absolute font-mono text-sm font-bold ${showGold ? 'text-gold' : 'text-foreground'}`}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
