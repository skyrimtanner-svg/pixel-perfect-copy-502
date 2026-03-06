import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMode } from '@/contexts/ModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { glassPanel, glassInner, specularReflection } from '@/lib/glass-styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, MessageCircle, Link2, ChevronDown, Send, Trash2, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SocraticTopic {
  id: string;
  milestone_id: string | null;
  topic_title: string;
  socratic_question: string;
  cynical_lens: string;
  created_at: string;
}

interface SocraticComment {
  id: string;
  topic_id: string;
  milestone_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  is_ai: boolean;
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
  const { user } = useAuth();
  const [topics, setTopics] = useState<SocraticTopic[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [comments, setComments] = useState<SocraticComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [discussTopicId, setDiscussTopicId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin role
  useEffect(() => {
    if (!user) return;
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [topicsRes, evidenceRes, commentsRes] = await Promise.all([
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
        supabase
          .from('socratic_comments')
          .select('*')
          .eq('milestone_id', milestoneId)
          .order('created_at', { ascending: true }),
      ]);
      setTopics((topicsRes.data as unknown as SocraticTopic[]) || []);
      setEvidence(evidenceRes.data || []);
      setComments((commentsRes.data as unknown as SocraticComment[]) || []);
      setLoading(false);
    };
    load();
  }, [milestoneId]);

  // Realtime subscription for comments
  useEffect(() => {
    const channel = supabase
      .channel(`socratic-comments-${milestoneId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'socratic_comments', filter: `milestone_id=eq.${milestoneId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComments(prev => [...prev, payload.new as SocraticComment]);
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => prev.filter(c => c.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [milestoneId]);

  const handleSubmitComment = useCallback(async (topicId: string) => {
    if (!newComment.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from('socratic_comments').insert({
        topic_id: topicId,
        milestone_id: milestoneId,
        user_id: user.id,
        content: newComment.trim(),
      } as any);
      setNewComment('');
    } catch (err) {
      console.error('Comment submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  }, [newComment, user, milestoneId, submitting]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    await supabase.from('socratic_comments').delete().eq('id', commentId as any);
  }, []);

  const handleAiRespond = useCallback(async (topic: SocraticTopic, userComment: string) => {
    if (aiLoading) return;
    setAiLoading(topic.id);
    try {
      const topEvidence = evidence.slice(0, 3);
      const { data, error } = await supabase.functions.invoke('socratic-ai', {
        body: {
          topicTitle: topic.topic_title,
          socraticQuestion: topic.socratic_question,
          cynicalLens: topic.cynical_lens,
          userComment,
          topicId: topic.id,
          milestoneId,
          evidenceSummaries: topEvidence.map(e => e.summary || e.source),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(isWonder ? '✨ Hume speaks…' : 'AI response generated');
    } catch (err: any) {
      console.error('AI respond failed:', err);
      toast.error(err?.message || 'AI response failed');
    } finally {
      setAiLoading(null);
    }
  }, [aiLoading, evidence, milestoneId, isWonder]);

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
  const getTopicComments = (topicId: string) => comments.filter(c => c.topic_id === topicId);

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
            const isDiscussing = discussTopicId === topic.id;
            const topicComments = getTopicComments(topic.id);
            const showAiButton = isAdmin || topicComments.filter(c => !c.is_ai).length >= 2;
            const lastUserComment = [...topicComments].reverse().find(c => !c.is_ai);

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
                        {topicComments.length > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{
                            background: 'hsla(192, 100%, 52%, 0.1)',
                            color: 'hsl(192, 100%, 52%)',
                          }}>
                            {topicComments.length} 💬
                          </span>
                        )}
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

                          {/* Discussion Thread */}
                          <div>
                            <button
                              className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                              style={{
                                background: isWonder
                                  ? 'linear-gradient(135deg, hsla(43, 96%, 56%, 0.15), hsla(43, 60%, 40%, 0.1))'
                                  : 'hsla(192, 100%, 52%, 0.1)',
                                border: `1px solid ${isWonder ? 'hsla(43, 96%, 56%, 0.25)' : 'hsla(192, 100%, 52%, 0.2)'}`,
                                color: isWonder ? 'hsl(43, 96%, 56%)' : 'hsl(192, 100%, 52%)',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDiscussTopicId(isDiscussing ? null : topic.id);
                              }}
                            >
                              <MessageCircle className="w-3 h-3" />
                              {isWonder ? `💬 Discuss (${topicComments.length})` : `DISCUSS (${topicComments.length})`}
                            </button>

                            {/* Comment Thread */}
                            <AnimatePresence>
                              {isDiscussing && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="mt-3 space-y-2 rounded-lg p-3" style={{
                                    ...glassInner,
                                    border: '1px solid hsla(220, 12%, 70%, 0.1)',
                                  }}>
                                    {/* Existing comments */}
                                    {topicComments.length === 0 && (
                                      <p className="text-[10px] text-muted-foreground italic text-center py-2">
                                        {isWonder ? '🌱 Be the first to share your thoughts…' : 'No comments yet. Start the discussion.'}
                                      </p>
                                    )}
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {topicComments.map(comment => (
                                        <motion.div
                                          key={comment.id}
                                          initial={{ opacity: 0, x: comment.is_ai ? 8 : -8 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          className={`flex items-start gap-2 group/comment ${comment.is_ai ? 'pl-3' : ''}`}
                                        >
                                          {/* Avatar */}
                                          <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold" style={{
                                            background: comment.is_ai
                                              ? (isWonder ? 'hsla(270, 80%, 60%, 0.25)' : 'hsla(192, 100%, 52%, 0.2)')
                                              : (isWonder ? 'hsla(43, 96%, 56%, 0.2)' : 'hsla(192, 100%, 52%, 0.15)'),
                                            color: comment.is_ai
                                              ? (isWonder ? 'hsl(270, 80%, 70%)' : 'hsl(192, 100%, 65%)')
                                              : (isWonder ? 'hsl(43, 96%, 56%)' : 'hsl(192, 100%, 52%)'),
                                          }}>
                                            {comment.is_ai ? <Bot className="w-3 h-3" /> : (isWonder ? '✦' : 'U')}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            {/* AI badge */}
                                            {comment.is_ai && (
                                              <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded" style={{
                                                  background: isWonder
                                                    ? 'linear-gradient(135deg, hsla(270, 80%, 60%, 0.2), hsla(43, 96%, 56%, 0.15))'
                                                    : 'hsla(192, 100%, 52%, 0.12)',
                                                  color: isWonder ? 'hsl(270, 80%, 70%)' : 'hsl(192, 100%, 65%)',
                                                  border: `1px solid ${isWonder ? 'hsla(270, 80%, 60%, 0.25)' : 'hsla(192, 100%, 52%, 0.2)'}`,
                                                }}>
                                                  {isWonder ? '🏛️ Hume' : 'HUME·AI'}
                                                </span>
                                                {isWonder && (
                                                  <Sparkles className="w-2.5 h-2.5" style={{ color: 'hsl(270, 80%, 70%)', filter: 'drop-shadow(0 0 4px hsla(270, 80%, 60%, 0.5))' }} />
                                                )}
                                                {!isWonder && (
                                                  <span className="text-[8px] font-mono text-muted-foreground">
                                                    Δ log-odds ≈ 0.00
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                            <p className={`text-[11px] leading-relaxed ${comment.is_ai ? 'italic' : ''}`} style={{
                                              color: comment.is_ai
                                                ? (isWonder ? 'hsla(270, 40%, 80%, 0.95)' : 'hsl(220, 10%, 70%)')
                                                : undefined,
                                            }}>
                                              {comment.is_ai ? `"${comment.content}"` : comment.content}
                                            </p>
                                            <span className="text-[9px] text-muted-foreground font-mono">
                                              {format(new Date(comment.created_at), 'MMM d, HH:mm')}
                                            </span>
                                          </div>
                                          {/* Delete button (own comments only) */}
                                          {user && !comment.is_ai && comment.user_id === user.id && (
                                            <button
                                              onClick={() => handleDeleteComment(comment.id)}
                                              className="opacity-0 group-hover/comment:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
                                            >
                                              <Trash2 className="w-3 h-3 text-destructive" />
                                            </button>
                                          )}
                                        </motion.div>
                                      ))}
                                    </div>

                                    {/* AI Respond button */}
                                    {showAiButton && lastUserComment && (
                                      <button
                                        onClick={() => handleAiRespond(topic, lastUserComment.content)}
                                        disabled={aiLoading === topic.id}
                                        className="flex items-center gap-1.5 text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                                        style={{
                                          background: isWonder
                                            ? 'linear-gradient(135deg, hsla(270, 80%, 60%, 0.15), hsla(43, 96%, 56%, 0.1))'
                                            : 'hsla(192, 100%, 52%, 0.08)',
                                          border: `1px solid ${isWonder ? 'hsla(270, 80%, 60%, 0.25)' : 'hsla(192, 100%, 52%, 0.15)'}`,
                                          color: isWonder ? 'hsl(270, 80%, 70%)' : 'hsl(192, 100%, 65%)',
                                        }}
                                      >
                                        {aiLoading === topic.id ? (
                                          <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                          >
                                            <Bot className="w-3 h-3" />
                                          </motion.div>
                                        ) : (
                                          <Bot className="w-3 h-3" />
                                        )}
                                        {aiLoading === topic.id
                                          ? (isWonder ? '✨ Hume is thinking…' : 'GENERATING…')
                                          : (isWonder ? '🏛️ Ask Hume' : 'AI RESPOND')
                                        }
                                      </button>
                                    )}

                                    {/* Comment input */}
                                    {user && (
                                      <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid hsla(220, 12%, 70%, 0.08)' }}>
                                        <input
                                          type="text"
                                          value={newComment}
                                          onChange={(e) => setNewComment(e.target.value)}
                                          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitComment(topic.id); }}
                                          placeholder={isWonder ? 'Share your impression…' : 'Add a comment…'}
                                          className="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground outline-none font-mono"
                                        />
                                        <button
                                          onClick={() => handleSubmitComment(topic.id)}
                                          disabled={!newComment.trim() || submitting}
                                          className="p-1.5 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                                          style={{
                                            background: isWonder ? 'hsla(43, 96%, 56%, 0.2)' : 'hsla(192, 100%, 52%, 0.15)',
                                            color: isWonder ? 'hsl(43, 96%, 56%)' : 'hsl(192, 100%, 52%)',
                                          }}
                                        >
                                          <Send className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
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
