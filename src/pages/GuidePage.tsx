import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMode } from '@/contexts/ModeContext';
import { logOdds, fromLogOdds, computeContributions } from '@/lib/bayesian';
import { glassPanelStrong, glassInner, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import {
  BookOpen, ChevronRight, ChevronLeft, RotateCcw, Beaker,
  TrendingUp, TrendingDown, Minus, Lightbulb, GraduationCap
} from 'lucide-react';
import { ProbabilityRing } from '@/components/ProbabilityRing';

/* ── Lesson steps ── */
const lessons = [
  {
    id: 'prior',
    title: 'What Is a Prior?',
    wonderTitle: '✦ Where Every Prediction Begins',
    icon: BookOpen,
    color: 'hsl(192, 100%, 52%)',
    body: 'A **prior** is your starting belief about how likely something is before you see any evidence. Set it with the slider below — 50% means total uncertainty.',
    wonderBody: 'Every great question starts with a belief. How likely do you think this milestone is? Slide to set your starting intuition — this is your prior.',
    interactive: 'prior' as const,
  },
  {
    id: 'evidence',
    title: 'Evidence & Composite Scores',
    wonderTitle: '✦ Signals from the World',
    icon: Beaker,
    color: 'hsl(43, 96%, 56%)',
    body: 'Each piece of evidence has four quality dimensions: **credibility**, **recency**, **consensus**, and **criteria match**. Their product is the composite score. Toggle the evidence below and adjust quality sliders to see how they combine.',
    wonderBody: 'Now add evidence — each discovery is scored across four dimensions of quality. Watch how toggling evidence on and off reshapes the probability.',
    interactive: 'evidence' as const,
  },
  {
    id: 'logodds',
    title: 'Log-Odds: The Hidden Math',
    wonderTitle: '✦ The Engine Under the Hood',
    icon: Lightbulb,
    color: 'hsl(268, 90%, 68%)',
    body: 'Log-odds = ln(p / (1-p)). Working in log-odds space makes Bayesian updates additive: each evidence contribution simply adds or subtracts from the total. This is why we show Δ LO — it reveals the true magnitude of each signal.',
    wonderBody: 'The magic of log-odds: instead of multiplying probabilities, we just add. Each piece of evidence pushes the belief up or down — cleanly, transparently, reversibly.',
    interactive: 'logodds' as const,
  },
  {
    id: 'triage',
    title: 'Triage Score: Prioritizing What Matters',
    wonderTitle: '✦ What Deserves Attention Now?',
    icon: GraduationCap,
    color: 'hsl(155, 82%, 48%)',
    body: 'Triage score = |Δ log-odds| × magnitude × (1 / years_away). It balances how much something changed, how impactful it would be, and how soon it might happen. The highest-scored milestones bubble to the top of your queue.',
    wonderBody: 'Not all milestones are equal. Triage score combines how much changed, how important it is, and how soon it arrives — surfacing the futures that need your attention right now.',
    interactive: 'triage' as const,
  },
];

/* ── Sandbox evidence presets ── */
const defaultEvidence = [
  { id: 'ev-1', label: 'Nature paper confirming breakthrough', direction: 'supports' as const, credibility: 0.92, recency: 0.88, consensus: 0.75, criteria_match: 0.90, active: true },
  { id: 'ev-2', label: 'Industry skepticism from IEEE review', direction: 'contradicts' as const, credibility: 0.70, recency: 0.60, consensus: 0.55, criteria_match: 0.65, active: false },
  { id: 'ev-3', label: 'Government R&D budget doubled', direction: 'supports' as const, credibility: 0.80, recency: 0.95, consensus: 0.82, criteria_match: 0.70, active: false },
];

interface SandboxEvidence {
  id: string;
  label: string;
  direction: 'supports' | 'contradicts' | 'ambiguous';
  credibility: number;
  recency: number;
  consensus: number;
  criteria_match: number;
  active: boolean;
}

/* ── Slider sub-component ── */
function QualitySlider({ label, value, onChange, color }: {
  label: string; value: number; onChange: (v: number) => void; color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono w-20 text-muted-foreground">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={e => onChange(Number(e.target.value) / 100)}
        className="flex-1 h-1 accent-current cursor-pointer"
        style={{ accentColor: color }}
      />
      <span className="text-[10px] font-mono tabular-nums w-8 text-right" style={{ color }}>{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

/* ── Main Guide Page ── */
export default function GuidePage() {
  const { isWonder } = useMode();
  const [step, setStep] = useState(0);
  const [prior, setPrior] = useState(0.5);
  const [evidence, setEvidence] = useState<SandboxEvidence[]>(defaultEvidence.map(e => ({ ...e })));
  const [magnitude, setMagnitude] = useState(7);
  const [yearsAway, setYearsAway] = useState(5);

  const lesson = lessons[step];

  const resetSandbox = useCallback(() => {
    setPrior(0.5);
    setEvidence(defaultEvidence.map(e => ({ ...e })));
    setMagnitude(7);
    setYearsAway(5);
  }, []);

  const toggleEvidence = (id: string) => {
    setEvidence(prev => prev.map(e => e.id === id ? { ...e, active: !e.active } : e));
  };

  const updateEvidence = (id: string, field: keyof SandboxEvidence, value: number) => {
    setEvidence(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Compute Bayesian update
  const computation = useMemo(() => {
    const activeEvidence = evidence.filter(e => e.active);
    const inputs = activeEvidence.map(e => ({
      id: e.id,
      direction: e.direction,
      credibility: e.credibility,
      recency: e.recency,
      consensus: e.consensus,
      criteria_match: e.criteria_match,
    }));
    const contributions = computeContributions(inputs);
    const priorLO = logOdds(prior);
    const totalDeltaLO = contributions.reduce((s, c) => s + c.delta_log_odds, 0);
    const posteriorLO = priorLO + totalDeltaLO;
    const posterior = fromLogOdds(posteriorLO);
    const triageScore = Math.abs(totalDeltaLO) * magnitude * (1 / Math.max(yearsAway, 0.5));

    return { priorLO, posteriorLO, totalDeltaLO, posterior, contributions, triageScore };
  }, [prior, evidence, magnitude, yearsAway]);

  const directionIcon = (d: string) => {
    if (d === 'supports') return <TrendingUp size={12} style={{ color: 'hsl(155, 82%, 48%)' }} />;
    if (d === 'contradicts') return <TrendingDown size={12} style={{ color: 'hsl(0, 72%, 55%)' }} />;
    return <Minus size={12} style={{ color: 'hsl(218, 15%, 46%)' }} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <motion.h1
          className={`font-display font-bold ${isWonder ? 'text-gold text-2xl' : 'text-foreground text-xl'}`}
          layout
        >
          {isWonder ? '✦ Observatory Guide' : 'Observatory Guide'}
        </motion.h1>
        <p className={`mt-1 ${isWonder ? 'text-xs text-muted-foreground' : 'text-[10px] font-mono text-chrome'}`}>
          {isWonder
            ? 'Learn by doing — manipulate a sandbox milestone to understand how probabilities evolve.'
            : 'Interactive Bayesian reasoning tutorial | sandbox mode — no data will be saved'}
        </p>
      </div>

      {/* Step indicator bar */}
      <div className="flex items-center gap-1.5 mb-5">
        {lessons.map((l, i) => (
          <button
            key={l.id}
            onClick={() => setStep(i)}
            className="flex-1 h-1.5 rounded-full transition-all duration-400 cursor-pointer"
            style={{
              background: i <= step
                ? `linear-gradient(90deg, ${lessons[Math.max(0, i - 1)]?.color || l.color}, ${l.color})`
                : 'hsla(220, 12%, 70%, 0.1)',
              boxShadow: i <= step ? `0 0 10px ${l.color}40` : 'none',
            }}
            aria-label={`Go to step ${i + 1}: ${l.title}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Lesson content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl p-5 relative overflow-hidden"
              style={glassPanelStrong}
            >
              <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
              <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl pointer-events-none" style={specularReflection} />

              <div className="relative z-10">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{
                    background: `linear-gradient(145deg, ${lesson.color}20, hsla(232, 22%, 8%, 0.9))`,
                    border: `1px solid ${lesson.color}40`,
                    boxShadow: `0 0 20px -4px ${lesson.color}30`,
                  }}
                >
                  <lesson.icon size={18} style={{ color: lesson.color, filter: `drop-shadow(0 0 6px ${lesson.color}80)` }} />
                </div>

                <h2 className="font-display font-bold text-foreground mb-2">
                  {isWonder ? lesson.wonderTitle : lesson.title}
                </h2>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4 whitespace-pre-line">
                  {(isWonder ? lesson.wonderBody : lesson.body).replace(/\*\*(.*?)\*\*/g, '$1')}
                </p>

                <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                  Step {step + 1} of {lessons.length}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={resetSandbox}
              className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              onClick={() => setStep(s => Math.min(lessons.length - 1, s + 1))}
              disabled={step === lessons.length - 1}
              className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right: Interactive sandbox */}
        <div className="lg:col-span-3 space-y-4">
          {/* Live computation display */}
          <div className="rounded-xl p-4 relative overflow-hidden" style={glassPanelStrong}>
            <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
            <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-xl pointer-events-none" style={specularReflection} />

            <div className="relative z-10 flex items-center gap-5">
              <div className="flex flex-col items-center gap-1">
                <ProbabilityRing value={prior} size={52} />
                <span className="text-[9px] font-mono text-muted-foreground">Prior</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full h-px" style={{
                  background: `linear-gradient(90deg, transparent, ${computation.totalDeltaLO >= 0 ? 'hsl(155, 82%, 48%)' : 'hsl(0, 72%, 55%)'}, transparent)`,
                }} />
                <span className="text-xs font-mono font-bold tabular-nums" style={{
                  color: computation.totalDeltaLO >= 0 ? 'hsl(155, 82%, 48%)' : 'hsl(0, 72%, 55%)',
                }}>
                  {computation.totalDeltaLO >= 0 ? '+' : ''}{computation.totalDeltaLO.toFixed(3)} LO
                </span>
                <span className="text-[8px] font-mono text-muted-foreground">
                  {computation.contributions.length} active signal{computation.contributions.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ProbabilityRing posterior={computation.posterior} size={52} />
                <span className="text-[9px] font-mono text-muted-foreground">Posterior</span>
              </div>
            </div>
          </div>

          {/* Prior slider — highlighted in step 0 */}
          <div
            className="rounded-lg p-3 relative overflow-hidden transition-all duration-300"
            style={{
              ...glassInner,
              border: step === 0 ? `1px solid ${lessons[0].color}40` : undefined,
              boxShadow: step === 0 ? `0 0 16px -4px ${lessons[0].color}30` : undefined,
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
            <div className="relative z-10">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-2">Prior Probability</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={99}
                  value={Math.round(prior * 100)}
                  onChange={e => setPrior(Number(e.target.value) / 100)}
                  className="flex-1 h-1.5 cursor-pointer"
                  style={{ accentColor: 'hsl(192, 100%, 52%)' }}
                />
                <span className="text-sm font-mono font-bold tabular-nums w-12 text-right" style={{ color: 'hsl(192, 100%, 52%)' }}>
                  {(prior * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-[8px] font-mono text-muted-foreground/50 mt-1">
                <span>log-odds: {computation.priorLO.toFixed(3)}</span>
                <span>certainty: {prior <= 0.5 ? 'unlikely' : prior >= 0.8 ? 'likely' : 'uncertain'}</span>
              </div>
            </div>
          </div>

          {/* Evidence cards — highlighted in step 1 */}
          <div
            className="rounded-lg p-3 relative overflow-hidden transition-all duration-300"
            style={{
              ...glassInner,
              border: step === 1 ? `1px solid ${lessons[1].color}40` : undefined,
              boxShadow: step === 1 ? `0 0 16px -4px ${lessons[1].color}30` : undefined,
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
            <div className="relative z-10">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-2">Evidence Signals</span>
              <div className="space-y-3">
                {evidence.map(ev => {
                  const contrib = computation.contributions.find(c => c.evidence_id === ev.id);
                  return (
                    <div key={ev.id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleEvidence(ev.id)}
                          className="w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0"
                          style={{
                            borderColor: ev.active ? 'hsl(43, 96%, 56%)' : 'hsla(220, 12%, 70%, 0.2)',
                            background: ev.active ? 'hsla(43, 96%, 56%, 0.15)' : 'transparent',
                          }}
                        >
                          {ev.active && <div className="w-2 h-2 rounded-sm" style={{ background: 'hsl(43, 96%, 56%)' }} />}
                        </button>
                        {directionIcon(ev.direction)}
                        <span className={`text-[10px] font-mono flex-1 ${ev.active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                          {ev.label}
                        </span>
                        {contrib && (
                          <span className="text-[9px] font-mono tabular-nums" style={{
                            color: contrib.delta_log_odds >= 0 ? 'hsl(155, 82%, 48%)' : 'hsl(0, 72%, 55%)',
                          }}>
                            {contrib.delta_log_odds >= 0 ? '+' : ''}{contrib.delta_log_odds.toFixed(3)}
                          </span>
                        )}
                      </div>
                      {ev.active && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-6 space-y-1"
                        >
                          <QualitySlider label="Credibility" value={ev.credibility} onChange={v => updateEvidence(ev.id, 'credibility', v)} color="hsl(192, 100%, 52%)" />
                          <QualitySlider label="Recency" value={ev.recency} onChange={v => updateEvidence(ev.id, 'recency', v)} color="hsl(36, 100%, 56%)" />
                          <QualitySlider label="Consensus" value={ev.consensus} onChange={v => updateEvidence(ev.id, 'consensus', v)} color="hsl(268, 90%, 68%)" />
                          <QualitySlider label="Criteria" value={ev.criteria_match} onChange={v => updateEvidence(ev.id, 'criteria_match', v)} color="hsl(155, 82%, 48%)" />
                          <div className="text-[8px] font-mono text-muted-foreground/60">
                            composite = {(ev.credibility * ev.recency * ev.consensus * ev.criteria_match).toFixed(4)}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Log-odds breakdown — highlighted in step 2 */}
          <div
            className="rounded-lg p-3 relative overflow-hidden transition-all duration-300"
            style={{
              ...glassInner,
              border: step === 2 ? `1px solid ${lessons[2].color}40` : undefined,
              boxShadow: step === 2 ? `0 0 16px -4px ${lessons[2].color}30` : undefined,
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
            <div className="relative z-10">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-2">Log-Odds Breakdown</span>
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prior LO</span>
                  <span className="tabular-nums" style={{ color: 'hsl(192, 100%, 52%)' }}>{computation.priorLO.toFixed(4)}</span>
                </div>
                {computation.contributions.map(c => {
                  const ev = evidence.find(e => e.id === c.evidence_id);
                  return (
                    <div key={c.evidence_id} className="flex justify-between">
                      <span className="text-muted-foreground truncate max-w-[60%]">{ev?.label}</span>
                      <span className="tabular-nums" style={{
                        color: c.delta_log_odds >= 0 ? 'hsl(155, 82%, 48%)' : 'hsl(0, 72%, 55%)',
                      }}>
                        {c.delta_log_odds >= 0 ? '+' : ''}{c.delta_log_odds.toFixed(4)}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t pt-1.5 flex justify-between font-bold" style={{ borderColor: 'hsla(220, 12%, 70%, 0.1)' }}>
                  <span className="text-muted-foreground">Posterior LO</span>
                  <span className="tabular-nums" style={{ color: 'hsl(43, 96%, 56%)' }}>{computation.posteriorLO.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">→ Posterior P</span>
                  <span className="tabular-nums" style={{ color: 'hsl(43, 96%, 56%)' }}>{(computation.posterior * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Triage score — highlighted in step 3 */}
          <div
            className="rounded-lg p-3 relative overflow-hidden transition-all duration-300"
            style={{
              ...glassInner,
              border: step === 3 ? `1px solid ${lessons[3].color}40` : undefined,
              boxShadow: step === 3 ? `0 0 16px -4px ${lessons[3].color}30` : undefined,
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg pointer-events-none" style={specularReflection} />
            <div className="relative z-10">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-2">Triage Score Calculator</span>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <span className="text-[8px] font-mono text-muted-foreground block mb-1">Magnitude (1-10)</span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={magnitude}
                    onChange={e => setMagnitude(Number(e.target.value))}
                    className="w-full h-1.5 cursor-pointer"
                    style={{ accentColor: 'hsl(155, 82%, 48%)' }}
                  />
                  <span className="text-[10px] font-mono tabular-nums" style={{ color: 'hsl(155, 82%, 48%)' }}>{magnitude}</span>
                </div>
                <div>
                  <span className="text-[8px] font-mono text-muted-foreground block mb-1">Years Away</span>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={yearsAway}
                    onChange={e => setYearsAway(Number(e.target.value))}
                    className="w-full h-1.5 cursor-pointer"
                    style={{ accentColor: 'hsl(36, 100%, 56%)' }}
                  />
                  <span className="text-[10px] font-mono tabular-nums" style={{ color: 'hsl(36, 100%, 56%)' }}>{yearsAway}y</span>
                </div>
              </div>
              <div className="font-mono text-xs flex items-center justify-between p-2 rounded" style={{
                background: 'hsla(43, 96%, 56%, 0.06)',
                border: '1px solid hsla(43, 96%, 56%, 0.12)',
              }}>
                <span className="text-muted-foreground">|Δ LO| × mag × (1/yr)</span>
                <span className="font-bold tabular-nums" style={{
                  color: 'hsl(43, 96%, 56%)',
                  textShadow: '0 0 8px hsla(43, 96%, 56%, 0.3)',
                }}>
                  {computation.triageScore.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
