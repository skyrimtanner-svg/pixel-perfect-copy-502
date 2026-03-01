import { milestones } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { Award, Target, CheckCircle2, TrendingDown } from 'lucide-react';

export default function CalibrationPage() {
  const { isWonder } = useMode();
  const resolved = milestones.filter(m => m.status === 'accomplished' || m.status === 'falsified');
  const brierScore = 0.142;

  const cardBase = {
    background: 'linear-gradient(168deg, hsla(232, 26%, 8%, 0.82), hsla(232, 22%, 5%, 0.72))',
    backdropFilter: 'blur(32px)',
    boxShadow: [
      'inset 0 1px 0 hsla(220, 14%, 88%, 0.06)',
      'inset 0 -1px 0 hsla(232, 30%, 2%, 0.5)',
      '0 4px 24px -8px hsla(232, 30%, 2%, 0.7)',
    ].join(', '),
  };

  const goldCard = {
    ...cardBase,
    border: '1px solid hsla(43, 96%, 56%, 0.2)',
    boxShadow: [
      'inset 0 1px 0 hsla(48, 100%, 80%, 0.08)',
      'inset 0 -1px 0 hsla(232, 30%, 2%, 0.5)',
      '0 0 32px -12px hsla(43, 96%, 56%, 0.1)',
      '0 4px 24px -8px hsla(232, 30%, 2%, 0.7)',
    ].join(', '),
  };

  const chromeCard = {
    ...cardBase,
    border: '1px solid hsla(220, 12%, 70%, 0.1)',
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className={`font-display text-2xl font-bold ${isWonder ? 'text-gold' : 'text-foreground'}`}>
          {isWonder ? '✦ Calibration' : 'Calibration'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          How well do our probabilities match reality? Brier Score: 0 = perfect, 0.25 = random.
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
        >
          <div className="absolute top-0 left-4 right-4 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.2), transparent)',
          }} />
          <TrendingDown className="w-4 h-4 text-gold-solid mx-auto mb-2" style={{ filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.4))' }} />
          <div
            className="font-mono text-3xl font-bold"
            style={{
              background: 'linear-gradient(135deg, hsl(38, 88%, 38%), hsl(43, 96%, 56%), hsl(48, 100%, 72%), hsl(43, 96%, 56%))',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: undefined,
              filter: 'drop-shadow(0 0 12px hsla(43, 96%, 56%, 0.3))',
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
        >
          <div className="absolute top-0 left-4 right-4 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.06), transparent)',
          }} />
          <CheckCircle2 className="w-4 h-4 text-chrome mx-auto mb-2" />
          <div className="font-mono text-3xl font-bold text-gold-num">{resolved.length}</div>
          <div className="text-[9px] text-muted-foreground mt-2 uppercase tracking-[0.15em] font-semibold font-mono">Resolved</div>
        </motion.div>

        {/* Calibration Badge */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden shine-sweep"
          style={goldCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="absolute top-0 left-4 right-4 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.2), transparent)',
          }} />
          <div className="flex items-center justify-center gap-2">
            <Award className="w-7 h-7 text-gold-solid" style={{ filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.4))' }} />
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
          background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.05), transparent)',
        }} />
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold font-mono">Brier Score Range</span>
        </div>
        <div className="relative h-5 rounded-full overflow-hidden" style={{
          background: 'hsla(232, 26%, 8%, 0.6)',
          border: '1px solid hsla(220, 12%, 70%, 0.06)',
        }}>
          {/* Gradient bar */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'linear-gradient(90deg, hsla(155, 82%, 48%, 0.3), hsla(43, 96%, 56%, 0.2), hsla(0, 72%, 55%, 0.3))',
          }} />
          {/* Score marker */}
          <motion.div
            className="absolute top-0 h-full w-0.5 rounded-full"
            style={{
              left: `${(brierScore / 0.25) * 100}%`,
              background: 'hsl(43, 96%, 56%)',
              boxShadow: '0 0 8px hsla(43, 96%, 56%, 0.6), 0 0 2px hsla(43, 96%, 56%, 0.9)',
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-1.5 font-mono text-[9px] text-muted-foreground">
          <span>0 <span className="text-green-400/60">perfect</span></span>
          <span className="text-gold-num font-bold">{brierScore.toFixed(3)}</span>
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
          background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.05), transparent)',
        }} />
        <h3 className="font-display font-semibold text-gold text-sm mb-3">How We Score</h3>
        <div className="space-y-2 text-[13px] text-secondary-foreground leading-relaxed">
          <p className="flex items-start gap-2">
            <span className="text-chrome mt-0.5">•</span>
            Only milestones with explicit resolution (accomplished/falsified) count toward Brier score
          </p>
          <p className="flex items-start gap-2">
            <span className="text-chrome mt-0.5">•</span>
            Historical anchors excluded from calibration scoring
          </p>
          <p className="flex items-start gap-2">
            <span className="text-chrome mt-0.5">•</span>
            The probability used is the LAST snapshot before resolution date
          </p>
          <p className="flex items-start gap-2">
            <span className="text-chrome mt-0.5">•</span>
            Forecast must be ≥<span className="font-mono text-gold-num">30</span> days old at resolution to count (prevents gaming)
          </p>
          <p className="flex items-start gap-2">
            <span className="text-chrome mt-0.5">•</span>
            Sandbox scenarios never count toward canonical calibration
          </p>
          <div
            className="font-mono text-xs mt-4 px-4 py-2.5 rounded-lg text-gold-num"
            style={{
              background: 'hsla(43, 96%, 56%, 0.04)',
              border: '1px solid hsla(43, 96%, 56%, 0.1)',
              boxShadow: 'inset 0 1px 0 hsla(43, 96%, 56%, 0.04)',
            }}
          >
            BS = (<span className="text-gold-solid">1</span>/N) × Σ(predicted − outcome)² | <span className="text-gold-solid">0</span> = perfect, <span className="text-gold-solid">0.25</span> = random guessing
          </div>
        </div>
      </motion.div>
    </div>
  );
}
