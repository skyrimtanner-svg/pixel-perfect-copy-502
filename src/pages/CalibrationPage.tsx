import { milestones } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { Award, Target, CheckCircle2, TrendingDown } from 'lucide-react';

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
    background: 'linear-gradient(168deg, hsla(232, 26%, 8%, 0.85), hsla(232, 22%, 5%, 0.75))',
    backdropFilter: 'blur(36px)',
    boxShadow: [
      'inset 0 1px 0 hsla(220, 14%, 88%, 0.08)',
      'inset 0 -1px 0 hsla(232, 30%, 2%, 0.5)',
      '0 6px 28px -8px hsla(232, 30%, 2%, 0.7)',
      '0 2px 6px hsla(232, 30%, 2%, 0.4)',
    ].join(', '),
  };

  const goldCard = {
    ...cardBase,
    border: '1px solid hsla(43, 96%, 56%, 0.25)',
    boxShadow: [
      'inset 0 1px 0 hsla(48, 100%, 80%, 0.1)',
      'inset 0 -1px 0 hsla(232, 30%, 2%, 0.5)',
      '0 0 40px -12px hsla(43, 96%, 56%, 0.12)',
      '0 6px 28px -8px hsla(232, 30%, 2%, 0.7)',
    ].join(', '),
  };

  const chromeCard = {
    ...cardBase,
    border: '1px solid hsla(220, 12%, 70%, 0.14)',
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
        {/* Brier Score */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden shine-sweep"
          style={goldCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="absolute top-0 left-4 right-4 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.25), transparent)',
          }} />
          {/* Glossy top reflection */}
          <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl pointer-events-none" style={{
            background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.04) 0%, transparent 100%)',
          }} />
          <TrendingDown className="w-4 h-4 text-gold-solid mx-auto mb-2" style={{ filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.5))' }} />
          <div
            className="font-mono text-3xl font-bold tabular-nums"
            style={{
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 14px hsla(43, 96%, 56%, 0.35))',
            }}
          >
            {brierScore.toFixed(3)}
          </div>
          <div className="text-[9px] text-muted-foreground mt-2 uppercase tracking-[0.15em] font-semibold font-mono">Brier Score</div>
        </motion.div>

        {/* Resolved */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden"
          style={chromeCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="absolute top-0 left-4 right-4 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.08), transparent)',
          }} />
          <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl pointer-events-none" style={{
            background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.03) 0%, transparent 100%)',
          }} />
          <CheckCircle2 className="w-4 h-4 text-chrome mx-auto mb-2" />
          <div className="font-mono text-3xl font-bold text-gold-num tabular-nums">{resolved.length}</div>
          <div className="text-[9px] text-muted-foreground mt-2 uppercase tracking-[0.15em] font-semibold font-mono">Resolved</div>
        </motion.div>

        {/* Calibration Badge */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden shine-sweep"
          style={goldCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="absolute top-0 left-4 right-4 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.25), transparent)',
          }} />
          <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl pointer-events-none" style={{
            background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.04) 0%, transparent 100%)',
          }} />
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Award className="w-7 h-7 text-gold-solid" style={{ filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.5))' }} />
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
          background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.06), transparent)',
        }} />
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold font-mono">Brier Score Range</span>
        </div>
        <div className="relative h-5 rounded-full overflow-hidden" style={{
          background: 'hsla(232, 26%, 8%, 0.6)',
          border: '1px solid hsla(220, 12%, 70%, 0.08)',
        }}>
          <div className="absolute inset-0 rounded-full" style={{
            background: 'linear-gradient(90deg, hsla(155, 82%, 48%, 0.3), hsla(43, 96%, 56%, 0.2), hsla(0, 72%, 55%, 0.3))',
          }} />
          <motion.div
            className="absolute top-0 h-full w-1 rounded-full"
            style={{
              left: `${(brierScore / 0.25) * 100}%`,
              background: 'linear-gradient(180deg, hsl(48, 100%, 80%), hsl(43, 96%, 56%))',
              boxShadow: '0 0 10px hsla(43, 96%, 56%, 0.7), 0 0 3px hsla(43, 96%, 56%, 0.9)',
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-1.5 font-mono text-[9px] text-muted-foreground tabular-nums">
          <span>0 <span className="text-green-400/60">perfect</span></span>
          <span style={goldGradientStyle} className="font-bold">{brierScore.toFixed(3)}</span>
          <span>0.25 <span className="text-red-400/60">random</span></span>
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
          background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.06), transparent)',
        }} />
        <h3 className="font-display font-semibold text-gold text-sm mb-3">
          {isWonder ? '🎯 How We Keep Score' : 'Scoring Methodology'}
        </h3>
        <div className={`space-y-2 leading-relaxed ${isWonder ? 'text-[13px] text-secondary-foreground' : 'text-[12px] text-chrome font-mono'}`}>
          <p className="flex items-start gap-2">
            <span className="text-chrome mt-0.5">•</span>
            {isWonder
              ? 'Only milestones that have actually happened (or been disproven) count toward our accuracy score'
              : 'Only resolved milestones (accomplished/falsified) count toward BS'}
          </p>
          <p className="flex items-start gap-2">
            <span className="text-chrome mt-0.5">•</span>
            {isWonder
              ? 'Historical anchors (things from centuries ago) don\'t count — that would be too easy!'
              : 'Historical anchors excluded from calibration'}
          </p>
          <p className="flex items-start gap-2">
            <span className="text-chrome mt-0.5">•</span>
            {isWonder
              ? 'We use the last probability snapshot before the milestone was resolved'
              : 'LAST snapshot before resolution date used'}
          </p>
          <p className="flex items-start gap-2">
            <span className="text-chrome mt-0.5">•</span>
            {isWonder
              ? 'Forecasts must be at least 30 days old — no last-minute cheating allowed!'
              : <>Forecast ≥<span className="text-gold-num tabular-nums">30</span>d at resolution (anti-gaming)</>}
          </p>
          <p className="flex items-start gap-2">
            <span className="text-chrome mt-0.5">•</span>
            {isWonder
              ? 'Sandbox experiments never count toward our real calibration — only the real deal!'
              : 'Sandbox scenarios excluded from canonical calibration'}
          </p>
          <div
            className="font-mono text-xs mt-4 px-4 py-2.5 rounded-lg text-gold-num tabular-nums"
            style={{
              background: 'hsla(43, 96%, 56%, 0.05)',
              border: '1px solid hsla(43, 96%, 56%, 0.12)',
              boxShadow: 'inset 0 1px 0 hsla(43, 96%, 56%, 0.05), inset 0 -1px 0 hsla(232, 30%, 2%, 0.3)',
              backdropFilter: 'blur(12px)',
            }}
          >
            BS = (<span className="text-gold-solid">1</span>/N) × Σ(predicted − outcome)² | <span className="text-gold-solid">0</span> = perfect, <span className="text-gold-solid">0.25</span> = random
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
