import { motion } from 'framer-motion';

interface ProbabilityRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  domainColor?: string;
}

export function ProbabilityRing({
  value,
  size = 64,
  strokeWidth = 5,
  className = '',
  domainColor = 'hsl(var(--primary))',
}: ProbabilityRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * value;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={domainColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - filled }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute font-mono text-sm font-bold text-foreground">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
