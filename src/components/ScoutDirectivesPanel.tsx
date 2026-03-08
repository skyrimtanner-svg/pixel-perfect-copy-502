import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileCode2, Save, Loader2 } from 'lucide-react';
import { useScoutDirectives } from '@/hooks/useScoutDirectives';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const goldGradientStyle = {
  background: 'linear-gradient(135deg, hsl(38, 88%, 34%), hsl(43, 96%, 54%), hsl(48, 100%, 74%), hsl(50, 100%, 86%), hsl(48, 100%, 70%), hsl(43, 96%, 52%))',
  backgroundSize: '200% 100%',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

const keyLabels: Record<string, string> = {
  search_focus: '🔍 Search Focus',
  scoring_weights: '⚖️ Scoring Weights',
  auto_commit_rules: '⚡ Auto-Commit Rules',
  domain_priorities: '🌐 Domain Priorities',
};

export function ScoutDirectivesPanel() {
  const { directives, loading, saving, updateDirective } = useScoutDirectives();
  const { isAdmin } = useAuth();
  const { isWonder } = useMode();
  const [expanded, setExpanded] = useState(false);
  const [editState, setEditState] = useState<Record<string, string>>({});

  if (!isAdmin) return null;

  const handleEdit = (key: string, value: string) => {
    setEditState(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    const value = editState[key];
    if (value !== undefined) {
      await updateDirective(key, value);
      setEditState(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="mb-4 rounded-xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, hsla(268, 60%, 24%, 0.04), hsla(43, 96%, 56%, 0.03), hsla(192, 100%, 52%, 0.02))',
        border: '1px solid hsla(43, 96%, 56%, 0.1)',
        backdropFilter: 'blur(16px)',
      }}
      aria-label="Scout Directives — meta-programming configuration"
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-4 py-2.5 flex items-center gap-3 text-left group"
      >
        <FileCode2 className="w-3.5 h-3.5" style={{
          color: 'hsl(43, 96%, 56%)',
          filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.4))',
        }} />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono font-semibold" style={{
            ...goldGradientStyle,
            filter: 'drop-shadow(0 0 4px hsla(43, 96%, 56%, 0.15))',
          }}>
            {isWonder ? '📜 Scout Directives' : 'SCOUT DIRECTIVES'}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground ml-2">
            {loading ? 'loading…' : `${directives.length} active directives`}
          </span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                directives.map(d => {
                  const isDirty = editState[d.key] !== undefined && editState[d.key] !== d.value;
                  const isSaving = saving === d.key;

                  return (
                    <div key={d.id} className="rounded-lg p-3" style={{
                      background: 'hsla(232, 26%, 6%, 0.5)',
                      border: '1px solid hsla(220, 12%, 70%, 0.08)',
                    }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono font-semibold" style={{ color: 'hsl(43, 96%, 56%)' }}>
                          {keyLabels[d.key] || d.key}
                        </span>
                        {isDirty && (
                          <Button
                            size="sm"
                            onClick={() => handleSave(d.key)}
                            disabled={isSaving}
                            className="h-6 px-2 text-[10px] font-mono"
                            style={{
                              background: 'hsla(43, 96%, 56%, 0.12)',
                              border: '1px solid hsla(43, 96%, 56%, 0.25)',
                              color: 'hsl(43, 96%, 56%)',
                            }}
                          >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Save
                          </Button>
                        )}
                      </div>
                      {d.description && (
                        <p className="text-[9px] font-mono text-muted-foreground mb-2">{d.description}</p>
                      )}
                      <Textarea
                        value={editState[d.key] ?? d.value}
                        onChange={e => handleEdit(d.key, e.target.value)}
                        className="font-mono text-[11px] min-h-[100px] resize-y"
                        style={{
                          background: 'hsla(232, 26%, 4%, 0.6)',
                          border: '1px solid hsla(220, 12%, 70%, 0.1)',
                          color: 'hsl(218, 15%, 75%)',
                        }}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
