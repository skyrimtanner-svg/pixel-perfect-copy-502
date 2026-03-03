import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Eye, Mail, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { glassPanelStrong, specularReflection, goldChromeLine } from '@/lib/glass-styles';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (!authLoading && user) {
    return <Navigate to="/" replace />;
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

        {sent ? (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(155, 82%, 48%)' }} />
            <h2 className="font-display font-semibold text-foreground text-lg mb-2">Check your inbox</h2>
            <p className="text-muted-foreground text-sm">
              We sent a magic link to <span className="text-foreground font-medium">{email}</span>. Click it to sign in.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground tracking-wider uppercase mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{
                    background: 'hsla(232, 26%, 8%, 0.8)',
                    border: '1px solid hsla(220, 12%, 70%, 0.12)',
                  }}
                />
              </div>
            </div>

            {error && (
              <p className="text-xs" style={{ color: 'hsl(0, 72%, 55%)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold btn-gold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Send Magic Link
                </>
              )}
            </button>

            <p className="text-[10px] text-muted-foreground/60 text-center font-mono">
              No password needed · Link expires in 1 hour
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}

