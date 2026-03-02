import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/contexts/ModeContext';

interface NegativeDropSparksProps {
  active: boolean;
  intensity?: number; // 0-1, based on drop magnitude
  containerSize?: number;
}

/**
 * Red particle sparks that fly outward on negative probability drops.
 * Wonder mode: more particles + sad emoji burst
 * Analyst mode: clean red border flash + log-odds readout
 */
export function NegativeDropSparks({ active, intensity = 0.5, containerSize = 72 }: NegativeDropSparksProps) {
  const { isWonder } = useMode();
  const particleCount = isWonder ? Math.round(16 + intensity * 12) : Math.round(6 + intensity * 4);
  const radius = containerSize / 2;

  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
          {/* Spark particles flying outward */}
          {[...Array(particleCount)].map((_, i) => {
            const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
            const dist = radius * (1.2 + Math.random() * 1.5) * (0.8 + intensity * 0.6);
            const size = isWonder ? 2 + Math.random() * 5 : 1.5 + Math.random() * 3;
            return (
              <motion.div
                key={`spark-${i}`}
                className="absolute rounded-full"
                style={{
                  width: size,
                  height: size,
                  left: '50%',
                  top: '50%',
                  background: isWonder
                    ? `radial-gradient(circle, hsla(${350 + Math.random() * 20}, 80%, ${55 + Math.random() * 20}%, 0.9), transparent)`
                    : `radial-gradient(circle, hsla(0, 72%, 60%, 0.8), transparent)`,
                  boxShadow: isWonder
                    ? `0 0 ${4 + Math.random() * 8}px hsla(0, 72%, 55%, ${0.4 + intensity * 0.4})`
                    : `0 0 4px hsla(0, 72%, 55%, 0.3)`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1.2 }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist,
                  opacity: 0,
                  scale: 0,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.5 + Math.random() * 0.5,
                  ease: 'easeOut',
                  delay: i * 0.015,
                }}
              />
            );
          })}

          {/* Wonder mode: sad emoji burst */}
          {isWonder && intensity > 0.3 && (
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm pointer-events-none select-none"
              initial={{ scale: 0, opacity: 1, y: 0 }}
              animate={{ scale: 1.5, opacity: 0, y: -30 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {intensity > 0.6 ? '😱' : '😰'}
            </motion.div>
          )}

          {/* Analyst mode: clean red border flash */}
          {!isWonder && (
            <motion.div
              className="absolute inset-[-2px] rounded-full pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                border: `2px solid hsla(0, 72%, 55%, ${0.4 + intensity * 0.4})`,
                boxShadow: `0 0 12px hsla(0, 72%, 55%, ${0.2 + intensity * 0.2})`,
              }}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
