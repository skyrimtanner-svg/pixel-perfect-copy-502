import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMode } from '@/contexts/ModeContext';
import { glassPanel, glassInner, specularReflection } from '@/lib/glass-styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, MessageCircle, Link2, ChevronDown, ChevronUp } from 'lucide-react';

interface SocraticTopic {
  id: string;
  milestone_id: string | null;
  topic_title: string;
  socratic_question: string;
  cynical_lens: string;
  created_at: string;
}

interface EvidenceItem {
  id: string;
  source: string;
  summary: string | null;
  direction: string;
  composite: number;
}

interface SocraticLensTabProps {
  milestoneId: string;
}

export function SocraticLensTab({ milestoneId }: SocraticLensTabProps) {
  const { isWonder } = useMode();
  const [topics, setTopics] = useState<SocraticTopic[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [topicsRes, evidenceRes] = await Promise.all([
        supabase
          .from('socratic_topics')
          .select('*')
          .or(`milestone_id.is.null,milestone_id.eq.${milestoneId}`)
          .order('created_at'),
        supabase
          .from('evidence')
          .select('id, source, summary, direction, composite')
          .eq('milestone_id', milestoneId)
          .order('composite', { ascending: false })
          .limit(10),
      ]);
      // Cast the response to our expected type since the table is new
      setTopics((topicsRes.data as unknown as SocraticTopic[]) || []);
      setEvidence(evidenceRes.data || []);
      setLoading(false);
    };
    load();
  }, [milestoneId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl animate-pulse" style={{ ...glassInner, opacity: 0.5 }} />
        ))}
      </div>
    );
  }

  const topEvidence = evidence.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {isWonder ? (
          <Sparkles className="w-4 h-4" style={{ color: 'hsl(43, 96%, 56%)', filter: 'drop-shadow(0 0 6px hsla(43, 96%, 56%, 0.5))' }} />
        ) : (
          <Brain className="w-4 h-4 text-muted-foreground" />
        )}
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider" style={
          isWonder
            ? { background: 'linear-gradient(135deg, hsl(43, 96%, 56%), hsl(48, 100%, 74%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
            : { color: 'hsl(220, 10%, 60%)' }
        }>
          {isWonder ? '✨ Socratic Lens — Question Everything' : 'SOCRATIC LENS — EPISTEMIC AUDIT'}
        </h3>
      </div>

      {isWonder && (
        <p className="text-xs text-muted-foreground italic leading-relaxed" style={{ color: 'hsla(43, 50%, 70%, 0.8)' }}>
          "Be a philosopher; but, amidst all your philosophy, be still a man." — David Hume
        </p>
      )}

      {/* Topic Cards */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {topics.map((topic, i) => {
            const isExpanded = expandedId === topic.id;
            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="rounded-xl relative overflow-hidden cursor-pointer group"
                style={{
                  ...glassPanel,
                  border: isExpanded
                    ? `1px solid ${isWonder ? 'hsla(43, 96%, 56%, 0.3)' : 'hsla(192, 100%, 52%, 0.3)'}`
                    : '1px solid hsla(220, 12%, 70%, 0.12)',
                  transition: 'border-color 0.3s',
                }}
                onClick={() => setExpandedId(isExpanded ? null : topic.id)}
              >
                {/* Specular sheen */}
                <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-xl pointer-events-none" style={specularReflection} />

                <div className="p-4 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{
                          background: isWonder ? 'hsla(43, 96%, 56%, 0.12)' : 'hsla(192, 100%, 52%, 0.1)',
                          color: isWonder ? 'hsl(43, 96%, 56%)' : 'hsl(192, 100%, 52%)',
                          border: `1px solid ${isWonder ? 'hsla(43, 96%, 56%, 0.2)' : 'hsla(192, 100%, 52%, 0.2)'}`,
                        }}>
                          {isWonder ? `🔮 ${i + 1}` : `Q${i + 1}`}
                        </span>
                        <h4 className="text-sm font-bold text-foreground truncate">{topic.topic_title}</h4>
                      </div>

                      <p className="text-xs leading-relaxed" style={{ color: isWonder ? 'hsla(43, 50%, 80%, 0.9)' : 'hsl(220, 10%, 65%)' }}>
                        {isWonder
                          ? topic.socratic_question.split('.').slice(0, 2).join('.') + '…'
                          : topic.socratic_question.slice(0, 120) + '…'
                        }
                      </p>
                    </div>

                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </motion.div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid hsla(220, 12%, 70%, 0.1)' }}>
                          {/* Full Question */}
                          <div>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">
                              {isWonder ? '🌿 The Inquiry' : 'SOCRATIC QUESTION'}
                            </span>
                            <p className="text-xs leading-relaxed text-foreground">{topic.socratic_question}</p>
                          </div>

                          {/* Cynical Lens */}
                          <div className="rounded-lg p-3" style={{
                            background: isWonder
                              ? 'linear-gradient(135deg, hsla(0, 40%, 30%, 0.15), rgba(8, 10, 28, 0.6))'
                              : 'linear-gradient(135deg, hsla(0, 0%, 20%, 0.2), rgba(8, 10, 28, 0.6))',
                            border: `1px solid ${isWonder ? 'hsla(0, 50%, 50%, 0.15)' : 'hsla(220, 10%, 50%, 0.15)'}`,
                          }}>
                            <span className="text-[9px] font-mono uppercase tracking-wider mb-1 block" style={{
                              color: isWonder ? 'hsl(0, 60%, 65%)' : 'hsl(220, 10%, 55%)',
                            }}>
                              {isWonder ? '🗡️ The Cynic Speaks' : 'CYNICAL LENS'}
                            </span>
                            <p className="text-xs leading-relaxed italic" style={{
                              color: isWonder ? 'hsla(0, 40%, 75%, 0.9)' : 'hsl(220, 10%, 60%)',
                            }}>
                              "{topic.cynical_lens}"
                            </p>
                          </div>

                          {/* Linked Evidence */}
                          {topEvidence.length > 0 && (
                            <div>
                              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Link2 className="w-3 h-3" />
                                {isWonder ? 'Related Impressions' : 'LINKED EVIDENCE'}
                              </span>
                              <div className="space-y-1">
                                {topEvidence.map(ev => (
                                  <div key={ev.id} className="flex items-center gap-2 text-[10px] font-mono rounded px-2 py-1" style={{
                                    background: 'hsla(220, 10%, 20%, 0.3)',
                                    border: '1px solid hsla(220, 12%, 70%, 0.08)',
                                  }}>
                                    <span style={{
                                      color: ev.direction === 'supports' ? 'hsl(152, 80%, 50%)' : ev.direction === 'contradicts' ? 'hsl(0, 72%, 58%)' : 'hsl(220, 10%, 55%)',
                                    }}>
                                      {ev.direction === 'supports' ? '▲' : ev.direction === 'contradicts' ? '▼' : '●'}
                                    </span>
                                    <span className="text-muted-foreground truncate flex-1">{ev.summary || ev.source}</span>
                                    <span className="tabular-nums text-muted-foreground">{ev.composite.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Discuss Button */}
                          <button
                            className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              background: isWonder
                                ? 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.15), hsla(43, 60%, 40%, 0.1))'
                                : 'hsla(192, 100%, 52%, 0.1)',
                              border: `1px solid ${isWonder ? 'hsla(43, 96%, 56%, 0.25)' : 'hsla(192, 100%, 52%, 0.2)'}`,
                              color: isWonder ? 'hsl(43, 96%, 56%)' : 'hsl(192, 100%, 52%)',
                            }}
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            <MessageCircle className="w-3 h-3" />
                            {isWonder ? '💬 Discuss This' : 'DISCUSS'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer wisdom */}
      {!isWonder && (
        <p className="text-[9px] font-mono text-muted-foreground text-center mt-4 opacity-60">
          Epistemic modesty: all posteriors are provisional. Update, don't anchor.
        </p>
      )}
    </div>
  );
}
