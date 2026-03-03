import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Eye, Lock, Loader2, CheckCircle } from 'lucide-react';
import { glassPanelStrong, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { useNavigate } from 'react-router-dom';

const inputStyle = {
  background: 'hsla(232, 26%, 8%, 0.8)',
  border: '1px solid hsla(220, 12%, 70%, 0.12)',
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from the URL hash token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Also check the URL hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    }
    setLoading(false);
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center nebula-bg stars-bg relative">
        <div className="constellation-particles" />
        <motion.div
          className="w-full max-w-md mx-4 rounded-2xl p-8 relative z-10 text-center"
          style={glassPanelStrong}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-muted-foreground text-sm">Loading recovery session…</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto mt-3" style={{ color: 'hsl(43, 96%, 56%)' }} />
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-gold font-display font-bold text-xl tracking-tight">Set New Password</h1>
        </div>

        {success ? (
          <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(155, 82%, 48%)' }} />
            <h2 className="font-display font-semibold text-foreground text-lg mb-2">Password updated!</h2>
            <p className="text-muted-foreground text-sm">Redirecting to the observatory…</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase mb-2 block">New Password</label>
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

            {error && <p className="text-xs" style={{ color: 'hsl(0, 72%, 55%)' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold btn-gold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
