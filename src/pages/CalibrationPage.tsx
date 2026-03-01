import { milestones } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { Award, Target, CheckCircle2, TrendingDown, Sparkles } from 'lucide-react';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

export default function CalibrationPage() {
  const { isWonder } = useMode();
  const resolved = milestones.filter(m => m.status === 'accomplished' || m.status === 'falsified');
  const brierScore = 0.142;

  const cardBase = {
    background: 'linear-gradient(168deg, hsla(232, 26%, 9%, 0.88), hsla(232, 22%, 5%, 0.82))',
    backdropFilter: 'blur(40px)',
    boxShadow: [
      'inset 0 1px 0 hsla(220, 16%, 95%, 0.09)',
      'inset 0 -1px 0 hsla(232, 30%, 2%, 0.55)',
      '0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
      '0 2px 6px hsla(232, 30%, 2%, 0.45)',
    ].join(', '),
  };

  const goldCard = {
    ...cardBase,
    border: '1px solid hsla(43, 96%, 56%, 0.3)',
    boxShadow: [
      'inset 0 1px 0 hsla(48, 100%, 80%, 0.14)',
      'inset 0 -1px 0 hsla(232, 30%, 2%, 0.55)',
      '0 0 48px -12px hsla(43, 96%, 56%, 0.18)',
      '0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
    ].join(', '),
  };

  const chromeCard = {
    ...cardBase,
    border: '1px solid hsla(220, 12%, 70%, 0.16)',
  };

  return (
    <motion.div
      key={isWonder ? 'wonder' : 'analyst'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-5">
        <h1 className={`font-display font-bold ${isWonder ? 'text-gold text-2xl' : 'text-foreground text-xl'}`}>
          {isWonder ? '✦ Calibration' : 'Calibration'}
        </h1>
        <p className={`mt-1 ${isWonder ? 'text-xs text-muted-foreground' : 'text-[10px] font-mono text-chrome'}`}>
          {isWonder
            ? 'How accurate are our predictions? A lower Brier Score means we\'re getting closer to the truth!'
            : 'Brier Score | 0 = perfect | 0.25 = random | resolved milestones only'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Brier Score — Hero Gold Card */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden shine-sweep"
          style={goldCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="absolute top-0 left-4 right-4 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.35), hsla(48, 100%, 80%, 0.15), transparent)',
          }} />
          <div className="absolute top-0 left-0 right-0 h-[45%] rounded-t-xl pointer-events-none" style={{
            background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.05) 0%, transparent 100%)',
          }} />
          <TrendingDown className="w-4 h-4 mx-auto mb-2" style={{
            color: 'hsl(43, 96%, 56%)',
            filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.6)) drop-shadow(0 0 3px hsla(190, 100%, 50%, 0.3))',
          }} />
          <div
            className="font-mono text-3xl font-bold tabular-nums"
            style={{
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 16px hsla(43, 96%, 56%, 0.4)) drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.8))',
            }}
          >
            {brierScore.toFixed(3)}
          </div>
          <div className="text-[9px] text-muted-foreground mt-2 uppercase tracking-[0.15em] font-semibold font-mono">Brier Score</div>
        </motion.div>

        {/* Resolved — Chrome Card */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden chrome-sweep"
          style={chromeCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="absolute top-0 left-4 right-4 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.1), transparent)',
          }} />
          <div className="absolute top-0 left-0 right-0 h-[45%] rounded-t-xl pointer-events-none" style={{
            background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.04) 0%, transparent 100%)',
          }} />
          <CheckCircle2 className="w-4 h-4 mx-auto mb-2" style={{
            color: 'hsl(220, 14%, 75%)',
            filter: 'drop-shadow(0 0 6px hsla(220, 14%, 75%, 0.3))',
          }} />
          <div className="font-mono text-3xl font-bold tabular-nums" style={{
            background: 'linear-gradient(135deg, hsl(220, 10%, 55%), hsl(220, 14%, 80%), hsl(220, 16%, 94%), hsl(220, 14%, 82%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 1px 0 hsla(220, 10%, 30%, 0.6))',
          }}>{resolved.length}</div>
          <div className="text-[9px] text-muted-foreground mt-2 uppercase tracking-[0.15em] font-semibold font-mono">Resolved</div>
        </motion.div>

        {/* Calibration Badge — Gold with Particles */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden shine-sweep"
          style={goldCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="absolute top-0 left-4 right-4 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.35), hsla(48, 100%, 80%, 0.15), transparent)',
          }} />
          <div className="absolute top-0 left-0 right-0 h-[45%] rounded-t-xl pointer-events-none" style={{
            background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.05) 0%, transparent 100%)',
          }} />
          {/* Floating celebration particles */}
          <motion.div
            className="absolute top-2 right-3"
            animate={{ rotate: [0, 20, -15, 0], y: [0, -3, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-4 h-4" style={{
              color: 'hsl(43, 96%, 56%)',
              filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.5))',
              opacity: 0.5,
            }} />
          </motion.div>
          <motion.div
            className="absolute bottom-3 left-4"
            animate={{ rotate: [0, -10, 15, 0], y: [0, 2, 0], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <Sparkles className="w-3 h-3" style={{
              color: 'hsl(48, 100%, 70%)',
              filter: 'drop-shadow(0 0 4px hsla(48, 100%, 70%, 0.4))',
              opacity: 0.35,
            }} />
          </motion.div>
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Award className="w-7 h-7" style={{
                color: 'hsl(43, 96%, 56%)',
                filter: 'drop-shadow(0 0 10px hsla(43, 96%, 56%, 0.6)) drop-shadow(0 0 4px hsla(190, 100%, 50%, 0.25))',
              }} />
            </motion.div>
            <span className="font-display text-lg font-bold text-gold">Well Calibrated</span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-2 uppercase tracking-[0.15em] font-semibold font-mono">Bias Assessment</div>
        </motion.div>
      </div>

      {/* Score range indicator */}
      <motion.div
        className="rounded-xl p-4 mb-6 relative overflow-hidden"
        style={chromeCard}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="absolute top-0 left-6 right-6 h-px" style={{
          background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.08), transparent)',
        }} />
        <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl pointer-events-none" style={{
          background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.03) 0%, transparent 100%)',
        }} />
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold font-mono">Brier Score Range</span>
        </div>
        <div className="relative h-6 rounded-full overflow-hidden" style={{
          background: 'hsla(232, 26%, 8%, 0.7)',
          border: '1px solid hsla(220, 12%, 70%, 0.1)',
          boxShadow: 'inset 0 2px 4px hsla(232, 30%, 2%, 0.4)',
        }}>
          <div className="absolute inset-0 rounded-full" style={{
            background: 'linear-gradient(90deg, hsla(155, 82%, 48%, 0.35), hsla(155, 82%, 48%, 0.15) 30%, hsla(43, 96%, 56%, 0.25) 55%, hsla(36, 100%, 56%, 0.2) 75%, hsla(0, 72%, 55%, 0.35))',
          }} />
          {/* Glow overlay */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'linear-gradient(90deg, transparent 20%, hsla(43, 96%, 56%, 0.08) 40%, hsla(0, 72%, 55%, 0.06) 80%, transparent)',
            boxShadow: 'inset 0 1px 0 hsla(220, 16%, 95%, 0.06)',
          }} />
          <motion.div
            className="absolute top-0 h-full w-1.5 rounded-full"
            style={{
              left: `${(brierScore / 0.25) * 100}%`,
              background: 'linear-gradient(180deg, hsl(50, 100%, 88%), hsl(48, 100%, 78%), hsl(43, 96%, 56%))',
              boxShadow: '0 0 14px hsla(43, 96%, 56%, 0.8), 0 0 4px hsla(43, 96%, 56%, 1), 0 0 24px -4px hsla(43, 96%, 56%, 0.5)',
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2 font-mono text-[9px] text-muted-foreground tabular-nums">
          <span>0 <span style={{ color: 'hsl(155, 82%, 55%)', textShadow: '0 0 6px hsla(155, 82%, 48%, 0.3)' }}>perfect</span></span>
          <span style={{ ...goldGradientStyle, filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.3))' }} className="font-bold text-[10px]">{brierScore.toFixed(3)}</span>
          <span>0.25 <span style={{ color: 'hsl(0, 72%, 58%)', textShadow: '0 0 6px hsla(0, 72%, 55%, 0.3)' }}>random</span></span>
        </div>
      </motion.div>

      {/* How We Score */}
      <motion.div
        className="rounded-xl p-5 relative overflow-hidden"
        style={chromeCard}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="absolute top-0 left-6 right-6 h-px" style={{
          background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.08), transparent)',
        }} />
        <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl pointer-events-none" style={{
          background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.03) 0%, transparent 100%)',
        }} />
        <h3 className="font-display font-semibold text-gold text-sm mb-3">
          {isWonder ? '🎯 How We Keep Score' : 'Scoring Methodology'}
        </h3>
        <div className={`space-y-2 leading-relaxed ${isWonder ? 'text-[13px] text-secondary-foreground' : 'text-[12px] text-chrome font-mono'}`}>
          <p className="flex items-start gap-2">
            <span style={{ color: 'hsl(220, 14%, 60%)' }}>•</span>
            {isWonder
              ? 'Only milestones that have actually happened (or been disproven) count toward our accuracy score'
              : 'Only resolved milestones (accomplished/falsified) count toward BS'}
          </p>
          <p className="flex items-start gap-2">
            <span style={{ color: 'hsl(220, 14%, 60%)' }}>•</span>
            {isWonder
              ? 'Historical anchors (things from centuries ago) don\'t count — that would be too easy!'
              : 'Historical anchors excluded from calibration'}
          </p>
          <p className="flex items-start gap-2">
            <span style={{ color: 'hsl(220, 14%, 60%)' }}>•</span>
            {isWonder
              ? 'We use the last probability snapshot before the milestone was resolved'
              : 'LAST snapshot before resolution date used'}
          </p>
          <p className="flex items-start gap-2">
            <span style={{ color: 'hsl(220, 14%, 60%)' }}>•</span>
            {isWonder
              ? 'Forecasts must be at least 30 days old — no last-minute cheating allowed!'
              : <>Forecast ≥<span className="text-gold-num tabular-nums">30</span>d at resolution (anti-gaming)</>}
          </p>
          <p className="flex items-start gap-2">
            <span style={{ color: 'hsl(220, 14%, 60%)' }}>•</span>
            {isWonder
              ? 'Sandbox experiments never count toward our real calibration — only the real deal!'
              : 'Sandbox scenarios excluded from canonical calibration'}
          </p>
          <div
            className="font-mono text-xs mt-4 px-4 py-3 rounded-lg tabular-nums"
            style={{
              background: 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.06), hsla(43, 96%, 56%, 0.02))',
              border: '1px solid hsla(43, 96%, 56%, 0.15)',
              boxShadow: 'inset 0 1px 0 hsla(43, 96%, 56%, 0.06), inset 0 -1px 0 hsla(232, 30%, 2%, 0.35), 0 0 20px -8px hsla(43, 96%, 56%, 0.1)',
              backdropFilter: 'blur(16px)',
              color: 'hsl(43, 82%, 60%)',
              textShadow: '0 0 8px hsla(43, 96%, 56%, 0.2)',
            }}
          >
            BS = (<span style={{ color: 'hsl(43, 96%, 56%)' }}>1</span>/N) × Σ(predicted − outcome)² | <span style={{ color: 'hsl(43, 96%, 56%)' }}>0</span> = perfect, <span style={{ color: 'hsl(43, 96%, 56%)' }}>0.25</span> = random
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
