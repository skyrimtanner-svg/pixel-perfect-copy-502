import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { useId } from 'react';

interface AnimatedProbabilityRingProps {
  currentValue: number;
  previousValue?: number;
  size: number;
  mode: 'wonder' | 'analyst';
  strokeWidth?: number;
  domainColor?: string;
  useGold?: boolean;
  isNegativeShift?: boolean;
}

const springTransition = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 1.0 };
const glowSpring = { type: 'spring' as const, stiffness: 500, damping: 25 };
const flareSpring = { type: 'spring' as const, stiffness: 600, damping: 20 };

export function AnimatedProbabilityRing({
  currentValue,
  previousValue,
  size,
  mode,
  strokeWidth = 5,
  domainColor = 'hsl(var(--primary))',
  useGold = false,
  isNegativeShift = false,
}: AnimatedProbabilityRingProps) {
  const id = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const isWonder = mode === 'wonder';

  const gradientId = `anim-ring-${id}`;
  const glowFilterId = `anim-glow-${id}`;
  const redGradientId = `anim-red-${id}`;
  const specularId = `anim-spec-${id}`;

  const showGold = !isNegativeShift && (useGold || isWonder || currentValue > 0.7);
  const showRed = isNegativeShift;

  // Spring-animated motion value for ring fill
  const progress = useMotionValue(previousValue ?? currentValue);
  const dashOffset = useTransform(progress, (v) => circumference - circumference * v);

  // Shift detection
  const shift = previousValue !== undefined ? Math.abs(currentValue - previousValue) : 0;
  const isBigShift = shift > 0.05;
  const delta = previousValue !== undefined ? currentValue - previousValue : 0;

  const [showFlare, setShowFlare] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [sparkles, setSparkles] = useState<{ x: number; y: number; delay: number }[]>([]);
  const prevRef = useRef(currentValue);

  // Animate progress with spring physics
  useEffect(() => {
    const controls = animate(progress, currentValue, {
      ...springTransition,
      onComplete: () => {},
    });

    // Trigger glow on any update
    if (prevRef.current !== currentValue) {
      setShowGlow(true);
      const t = setTimeout(() => setShowGlow(false), 800);

      // Big shift: lens flare + sparkles
      if (isBigShift) {
        setShowFlare(true);
        const ft = setTimeout(() => setShowFlare(false), 1000);

        if (isWonder) {
          const newSparkles = Array.from({ length: 8 }, (_, i) => ({
            x: Math.cos((i / 8) * Math.PI * 2) * size * 0.5,
            y: Math.sin((i / 8) * Math.PI * 2) * size * 0.5,
            delay: i * 0.04,
          }));
          setSparkles(newSparkles);
          const st = setTimeout(() => setSparkles([]), 1200);
          return () => { controls.stop(); clearTimeout(t); clearTimeout(ft); clearTimeout(st); };
        }

        return () => { controls.stop(); clearTimeout(t); clearTimeout(ft); };
      }

      return () => { controls.stop(); clearTimeout(t); };
    }

    return () => controls.stop();
  }, [currentValue]);

  useEffect(() => {
    prevRef.current = currentValue;
  }, [currentValue]);

  const fontSize = size < 40 ? '9px' : size < 56 ? '11px' : '13px';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Soft glow pulse on update */}
      <AnimatePresence>
        {showGlow && (
          <motion.div
            className="absolute inset-[-4px] rounded-full pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.6, scale: 1.08 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={glowSpring}
            style={{
              boxShadow: showRed
                ? '0 0 20px 4px hsla(0, 72%, 55%, 0.35)'
                : '0 0 20px 4px hsla(43, 96%, 56%, 0.3)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Lens-flare burst on >5pp shift */}
      <AnimatePresence>
        {showFlare && (
          <motion.div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: size * 1.4,
              height: size * 1.4,
              left: -(size * 0.2),
              top: -(size * 0.2),
              background: showRed
                ? 'radial-gradient(circle, hsla(0, 72%, 65%, 0.25), transparent 60%)'
                : 'radial-gradient(circle, hsla(48, 100%, 85%, 0.3), transparent 60%)',
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={flareSpring}
          />
        )}
      </AnimatePresence>

      {/* Wonder mode: particle sparkle burst */}
      <AnimatePresence>
        {isWonder && sparkles.map((s, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute pointer-events-none"
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'hsl(43, 96%, 70%)',
              boxShadow: '0 0 6px 2px hsla(43, 96%, 56%, 0.5)',
              left: size / 2,
              top: size / 2,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: s.x, y: s.y, opacity: 0, scale: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, delay: s.delay, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Outer ambient glow */}
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
          <filter id={glowFilterId}>
            <feGaussianBlur stdDeviation={showGold ? '3.5' : '2'} result="blur" />
            <feComposite in="blur" in2="SourceGraphic" operator="over" />
          </filter>
        </defs>

        {/* Background track */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsla(230, 16%, 14%, 0.7)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsla(220, 10%, 85%, 0.05)" strokeWidth={strokeWidth - 1} />

        {/* Animated ring with spring physics */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={showRed ? `url(#${redGradientId})` : `url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
          filter={showGold ? `url(#${glowFilterId})` : undefined}
        />

        {/* Specular highlight */}
        {(showGold || showRed) && (
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={`url(#${specularId})`}
            strokeWidth={strokeWidth - 1}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset }}
            opacity={0.7}
          />
        )}
      </svg>

      {/* Center text */}
      <motion.span
        className={`absolute font-mono font-bold tabular-nums ${!showGold && !showRed ? 'text-foreground' : ''}`}
        style={{
          fontSize,
          ...(showRed ? {
            background: 'linear-gradient(135deg, hsl(0, 60%, 42%), hsl(0, 72%, 60%), hsl(355, 80%, 68%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          } : showGold ? {
            background: 'linear-gradient(135deg, hsl(43, 96%, 50%), hsl(48, 100%, 78%), hsl(43, 96%, 56%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.7))',
          } : {}),
        }}
        key={`${currentValue.toFixed(3)}`}
        initial={isBigShift ? { scale: 1.4, opacity: 0 } : { scale: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      >
        {Math.round(currentValue * 100)}%
      </motion.span>

      {/* Analyst mode: delta badge with sweep */}
      {!isWonder && isBigShift && previousValue !== undefined && (
        <motion.div
          className="absolute -top-1 -right-1 font-mono text-[8px] font-bold tabular-nums px-1 py-0.5 rounded"
          style={{
            background: delta > 0 ? 'hsla(155, 82%, 48%, 0.15)' : 'hsla(0, 72%, 55%, 0.15)',
            color: delta > 0 ? 'hsl(155, 82%, 55%)' : 'hsl(0, 72%, 60%)',
            border: `1px solid ${delta > 0 ? 'hsla(155, 82%, 48%, 0.3)' : 'hsla(0, 72%, 55%, 0.3)'}`,
          }}
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, ...glowSpring }}
        >
          {delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}pp
        </motion.div>
      )}

      {/* Wonder mode: poetic tooltip on big shift */}
      {isWonder && isBigShift && (
        <motion.div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[7px] pointer-events-none"
          style={{ color: 'hsl(43, 96%, 70%)' }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, ease: 'easeOut' }}
        >
          {delta > 0 ? '✨ futures shifting…' : '💫 recalibrating…'}
        </motion.div>
      )}
    </div>
  );
}
