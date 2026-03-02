import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/contexts/ModeContext';

interface NegativeDropSparksProps {
  active: boolean;
  intensity?: number; // 0-1, based on drop magnitude
  containerSize?: number;
  /** Full-screen ripple mode for committed negative evidence */
  fullScreen?: boolean;
}

/**
 * Red particle sparks that fly outward on negative probability drops.
 * Wonder mode: 45 particles + sad-tear emoji + poetic language
 * Analyst mode: clean metallic red border flash + log-odds readout
 */
export function NegativeDropSparks({ active, intensity = 0.5, containerSize = 72, fullScreen = false }: NegativeDropSparksProps) {
  const { isWonder } = useMode();
  const particleCount = isWonder ? Math.round(28 + intensity * 17) : Math.round(8 + intensity * 6);
  const radius = containerSize / 2;

  return (
    <AnimatePresence>
      {active && (
        <div className={`absolute pointer-events-none overflow-visible z-20 ${fullScreen ? 'fixed inset-0' : 'inset-0'}`}>
          {/* Full-screen subtle ripple for committed evidence */}
          {fullScreen && (
            <>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={`ripple-${i}`}
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0.12 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 2.5, delay: i * 0.4, ease: 'easeOut' }}
                  style={{
                    background: `radial-gradient(ellipse at 50% 40%, hsla(0, 72%, 55%, ${0.06 - i * 0.015}) 0%, transparent 70%)`,
                  }}
                />
              ))}
            </>
          )}

          {/* Spark particles flying outward */}
          {[...Array(particleCount)].map((_, i) => {
            const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
            const dist = fullScreen
              ? 80 + Math.random() * 200
              : radius * (1.2 + Math.random() * 1.5) * (0.8 + intensity * 0.6);
            const size = isWonder ? 2.5 + Math.random() * 6 : 1.5 + Math.random() * 3.5;
            const hue = isWonder ? 350 + Math.random() * 20 : 0;
            const lightness = isWonder ? 55 + Math.random() * 20 : 58;
            return (
              <motion.div
                key={`spark-${i}`}
                className="absolute rounded-full"
                style={{
                  width: size,
                  height: size,
                  left: fullScreen ? '50%' : '50%',
                  top: fullScreen ? '40%' : '50%',
                  background: isWonder
                    ? `radial-gradient(circle, hsla(${hue}, 80%, ${lightness}%, 0.9), hsla(${hue + 20}, 70%, ${lightness - 10}%, 0.4), transparent)`
                    : `radial-gradient(circle, hsla(0, 72%, 60%, 0.85), hsla(0, 60%, 45%, 0.3), transparent)`,
                  boxShadow: isWonder
                    ? `0 0 ${6 + Math.random() * 10}px hsla(0, 72%, 55%, ${0.4 + intensity * 0.4})`
                    : `0 0 ${4 + Math.random() * 6}px hsla(0, 72%, 55%, 0.35)`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1.3 }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist,
                  opacity: 0,
                  scale: 0,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.6 + Math.random() * 0.6,
                  ease: 'easeOut',
                  delay: i * 0.012,
                }}
              />
            );
          })}

          {/* Wonder mode: sad-tear emoji burst */}
          {isWonder && intensity > 0.25 && (
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg pointer-events-none select-none"
              initial={{ scale: 0, opacity: 1, y: 0 }}
              animate={{ scale: 2, opacity: 0, y: -40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              {intensity > 0.6 ? '😭' : intensity > 0.35 ? '😱' : '😰'}
            </motion.div>
          )}

          {/* Analyst mode: clean metallic red border flash */}
          {!isWonder && !fullScreen && (
            <motion.div
              className="absolute inset-[-3px] rounded-full pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              style={{
                border: `2px solid hsla(0, 72%, 55%, ${0.5 + intensity * 0.4})`,
                boxShadow: [
                  `0 0 16px hsla(0, 72%, 55%, ${0.25 + intensity * 0.25})`,
                  `inset 0 0 8px hsla(0, 72%, 55%, ${0.1 + intensity * 0.15})`,
                ].join(', '),
              }}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
