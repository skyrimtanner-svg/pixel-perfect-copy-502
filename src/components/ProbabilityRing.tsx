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
  const glowId = `glow-${Math.random().toString(36).slice(2, 8)}`;
  const specularId = `specular-${Math.random().toString(36).slice(2, 8)}`;
  const showGold = useGold || isWonder || value > 0.7;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {showGold ? (
              <>
                <stop offset="0%" stopColor="hsl(40, 90%, 32%)" />
                <stop offset="20%" stopColor="hsl(43, 96%, 50%)" />
                <stop offset="45%" stopColor="hsl(48, 100%, 75%)" />
                <stop offset="55%" stopColor="hsl(45, 100%, 85%)" />
                <stop offset="70%" stopColor="hsl(43, 96%, 56%)" />
                <stop offset="100%" stopColor="hsl(40, 90%, 38%)" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={domainColor} />
                <stop offset="100%" stopColor={domainColor} />
              </>
            )}
          </linearGradient>
          {/* Specular highlight overlay */}
          <linearGradient id={specularId} x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsla(48, 100%, 90%, 0.5)" />
            <stop offset="40%" stopColor="hsla(48, 100%, 90%, 0)" />
            <stop offset="100%" stopColor="hsla(48, 100%, 90%, 0)" />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation={showGold ? '3' : '2'} result="blur" />
            <feComposite in="blur" in2="SourceGraphic" operator="over" result="glow" />
            {/* Add specular highlight */}
            <feSpecularLighting surfaceScale="3" specularConstant="1.2" specularExponent="20" lightingColor="hsl(48, 100%, 85%)" result="specular">
              <fePointLight x={size * 0.3} y={size * 0.2} z={size * 0.6} />
            </feSpecularLighting>
            <feComposite in="specular" in2="SourceGraphic" operator="in" result="specularMask" />
            <feBlend in="glow" in2="specularMask" mode="screen" />
          </filter>
        </defs>
        {/* Background track with subtle chrome bevel */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsla(230, 16%, 14%, 0.7)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsla(220, 10%, 85%, 0.04)"
          strokeWidth={strokeWidth - 1}
        />
        {/* Main ring */}
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
          filter={showGold ? `url(#${glowId})` : undefined}
        />
        {/* Specular highlight pass for gold */}
        {showGold && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${specularId})`}
            strokeWidth={strokeWidth - 1}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - filled }}
            transition={{ duration: 1, ease: 'easeOut' }}
            opacity={0.6}
          />
        )}
      </svg>
      <span className={`absolute font-mono text-sm font-bold ${showGold ? 'text-gold' : 'text-foreground'}`}
        style={showGold ? {
          textShadow: '0 0 10px hsla(43, 96%, 56%, 0.35), 0 1px 0 hsla(40, 90%, 28%, 0.6)',
        } : undefined}
      >
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
