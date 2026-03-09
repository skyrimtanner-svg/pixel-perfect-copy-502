import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, X, CheckCircle, ArrowRight, Zap, Shield, Search, BarChart3, Mail, Twitter, Github, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

type WaitlistResult = { spotNumber: number; isExisting: boolean } | null;

export default function LandingPage() {
  const [heroEmail, setHeroEmail] = useState('');
  const [ctaEmail, setCtaEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WaitlistResult>(null);
  const navigate = useNavigate();

  const handleWaitlist = async (email: string, setEmail: (v: string) => void) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: 'Please enter a valid email', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Check if already on waitlist
      const { data: existing } = await supabase
        .from('waitlist')
        .select('spot_number')
        .eq('email', trimmed)
        .maybeSingle();

      if (existing) {
        setResult({ spotNumber: existing.spot_number, isExisting: true });
        toast({ title: `You're already on the list! Spot #${existing.spot_number}` });
      } else {
        const spotNumber = Math.floor(Math.random() * 401) + 100;
        const { error } = await supabase
          .from('waitlist')
          .insert({ email: trimmed, spot_number: spotNumber });

        if (error) throw error;
        setResult({ spotNumber, isExisting: false });
        setEmail('');
        toast({ title: `You're on the list! Spot #${spotNumber}` });
      }
    } catch (err: any) {
      toast({ title: 'Something went wrong', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">

      {/* ════════ NAV ════════ */}
      <nav className="sticky top-0 z-50 border-b border-border/40" style={{
        background: 'hsla(232, 30%, 3%, 0.92)',
        backdropFilter: 'blur(24px)',
      }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
              background: 'linear-gradient(145deg, hsla(192,95%,50%,0.15), hsla(232,26%,8%,0.9))',
              border: '1px solid hsla(192,95%,50%,0.3)',
            }}>
              <Eye className="w-4 h-4" style={{ color: 'hsl(192,95%,50%)' }} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight" style={{
              background: 'linear-gradient(135deg, hsl(192,95%,50%), hsl(192,80%,70%))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>ÆTH Observatory</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#problem" className="hover:text-foreground transition-colors">Problem</a>
            <a href="#solution" className="hover:text-foreground transition-colors">Solution</a>
            <a href="#how" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <Button size="sm" onClick={() => navigate('/auth')} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Sign In
          </Button>
        </div>
      </nav>

      {/* ════════ HERO ════════ */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsla(192,95%,50%,0.08) 0%, transparent 70%)',
        }} />
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28 text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-8"
          >
            <Zap className="w-3 h-3" /> Bayesian Forecasting Platform
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.08] mb-6"
          >
            What Would Change{' '}
            <span style={{
              background: 'linear-gradient(135deg, hsl(192,95%,50%), hsl(192,80%,70%))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>My Mind?</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Pre-commit to your evidence triggers. We'll hold you accountable.
          </motion.p>

          <motion.form initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto mb-6"
            onSubmit={(e) => { e.preventDefault(); handleWaitlist(heroEmail); }}
          >
            <Input
              type="email" placeholder="you@research.org" value={heroEmail}
              onChange={(e) => setHeroEmail(e.target.value)}
              className="h-12 bg-secondary border-border/60 text-foreground placeholder:text-muted-foreground"
            />
            <Button type="submit" size="lg" className="w-full sm:w-auto whitespace-nowrap h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              Join Waitlist — 50% Off
            </Button>
          </motion.form>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="text-xs text-muted-foreground"
          >
            Join 200+ researchers already forecasting with integrity
          </motion.p>
        </div>
      </section>

      {/* ════════ PROBLEM ════════ */}
      <section id="problem" className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">The Problem with Predictions Today</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Most forecasting is broken. Here's why.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Vibes-Based Predictions', desc: 'Decisions made on gut feeling, not structured evidence. No pre-committed criteria for belief revision.' },
              { title: 'Missing Evidence Trails', desc: 'No audit trail of what evidence was considered, weighted, or ignored. Impossible to learn from mistakes.' },
              { title: 'No Reasoning Integrity', desc: 'Goalpost-shifting is rampant. Without pre-commitment, anyone can rationalize any outcome after the fact.' },
            ].map((card, i) => (
              <motion.div key={card.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} custom={i + 1}
                className="rounded-xl border border-border/60 p-6 bg-card"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{
                  background: 'hsla(0,72%,51%,0.1)', border: '1px solid hsla(0,72%,51%,0.2)',
                }}>
                  <X className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SOLUTION ════════ */}
      <section id="solution" className="py-20 md:py-28 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              <span style={{
                background: 'linear-gradient(135deg, hsl(192,95%,50%), hsl(192,80%,70%))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>What Would Change My Mind</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A structured framework for intellectual honesty. Define your beliefs, pre-commit to evidence thresholds, and let the system hold you accountable.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Define Your Priors', desc: 'State your beliefs as probability estimates with falsification criteria — before seeing new evidence.' },
              { step: '02', title: 'Pre-Commit to Triggers', desc: 'Set specific evidence thresholds that would make you update. No moving goalposts after the fact.' },
              { step: '03', title: 'Track & Calibrate', desc: 'As evidence arrives, the Bayesian engine updates your beliefs transparently. See exactly why things changed.' },
            ].map((item, i) => (
              <motion.div key={item.step} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} custom={i + 1}
                className="relative"
              >
                <span className="font-mono text-5xl font-bold" style={{
                  background: 'linear-gradient(180deg, hsla(192,95%,50%,0.15), transparent)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>{item.step}</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section id="how" className="py-20 md:py-28 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Three phases, fully automated.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: 'Ingest', desc: 'Our Evidence Scout continuously scans research databases, preprints, and news for signals relevant to your milestones.' },
              { icon: BarChart3, title: 'Evaluate', desc: 'Each piece of evidence is scored on credibility, recency, consensus, and criteria match — then fed through a Bayesian engine.' },
              { icon: Shield, title: 'Accountability', desc: 'An immutable Trust Ledger records every update with SHA-256 hashing. Your reasoning is fully auditable, forever.' },
            ].map((item, i) => (
              <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} custom={i + 1}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-5" style={{
                  background: 'linear-gradient(145deg, hsla(192,95%,50%,0.12), hsla(232,26%,8%,0.9))',
                  border: '1px solid hsla(192,95%,50%,0.2)',
                }}>
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ PRICING ════════ */}
      <section id="pricing" className="py-20 md:py-28 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Start free. Scale when you're ready.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: 'Free', price: '$0', period: '/forever', featured: false,
                features: ['5 milestones', 'Basic evidence scoring', 'Community access', '7-day trace history'],
              },
              {
                name: 'Pro', price: '$29', period: '/month', featured: true,
                features: ['Unlimited milestones', 'AI Evidence Scout', 'Full Trust Ledger', 'LP Memo export', 'Priority support'],
              },
              {
                name: 'Enterprise', price: 'Custom', period: '', featured: false,
                features: ['Everything in Pro', 'SSO & team management', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
              },
            ].map((plan, i) => (
              <motion.div key={plan.name} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} custom={i + 1}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.featured
                    ? 'border-primary/40 bg-primary/[0.03] ring-1 ring-primary/20 relative'
                    : 'border-border/60 bg-card'
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-primary text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-display font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.featured ? 'default' : 'outline'}
                  className={plan.featured ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                  onClick={() => navigate('/auth')}
                >
                  {plan.featured ? 'Get Started' : plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FINAL CTA ════════ */}
      <section className="py-20 md:py-28 border-t border-border/30 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 100%, hsla(192,95%,50%,0.06) 0%, transparent 70%)',
        }} />
        <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-display font-bold mb-4">
              Start Forecasting with Integrity
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground mb-8">
              Join researchers who pre-commit to evidence-driven belief updates.
            </motion.p>
            <motion.form variants={fadeUp} custom={2}
              className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
              onSubmit={(e) => { e.preventDefault(); handleWaitlist(ctaEmail); }}
            >
              <Input
                type="email" placeholder="you@research.org" value={ctaEmail}
                onChange={(e) => setCtaEmail(e.target.value)}
                className="h-12 bg-secondary border-border/60 text-foreground placeholder:text-muted-foreground"
              />
              <Button type="submit" size="lg" className="w-full sm:w-auto whitespace-nowrap h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                Join Waitlist
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="border-t border-border/30 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-primary" />
                <span className="font-display font-bold text-sm" style={{
                  background: 'linear-gradient(135deg, hsl(192,95%,50%), hsl(192,80%,70%))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>ÆTH</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">See Why the Future Changes</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#solution" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-border/30 gap-4">
            <p className="text-xs text-muted-foreground">© 2026 ÆTH Observatory. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Github className="w-4 h-4" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin className="w-4 h-4" /></a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Mail className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
