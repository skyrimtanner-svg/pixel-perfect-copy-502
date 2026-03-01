import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div
        className="text-center rounded-2xl p-12 relative overflow-hidden max-w-md mx-auto"
        style={{
          background: 'linear-gradient(168deg, hsla(232, 26%, 9%, 0.82), hsla(232, 22%, 5%, 0.72))',
          border: '1px solid hsla(220, 12%, 70%, 0.12)',
          backdropFilter: 'blur(32px)',
          boxShadow: [
            'inset 0 1px 0 hsla(220, 16%, 95%, 0.06)',
            'inset 0 -1px 0 hsla(232, 30%, 2%, 0.5)',
            '0 8px 40px -12px hsla(232, 30%, 2%, 0.8)',
          ].join(', '),
        }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top gold rim */}
        <div className="absolute top-0 left-6 right-6 h-px" style={{
          background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.2), transparent)',
        }} />

        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Compass
            className="w-12 h-12 mx-auto mb-4"
            style={{
              color: 'hsl(43, 96%, 56%)',
              filter: 'drop-shadow(0 0 12px hsla(43, 96%, 56%, 0.4))',
            }}
          />
        </motion.div>

        <h1
          className="mb-3 text-5xl font-bold font-mono tabular-nums"
          style={{
            background: 'linear-gradient(135deg, hsl(38, 88%, 38%), hsl(43, 96%, 56%), hsl(48, 100%, 72%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 12px hsla(43, 96%, 56%, 0.3))',
          }}
        >
          404
        </h1>
        <p className="mb-2 text-sm font-display font-semibold text-foreground">Signal Not Found</p>
        <p className="mb-6 text-xs text-muted-foreground font-mono">
          Route <span className="text-primary">{location.pathname}</span> does not exist in this observatory
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold btn-gold shine-sweep"
        >
          Return to Triage
        </a>
      </motion.div>
    </div>
  );
};

export default NotFound;
