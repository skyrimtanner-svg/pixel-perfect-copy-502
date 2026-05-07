import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bot } from 'lucide-react';

const STEPS = [
  'Open the AGI milestone.',
  'Inspect current posterior.',
  'Read the top supporting evidence.',
  'Toggle one supporting evidence item off.',
  'Confirm the posterior changes.',
  'Open the provenance/trust ledger panel.',
  'Verify the latest hash exists.',
  'Open system health.',
];

export type WalkthroughStatus = 'pending' | 'active' | 'complete';

interface Props {
  statuses: WalkthroughStatus[];
}

export function AgentWalkthroughPanel({ statuses }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div
      data-agent-id="agent-walkthrough-panel"
      className="rounded-xl border border-border/40 bg-background/40 backdrop-blur-md p-4"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-mono uppercase tracking-wider text-foreground">Agent Walkthrough</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ol
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 space-y-1.5 text-xs font-mono"
          >
            {STEPS.map((s, i) => {
              const status = statuses[i] ?? 'pending';
              const dot = status === 'complete' ? 'bg-emerald-400' : status === 'active' ? 'bg-amber-400 animate-pulse' : 'bg-muted-foreground/40';
              const text = status === 'complete' ? 'text-foreground' : status === 'active' ? 'text-amber-200' : 'text-muted-foreground';
              return (
                <li key={i} data-agent-id={`walkthrough-step-${i + 1}`} data-status={status} className={`flex items-start gap-2 ${text}`}>
                  <span className={`mt-1 h-2 w-2 rounded-full ${dot}`} />
                  <span><span className="opacity-60">{i + 1}.</span> {s} <span className="ml-1 opacity-60">[{status}]</span></span>
                </li>
              );
            })}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}
