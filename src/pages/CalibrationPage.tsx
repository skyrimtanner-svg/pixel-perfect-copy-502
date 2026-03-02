import { milestones } from '@/data/milestones';
import { useMode } from '@/contexts/ModeContext';
import { motion } from 'framer-motion';
import { Award, Target, CheckCircle2, TrendingDown, Sparkles, Star } from 'lucide-react';
import { glassPanelGold, glassPanelChrome, glassInner, specularReflection, goldChromeLine, chromeTopLine } from '@/lib/glass-styles';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

const chromeGradientStyle = {
  background: 'linear-gradient(135deg, hsl(220, 10%, 50%), hsl(220, 14%, 78%), hsl(220, 16%, 94%), hsl(220, 14%, 82%), hsl(220, 10%, 58%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

export default function CalibrationPage() {
  const { isWonder } = useMode();
  const resolved = milestones.filter(m => m.status === 'accomplished' || m.status === 'falsified');
  const brierScore = 0.142;

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
        {/* Brier Score — Hero Gold Card with heavy metallic frame */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden shine-sweep"
          style={{
            ...glassPanelGold,
            border: '1px solid hsla(43, 96%, 56%, 0.35)',
            boxShadow: [
              'inset 0 1px 0 hsla(48, 100%, 85%, 0.2)',
              'inset 0 -1px 0 hsla(38, 88%, 20%, 0.6)',
              'inset 1px 0 0 hsla(48, 100%, 80%, 0.08)',
              'inset -1px 0 0 hsla(48, 100%, 80%, 0.08)',
              '0 0 60px -12px hsla(43, 96%, 56%, 0.25)',
              '0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
            ].join(', '),
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -3 }}
        >
          {/* Double gold chrome lines */}
          <div className="absolute top-0 left-3 right-3 h-px" style={goldChromeLine} />
          <div className="absolute bottom-0 left-3 right-3 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.12), transparent)',
          }} />
          {/* Left/right chrome bevels */}
          <div className="absolute top-3 bottom-3 left-0 w-px" style={{
            background: 'linear-gradient(180deg, hsla(48, 100%, 80%, 0.12), hsla(43, 96%, 56%, 0.06), hsla(48, 100%, 80%, 0.12))',
          }} />
          <div className="absolute top-3 bottom-3 right-0 w-px" style={{
            background: 'linear-gradient(180deg, hsla(48, 100%, 80%, 0.08), hsla(43, 96%, 56%, 0.04), hsla(48, 100%, 80%, 0.08))',
          }} />
          <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-xl" style={{
            background: 'linear-gradient(180deg, hsla(48, 100%, 90%, 0.08) 0%, hsla(43, 96%, 56%, 0.02) 50%, transparent 100%)',
            pointerEvents: 'none',
          }} />
          <TrendingDown className="w-5 h-5 mx-auto mb-2 relative z-10" style={{
            color: 'hsl(43, 96%, 56%)',
            filter: 'drop-shadow(0 0 10px hsla(43, 96%, 56%, 0.7)) drop-shadow(0 0 4px hsla(190, 100%, 50%, 0.3))',
          }} />
          <div
            className="font-mono text-4xl font-bold tabular-nums relative z-10"
            style={{
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 20px hsla(43, 96%, 56%, 0.5)) drop-shadow(0 2px 0 hsla(40, 90%, 28%, 0.85))',
            }}
          >
            {brierScore.toFixed(3)}
          </div>
          <div className="text-[9px] mt-2 uppercase tracking-[0.15em] font-semibold font-mono relative z-10" style={{
            ...chromeGradientStyle,
          }}>Brier Score</div>
        </motion.div>

        {/* Resolved — Chrome Card with metallic frame */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden chrome-sweep"
          style={{
            ...glassPanelChrome,
            border: '1px solid hsla(220, 14%, 70%, 0.2)',
            boxShadow: [
              'inset 0 1px 0 hsla(220, 16%, 95%, 0.12)',
              'inset 0 -1px 0 hsla(232, 30%, 2%, 0.5)',
              'inset 1px 0 0 hsla(220, 14%, 88%, 0.05)',
              'inset -1px 0 0 hsla(220, 14%, 88%, 0.05)',
              '0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
            ].join(', '),
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -3 }}
        >
          <div className="absolute top-0 left-3 right-3 h-px" style={chromeTopLine} />
          <div className="absolute bottom-0 left-3 right-3 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.06), transparent)',
          }} />
          <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-xl" style={specularReflection} />
          <CheckCircle2 className="w-5 h-5 mx-auto mb-2 relative z-10" style={{
            color: 'hsl(220, 14%, 78%)',
            filter: 'drop-shadow(0 0 8px hsla(220, 14%, 75%, 0.4))',
          }} />
          <div className="font-mono text-4xl font-bold tabular-nums relative z-10" style={{
            ...chromeGradientStyle,
            filter: 'drop-shadow(0 2px 0 hsla(220, 10%, 25%, 0.7))',
          }}>{resolved.length}</div>
          <div className="text-[9px] mt-2 uppercase tracking-[0.15em] font-semibold font-mono relative z-10" style={chromeGradientStyle}>Resolved</div>
        </motion.div>

        {/* Calibration Badge — Gold with heavy particles */}
        <motion.div
          className="rounded-xl p-5 text-center relative overflow-hidden shine-sweep"
          style={{
            ...glassPanelGold,
            border: '1px solid hsla(43, 96%, 56%, 0.35)',
            boxShadow: [
              'inset 0 1px 0 hsla(48, 100%, 85%, 0.2)',
              'inset 0 -1px 0 hsla(38, 88%, 20%, 0.6)',
              'inset 1px 0 0 hsla(48, 100%, 80%, 0.08)',
              'inset -1px 0 0 hsla(48, 100%, 80%, 0.08)',
              '0 0 60px -12px hsla(43, 96%, 56%, 0.25)',
              '0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
            ].join(', '),
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -3 }}
        >
          <div className="absolute top-0 left-3 right-3 h-px" style={goldChromeLine} />
          <div className="absolute bottom-0 left-3 right-3 h-px" style={{
            background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.12), transparent)',
          }} />
          <div className="absolute top-0 left-0 right-0 h-[50%] rounded-t-xl" style={{
            background: 'linear-gradient(180deg, hsla(48, 100%, 90%, 0.08) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />
          
          {/* Gold celebration particles — 5 total */}
          <motion.div
            className="absolute top-2 right-3"
            animate={{ rotate: [0, 20, -15, 0], y: [0, -4, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-4 h-4" style={{
              color: 'hsl(43, 96%, 56%)',
              filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.6))',
              opacity: 0.55,
            }} />
          </motion.div>
          <motion.div
            className="absolute bottom-3 left-4"
            animate={{ rotate: [0, -12, 18, 0], y: [0, 3, 0], scale: [0.8, 1.05, 0.8] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <Sparkles className="w-3 h-3" style={{
              color: 'hsl(48, 100%, 70%)',
              filter: 'drop-shadow(0 0 5px hsla(48, 100%, 70%, 0.5))',
              opacity: 0.4,
            }} />
          </motion.div>
          <motion.div
            className="absolute top-4 left-3"
            animate={{ rotate: [0, 8, -12, 0], scale: [0.7, 0.9, 0.7] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <Star className="w-2.5 h-2.5" style={{
              color: 'hsl(43, 96%, 56%)',
              filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.5))',
              opacity: 0.3,
            }} />
          </motion.div>
          <motion.div
            className="absolute bottom-5 right-5"
            animate={{ rotate: [0, -6, 10, 0], y: [0, -2, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          >
            <Star className="w-2 h-2" style={{
              color: 'hsl(48, 100%, 74%)',
              filter: 'drop-shadow(0 0 3px hsla(48, 100%, 70%, 0.4))',
              opacity: 0.25,
            }} />
          </motion.div>
          <motion.div
            className="absolute top-6 right-8"
            animate={{ scale: [0.6, 0.85, 0.6], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          >
            <Sparkles className="w-2.5 h-2.5" style={{
              color: 'hsl(43, 96%, 60%)',
              filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.4))',
            }} />
          </motion.div>

          <div className="flex items-center justify-center gap-2.5 relative z-10">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Award className="w-8 h-8" style={{
                color: 'hsl(43, 96%, 56%)',
                filter: 'drop-shadow(0 0 14px hsla(43, 96%, 56%, 0.7)) drop-shadow(0 0 5px hsla(190, 100%, 50%, 0.3)) drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.6))',
              }} />
            </motion.div>
            <span className="font-display text-lg font-bold" style={{
              ...goldGradientStyle,
              filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.3)) drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.6))',
            }}>Well Calibrated</span>
          </div>
          <div className="text-[9px] mt-2 uppercase tracking-[0.15em] font-semibold font-mono relative z-10" style={chromeGradientStyle}>Bias Assessment</div>
        </motion.div>
      </div>

      {/* Score range indicator — metallic gradient edges */}
      <motion.div
        className="rounded-xl p-4 mb-6 relative overflow-hidden"
        style={{
          ...glassPanelChrome,
          border: '1px solid hsla(220, 14%, 70%, 0.18)',
          boxShadow: [
            'inset 0 1px 0 hsla(220, 16%, 95%, 0.1)',
            'inset 0 -1px 0 hsla(232, 30%, 2%, 0.5)',
            '0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
          ].join(', '),
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="absolute top-0 left-6 right-6 h-px" style={chromeTopLine} />
        <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl" style={specularReflection} />
        <div className="flex items-center gap-3 mb-2.5 relative z-10">
          <Target className="w-3.5 h-3.5" style={{
            color: 'hsl(220, 14%, 70%)',
            filter: 'drop-shadow(0 0 4px hsla(220, 14%, 70%, 0.3))',
          }} />
          <span className="text-[10px] uppercase tracking-[0.12em] font-semibold font-mono" style={chromeGradientStyle}>Brier Score Range</span>
        </div>
        {/* Range bar with glowing metallic gradient edges */}
        <div className="relative h-7 rounded-full overflow-hidden" style={{
          background: 'rgba(8, 10, 28, 0.7)',
          border: '1px solid hsla(220, 14%, 70%, 0.12)',
          boxShadow: [
            'inset 0 2px 4px hsla(232, 30%, 2%, 0.5)',
            'inset 0 1px 0 hsla(220, 16%, 95%, 0.04)',
            '0 1px 0 hsla(220, 16%, 95%, 0.03)',
          ].join(', '),
        }}>
          {/* Gradient fill */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'linear-gradient(90deg, hsla(155, 82%, 48%, 0.4), hsla(155, 82%, 48%, 0.2) 25%, hsla(43, 96%, 56%, 0.3) 50%, hsla(36, 100%, 56%, 0.25) 72%, hsla(0, 72%, 55%, 0.4))',
          }} />
          {/* Specular top edge on bar */}
          <div className="absolute inset-x-0 top-0 h-[40%] rounded-t-full" style={{
            background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.08), transparent)',
            pointerEvents: 'none',
          }} />
          {/* Metallic edge glows */}
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-full" style={{
            background: 'linear-gradient(180deg, hsla(155, 82%, 70%, 0.2), hsla(155, 82%, 48%, 0.3), hsla(155, 82%, 70%, 0.2))',
            boxShadow: '0 0 8px hsla(155, 82%, 48%, 0.3)',
          }} />
          <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-full" style={{
            background: 'linear-gradient(180deg, hsla(0, 72%, 70%, 0.2), hsla(0, 72%, 55%, 0.3), hsla(0, 72%, 70%, 0.2))',
            boxShadow: '0 0 8px hsla(0, 72%, 55%, 0.3)',
          }} />
          {/* Score indicator needle */}
          <motion.div
            className="absolute top-0 h-full w-2 rounded-full"
            style={{
              left: `${(brierScore / 0.25) * 100}%`,
              background: 'linear-gradient(180deg, hsl(50, 100%, 90%), hsl(48, 100%, 80%), hsl(43, 96%, 56%), hsl(40, 90%, 40%))',
              boxShadow: '0 0 16px hsla(43, 96%, 56%, 0.85), 0 0 6px hsla(43, 96%, 56%, 1), 0 0 32px -4px hsla(43, 96%, 56%, 0.5), inset 0 1px 0 hsla(48, 100%, 90%, 0.5)',
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2.5 font-mono text-[9px] tabular-nums relative z-10">
          <span style={{
            color: 'hsl(155, 82%, 55%)',
            textShadow: '0 0 8px hsla(155, 82%, 48%, 0.35)',
          }}>0 perfect</span>
          <span className="font-bold text-[10px]" style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.35)) drop-shadow(0 1px 0 hsla(40, 90%, 28%, 0.5))',
          }}>{brierScore.toFixed(3)}</span>
          <span style={{
            color: 'hsl(0, 72%, 58%)',
            textShadow: '0 0 8px hsla(0, 72%, 55%, 0.35)',
          }}>0.25 random</span>
        </div>
      </motion.div>

      {/* How We Score */}
      <motion.div
        className="rounded-xl p-5 relative overflow-hidden"
        style={{
          ...glassPanelChrome,
          border: '1px solid hsla(220, 14%, 70%, 0.18)',
          boxShadow: [
            'inset 0 1px 0 hsla(220, 16%, 95%, 0.1)',
            'inset 0 -1px 0 hsla(232, 30%, 2%, 0.5)',
            '0 8px 36px -8px hsla(232, 30%, 2%, 0.75)',
          ].join(', '),
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="absolute top-0 left-6 right-6 h-px" style={chromeTopLine} />
        <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl" style={specularReflection} />
        <h3 className="font-display font-semibold text-sm mb-3 relative z-10" style={{
          ...goldGradientStyle,
          filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.2))',
        }}>
          {isWonder ? '🎯 How We Keep Score' : 'Scoring Methodology'}
        </h3>
        <div className={`space-y-2.5 leading-relaxed relative z-10 ${isWonder ? 'text-[13px] text-secondary-foreground' : 'text-[12px] font-mono'}`}>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'Only milestones that have actually happened (or been disproven) count toward our accuracy score'
              : 'Only resolved milestones (accomplished/falsified) count toward BS'}
          </p>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'Historical anchors (things from centuries ago) don\'t count — that would be too easy!'
              : 'Historical anchors excluded from calibration'}
          </p>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'We use the last probability snapshot before the milestone was resolved'
              : 'LAST snapshot before resolution date used'}
          </p>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'Forecasts must be at least 30 days old — no last-minute cheating allowed!'
              : <>Forecast ≥<span className="text-gold-num tabular-nums" style={{ WebkitTextFillColor: 'hsl(43, 82%, 60%)' }}>30</span>d at resolution (anti-gaming)</>}
          </p>
          <p className="flex items-start gap-2.5" style={!isWonder ? chromeGradientStyle : {}}>
            <span style={{ color: 'hsl(43, 82%, 55%)', WebkitTextFillColor: 'hsl(43, 82%, 55%)' }}>•</span>
            {isWonder
              ? 'Sandbox experiments never count toward our real calibration — only the real deal!'
              : 'Sandbox scenarios excluded from canonical calibration'}
          </p>
          <div
            className="font-mono text-xs mt-4 px-4 py-3 rounded-lg tabular-nums relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.08), rgba(8, 10, 28, 0.85))',
              border: '1px solid hsla(43, 96%, 56%, 0.22)',
              boxShadow: [
                'inset 0 1px 0 hsla(43, 96%, 56%, 0.1)',
                'inset 0 -1px 0 hsla(232, 30%, 2%, 0.45)',
                '0 0 24px -8px hsla(43, 96%, 56%, 0.12)',
              ].join(', '),
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              color: 'hsl(43, 82%, 60%)',
              textShadow: '0 0 10px hsla(43, 96%, 56%, 0.25)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
            <span className="relative z-10">
              BS = (<span style={{ color: 'hsl(43, 96%, 56%)' }}>1</span>/N) × Σ(predicted − outcome)² | <span style={{ color: 'hsl(43, 96%, 56%)' }}>0</span> = perfect, <span style={{ color: 'hsl(43, 96%, 56%)' }}>0.25</span> = random
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
