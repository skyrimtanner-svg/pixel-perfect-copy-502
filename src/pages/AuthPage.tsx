import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Mail, Loader2, CheckCircle, Sparkles, Lock } from 'lucide-react';
import { glassPanelStrong, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';

type AuthMode = 'magic-link' | 'sign-in' | 'sign-up';

const inputStyle = {
  background: 'hsla(232, 26%, 8%, 0.8)',
  border: '1px solid hsla(220, 12%, 70%, 0.12)',
};

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (!authLoading && user) return null;

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setSent(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setError(error.message);
    }
    setGoogleLoading(false);
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    setError('');
    const { error } = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      setError(error.message);
    }
    setAppleLoading(false);
  };

  const handleSubmit =
    mode === 'magic-link' ? handleMagicLink :
    mode === 'sign-in' ? handleSignIn :
    handleSignUp;

  return (
    <div className="min-h-screen flex items-center justify-center nebula-bg stars-bg relative">
      <div className="constellation-particles" />
      <div className="constellation-particles-2" />

      <motion.div
        className="w-full max-w-md mx-4 rounded-2xl p-8 relative z-10"
        style={glassPanelStrong}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute top-0 left-6 right-6 h-px" style={goldChromeLine} />
        <div className="absolute top-0 left-0 right-0 h-[30%] rounded-t-2xl pointer-events-none" style={specularReflection} />

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(145deg, hsla(43, 96%, 56%, 0.14), hsla(230, 22%, 8%, 0.9), hsla(190, 100%, 50%, 0.08))',
              border: '1px solid hsla(43, 96%, 56%, 0.3)',
              boxShadow: '0 0 32px -4px hsla(43, 96%, 56%, 0.25), inset 0 1px 0 hsla(48, 100%, 80%, 0.15)',
            }}
          >
            <Eye className="w-6 h-6" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 8px hsla(43, 96%, 56%, 0.6))' }} />
          </div>
          <h1 className="text-gold font-display font-bold text-2xl tracking-tight">ÆTH Observatory</h1>
          <p className="text-muted-foreground text-xs mt-2 font-mono tracking-wide">Private Beta Access</p>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              className="text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(155, 82%, 48%)' }} />
              <h2 className="font-display font-semibold text-foreground text-lg mb-2">Check your inbox</h2>
              <p className="text-muted-foreground text-sm">
                {mode === 'sign-up'
                  ? <>We sent a confirmation email to <span className="text-foreground font-medium">{email}</span>. Verify your email to sign in.</>
                  : <>We sent a magic link to <span className="text-foreground font-medium">{email}</span>. Click it to sign in.</>
                }
              </p>
              <button
                onClick={() => switchMode('sign-in')}
                className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
              >
                ← Back to sign in
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email field — always shown */}
                <div>
                  <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase mb-2 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={255}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Password field — sign-in & sign-up */}
                {(mode === 'sign-in' || mode === 'sign-up') && (
                  <div>
                    <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase mb-2 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        maxLength={128}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}

                {/* Confirm password — sign-up only */}
                {mode === 'sign-up' && (
                  <div>
                    <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase mb-2 block">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        maxLength={128}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-xs" style={{ color: 'hsl(0, 72%, 55%)' }}>{error}</p>
                )}

                {/* Forgot password link */}
                {mode === 'sign-in' && (
                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-mono text-muted-foreground hover:text-gold transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg text-sm font-semibold btn-gold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === 'magic-link' ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Send Magic Link
                    </>
                  ) : mode === 'sign-in' ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Sign In
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create Account
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px" style={{ background: 'hsla(220, 12%, 70%, 0.12)' }} />
                  <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px" style={{ background: 'hsla(220, 12%, 70%, 0.12)' }} />
                </div>

                {/* Google sign-in */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-3 transition-all hover:brightness-110 disabled:opacity-60"
                  style={{
                    background: 'hsla(232, 26%, 12%, 0.8)',
                    border: '1px solid hsla(220, 12%, 70%, 0.15)',
                  }}
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span className="text-foreground">Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Apple sign-in */}
                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={appleLoading}
                  className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-3 transition-all hover:brightness-110 disabled:opacity-60"
                  style={{
                    background: 'hsla(232, 26%, 12%, 0.8)',
                    border: '1px solid hsla(220, 12%, 70%, 0.15)',
                  }}
                >
                  {appleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      <span className="text-foreground">Continue with Apple</span>
                    </>
                  )}
                </button>

                {/* Mode switching links */}
                <div className="space-y-2 pt-1">
                  {mode === 'sign-in' && (
                    <>
                      <p className="text-[11px] text-muted-foreground/60 text-center font-mono">
                        <button type="button" onClick={() => switchMode('magic-link')} className="text-muted-foreground hover:text-gold transition-colors underline underline-offset-2">
                          Use magic link instead
                        </button>
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 text-center font-mono">
                        Don't have an account?{' '}
                        <button type="button" onClick={() => switchMode('sign-up')} className="text-muted-foreground hover:text-gold transition-colors underline underline-offset-2">
                          Sign up
                        </button>
                      </p>
                    </>
                  )}
                  {mode === 'sign-up' && (
                    <p className="text-[11px] text-muted-foreground/60 text-center font-mono">
                      Already have an account?{' '}
                      <button type="button" onClick={() => switchMode('sign-in')} className="text-muted-foreground hover:text-gold transition-colors underline underline-offset-2">
                        Sign in
                      </button>
                    </p>
                  )}
                  {mode === 'magic-link' && (
                    <>
                      <p className="text-[10px] text-muted-foreground/60 text-center font-mono">
                        No password needed · Link expires in 1 hour
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 text-center font-mono">
                        <button type="button" onClick={() => switchMode('sign-in')} className="text-muted-foreground hover:text-gold transition-colors underline underline-offset-2">
                          Sign in with password
                        </button>
                      </p>
                    </>
                  )}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
