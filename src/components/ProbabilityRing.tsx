import { useId, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/contexts/ModeContext';
import { NegativeDropSparks } from '@/components/NegativeDropSparks';

interface ProbabilityRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  domainColor?: string;
  useGold?: boolean;
  isNegativeShift?: boolean;
  previousValue?: number;
}

export function ProbabilityRing({
  value,
  size = 64,
  strokeWidth = 5,
  className = '',
  domainColor = 'hsl(var(--primary))',
  useGold = false,
  isNegativeShift = false,
  previousValue,
}: ProbabilityRingProps) {
  const { isWonder } = useMode();
  const id = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * value;
  const gradientId = `ring-${id}`;
  const glowId = `glow-${id}`;
  const specularId = `specular-${id}`;
  const redGlowId = `red-glow-${id}`;
  const redGradientId = `red-grad-${id}`;
  const showGold = !isNegativeShift && (useGold || isWonder || value > 0.7);
  const showRed = isNegativeShift;

  // Dramatic drop detection
  const dropMagnitude = previousValue !== undefined ? previousValue - value : 0;
  const isDramaticDrop = dropMagnitude > 0.05;
  const isSignificantDrop = dropMagnitude > 0.08;

  // Spark trigger state
  const [sparkActive, setSparkActive] = useState(false);
  useEffect(() => {
    if (isSignificantDrop && showRed) {
      setSparkActive(true);
      const t = setTimeout(() => setSparkActive(false), 1200);
      return () => clearTimeout(t);
    }
  }, [isSignificantDrop, showRed, value]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Outer glow ring — gold or red */}
      <AnimatePresence mode="wait">
        {showRed ? (
          <motion.div
            key="red-glow"
            className="absolute inset-[-3px] rounded-full pointer-events-none"
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{
              opacity: [0, 0.8, 0.5],
              scale: [1.3, 1, 1.05],
              boxShadow: [
                '0 0 40px 8px hsla(0, 72%, 55%, 0.6), 0 0 12px 2px hsla(0, 72%, 65%, 0.3)',
                '0 0 24px 4px hsla(0, 72%, 55%, 0.4), 0 0 8px 1px hsla(0, 72%, 65%, 0.2)',
                '0 0 30px 6px hsla(0, 72%, 55%, 0.5), 0 0 10px 2px hsla(0, 72%, 65%, 0.25)',
              ],
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        ) : showGold ? (
          <motion.div
            key="gold-glow"
            className="absolute inset-[-3px] rounded-full pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              boxShadow: '0 0 18px -4px hsla(43, 96%, 56%, 0.35), 0 0 6px -2px hsla(190, 100%, 50%, 0.15)',
            }}
          />
        ) : null}
      </AnimatePresence>

      {/* Red pulse rings for dramatic drops */}
      <AnimatePresence>
        {isDramaticDrop && showRed && (
          <>
            {[0, 1, 2].map(i => (
              <motion.div
                key={`pulse-${i}`}
                className="absolute inset-[-2px] rounded-full pointer-events-none"
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.5 + i * 0.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, delay: i * 0.3, ease: 'easeOut' }}
                style={{
                  border: '1px solid hsla(0, 72%, 55%, 0.4)',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <svg width={size} height={size} className="-rotate-90">
        <defs>
          {/* Gold gradient */}
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
          {/* Red gradient for negative shifts */}
          <linearGradient id={redGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 60%, 30%)" />
            <stop offset="20%" stopColor="hsl(0, 72%, 48%)" />
            <stop offset="45%" stopColor="hsl(0, 80%, 62%)" />
            <stop offset="60%" stopColor="hsl(355, 85%, 70%)" />
            <stop offset="80%" stopColor="hsl(0, 72%, 55%)" />
            <stop offset="100%" stopColor="hsl(0, 60%, 35%)" />
          </linearGradient>
          <linearGradient id={specularId} x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={showRed ? 'hsla(0, 80%, 92%, 0.5)' : 'hsla(48, 100%, 92%, 0.6)'} />
            <stop offset="30%" stopColor={showRed ? 'hsla(0, 80%, 90%, 0.12)' : 'hsla(48, 100%, 90%, 0.15)'} />
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
          <filter id={redGlowId}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="hsl(0, 72%, 55%)" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>
        {/* Background track — chrome bevel */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsla(230, 16%, 14%, 0.7)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsla(220, 10%, 85%, 0.05)" strokeWidth={strokeWidth - 1} />
        {/* Inner shadow track */}
        <circle cx={size / 2} cy={size / 2} r={radius - 1} fill="none"
          stroke="hsla(232, 30%, 2%, 0.3)" strokeWidth={1} />
        {/* Main ring */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={showRed ? `url(#${redGradientId})` : `url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - filled }}
          transition={{ duration: showRed && isDramaticDrop ? 1.5 : 1, ease: showRed ? [0.4, 0, 0.2, 1] : 'easeOut' }}
          filter={showRed ? `url(#${redGlowId})` : showGold ? `url(#${glowId})` : undefined}
        />
        {/* Specular highlight pass */}
        {(showGold || showRed) && (
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
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
      {/* Negative drop sparks */}
      <NegativeDropSparks
        active={sparkActive}
        intensity={Math.min(1, dropMagnitude * 5)}
        containerSize={size}
      />

      <motion.span
        className={`absolute font-mono font-bold tabular-nums ${!showGold && !showRed ? 'text-foreground' : ''}`}
        style={{
          fontSize: size < 40 ? '9px' : size < 56 ? '11px' : '13px',
          ...(showRed ? {
            background: 'linear-gradient(135deg, hsl(0, 60%, 42%), hsl(0, 72%, 60%), hsl(355, 80%, 68%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 12px hsla(0, 72%, 55%, 0.5)',
            filter: 'drop-shadow(0 1px 0 hsla(0, 60%, 25%, 0.7))',
          } : showGold ? {
            background: 'linear-gradient(135deg, hsl(43, 96%, 50%), hsl(48, 100%, 78%), hsl(43, 96%, 56%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 12px hsla(43, 96%, 56%, 0.4)',
            filter: 'drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.7))',
          } : {}),
        }}
        key={`${value.toFixed(3)}-${showRed}`}
        initial={isDramaticDrop ? { scale: 1.6, opacity: 0 } : { scale: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        {Math.round(value * 100)}%
      </motion.span>
    </div>
  );
}
