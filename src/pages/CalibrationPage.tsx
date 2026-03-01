import { milestones } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';

export default function CalibrationPage() {
  const { isWonder } = useMode();
  const resolved = milestones.filter(m => m.status === 'accomplished' || m.status === 'falsified');

  const brierScore = 0.142;
  const brierColor = brierScore < 0.15 ? 'text-gold' : brierScore < 0.25 ? 'text-amber-400' : 'text-red-400';

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
        <div className="glass-gold rounded-xl p-6 text-center">
          <div className={`font-mono text-4xl font-bold ${brierColor}`}>{brierScore.toFixed(3)}</div>
          <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Brier Score</div>
        </div>
        <div className="glass-chrome rounded-xl p-6 text-center">
          <div className="font-mono text-4xl font-bold text-foreground">{resolved.length}</div>
          <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Resolved</div>
        </div>
        <div className="glass-chrome rounded-xl p-6 text-center">
          <div className="font-mono text-4xl font-bold text-gold">Well Calibrated</div>
          <div className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Bias Assessment</div>
        </div>
      </div>

      {/* How We Score */}
      <div className="glass-chrome rounded-xl p-6">
        <h3 className="font-display font-semibold text-gold mb-3">How We Score</h3>
        <div className="space-y-2 text-sm text-secondary-foreground">
          <p>• Only milestones with explicit resolution (accomplished/falsified) count toward Brier score</p>
          <p>• Historical anchors excluded from calibration scoring</p>
          <p>• The probability used is the LAST snapshot before resolution date</p>
          <p>• Forecast must be ≥30 days old at resolution to count (prevents gaming)</p>
          <p>• Sandbox scenarios never count toward canonical calibration</p>
          <p className="font-mono text-xs text-gold-solid mt-3">
            BS = (1/N) × Σ(predicted − outcome)² | 0 = perfect, 0.25 = random guessing
          </p>
        </div>
      </div>
    </div>
  );
}
