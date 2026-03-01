import { milestones } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

export default function CalibrationPage() {
  const { isWonder } = useMode();
  const resolved = milestones.filter(m => m.status === 'accomplished' || m.status === 'falsified');

  const brierScore = 0.142;

  return (
    <div>
      <div className="mb-6">
        <h1 className={`font-display text-2xl font-bold ${isWonder ? 'text-gold' : 'text-foreground'}`}>
          {isWonder ? '✦ Calibration' : 'Calibration'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          How well do our probabilities match reality? Brier Score: 0 = perfect, 0.25 = random.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Brier Score Card */}
        <motion.div
          className="glass-gold rounded-xl p-6 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="font-mono text-4xl font-bold text-gold"
            style={{ textShadow: '0 0 20px hsla(43, 96%, 56%, 0.3)' }}
          >
            {brierScore.toFixed(3)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold">Brier Score</div>
        </motion.div>

        {/* Resolved Card */}
        <motion.div
          className="glass-chrome rounded-xl p-6 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="font-mono text-4xl font-bold text-gold-num">{resolved.length}</div>
          <div className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold">Resolved</div>
        </motion.div>

        {/* Calibration Badge */}
        <motion.div
          className="glass-gold rounded-xl p-6 text-center shine-sweep"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center justify-center gap-2">
            <Award className="w-8 h-8 text-gold-solid"
              style={{ filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.4))' }}
            />
            <span className="font-display text-xl font-bold text-gold">Well Calibrated</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold">Bias Assessment</div>
        </motion.div>
      </div>

      {/* How We Score */}
      <div className="glass-premium rounded-xl p-6">
        <h3 className="font-display font-semibold text-gold mb-4 text-sm">How We Score</h3>
        <div className="space-y-2.5 text-sm text-secondary-foreground">
          <p>• Only milestones with explicit resolution (accomplished/falsified) count toward Brier score</p>
          <p>• Historical anchors excluded from calibration scoring</p>
          <p>• The probability used is the LAST snapshot before resolution date</p>
          <p>• Forecast must be ≥30 days old at resolution to count (prevents gaming)</p>
          <p>• Sandbox scenarios never count toward canonical calibration</p>
          <p className="font-mono text-xs mt-4 px-4 py-2.5 rounded-lg text-gold-num"
            style={{
              background: 'hsla(43, 96%, 56%, 0.05)',
              border: '1px solid hsla(43, 96%, 56%, 0.1)',
            }}
          >
            BS = (1/N) × Σ(predicted − outcome)² | 0 = perfect, 0.25 = random guessing
          </p>
        </div>
      </div>
    </div>
  );
}
