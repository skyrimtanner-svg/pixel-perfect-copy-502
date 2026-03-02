import { motion } from 'framer-motion';
import { useMode } from '@/contexts/ModeContext';

/**
 * Ultra-subtle animated nebula background for the waterfall container.
 * Wonder: animated opacity 0.04, 3s slow cycle
 * Analyst: static deep-space gradient
 */
export function WaterfallNebula() {
  const { isWonder } = useMode();

  return (
    <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-0">
      {isWonder ? (
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.03, 0.05, 0.03],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: [
              'radial-gradient(ellipse at 30% 40%, hsla(268, 55%, 18%, 0.12) 0%, transparent 60%)',
              'radial-gradient(ellipse at 70% 60%, hsla(240, 50%, 16%, 0.08) 0%, transparent 55%)',
              'radial-gradient(ellipse at 50% 80%, hsla(0, 40%, 18%, 0.06) 0%, transparent 50%)',
            ].join(', '),
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.03,
            background: 'linear-gradient(168deg, hsla(232, 30%, 8%, 0.5), hsla(240, 25%, 5%, 0.3), hsla(250, 20%, 4%, 0.2))',
          }}
        />
      )}
    </div>
  );
}
