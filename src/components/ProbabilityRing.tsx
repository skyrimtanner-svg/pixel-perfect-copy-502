import { useId } from 'react';
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
  const id = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * value;
  const gradientId = `ring-${id}`;
  const glowId = `glow-${id}`;
  const specularId = `specular-${id}`;
  const outerGlowId = `outer-glow-${id}`;
  const showGold = useGold || isWonder || value > 0.7;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Outer glow ring */}
      {showGold && (
        <div
          className="absolute inset-[-3px] rounded-full pointer-events-none"
          style={{
            boxShadow: '0 0 18px -4px hsla(43, 96%, 56%, 0.35), 0 0 6px -2px hsla(190, 100%, 50%, 0.15)',
          }}
        />
      )}
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {showGold ? (
              <>
                <stop offset="0%" stopColor="hsl(40, 90%, 30%)" />
                <stop offset="15%" stopColor="hsl(43, 96%, 48%)" />
                <stop offset="35%" stopColor="hsl(48, 100%, 72%)" />
                <stop offset="50%" stopColor="hsl(50, 100%, 88%)" />
                <stop offset="65%" stopColor="hsl(48, 100%, 70%)" />
                <stop offset="80%" stopColor="hsl(43, 96%, 52%)" />
                <stop offset="100%" stopColor="hsl(40, 90%, 35%)" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={domainColor} />
                <stop offset="100%" stopColor={domainColor} />
              </>
            )}
          </linearGradient>
          <linearGradient id={specularId} x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsla(48, 100%, 92%, 0.6)" />
            <stop offset="30%" stopColor="hsla(48, 100%, 90%, 0.15)" />
            <stop offset="100%" stopColor="hsla(48, 100%, 90%, 0)" />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation={showGold ? '3.5' : '2'} result="blur" />
            <feComposite in="blur" in2="SourceGraphic" operator="over" result="glow" />
            <feSpecularLighting surfaceScale="4" specularConstant="1.4" specularExponent="25" lightingColor="hsl(48, 100%, 88%)" result="specular">
              <fePointLight x={size * 0.3} y={size * 0.2} z={size * 0.7} />
            </feSpecularLighting>
            <feComposite in="specular" in2="SourceGraphic" operator="in" result="specularMask" />
            <feBlend in="glow" in2="specularMask" mode="screen" />
          </filter>
          <filter id={outerGlowId}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="hsl(43, 96%, 56%)" floodOpacity="0.3" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>
        {/* Background track — chrome bevel */}
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
          stroke="hsla(220, 10%, 85%, 0.05)"
          strokeWidth={strokeWidth - 1}
        />
        {/* Inner shadow track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 1}
          fill="none"
          stroke="hsla(232, 30%, 2%, 0.3)"
          strokeWidth={1}
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
        {/* Specular highlight pass */}
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
            opacity={0.7}
          />
        )}
      </svg>
      <span
        className={`absolute font-mono font-bold tabular-nums ${showGold ? '' : 'text-foreground'}`}
        style={{
          fontSize: size < 40 ? '9px' : size < 56 ? '11px' : '13px',
          ...(showGold ? {
            background: 'linear-gradient(135deg, hsl(43, 96%, 50%), hsl(48, 100%, 78%), hsl(43, 96%, 56%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 12px hsla(43, 96%, 56%, 0.4)',
            filter: 'drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.7))',
          } : {}),
        }}
      >
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
