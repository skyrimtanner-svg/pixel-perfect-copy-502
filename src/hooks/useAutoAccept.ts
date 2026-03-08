import { useState, useEffect, useCallback, useRef } from 'react';
import type { PendingItem } from './usePendingEvidence';

const AUTO_ACCEPT_THRESHOLD = 0.85;
const COUNTDOWN_SECONDS = 10;

export interface AutoAcceptState {
  /** Items eligible for auto-accept (composite_score ≥ 0.85) */
  autoItems: Set<string>;
  /** Countdown seconds remaining per item */
  countdowns: Map<string, number>;
  /** Cancel auto-accept for a specific item */
  cancelAutoAccept: (id: string) => void;
  /** Check if an item is auto-accepting */
  isAutoAccepting: (id: string) => boolean;
}

export function useAutoAccept(
  items: PendingItem[],
  approve: (id: string) => void,
): AutoAcceptState {
  const [autoItems, setAutoItems] = useState<Set<string>>(new Set());
  const [countdowns, setCountdowns] = useState<Map<string, number>>(new Map());
  const cancelledRef = useRef<Set<string>>(new Set());
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Detect new auto-eligible items
  useEffect(() => {
    const eligible = items.filter(
      i => i.composite_score >= AUTO_ACCEPT_THRESHOLD && !cancelledRef.current.has(i.id)
    );
    const newAuto = new Set(eligible.map(i => i.id));
    setAutoItems(newAuto);

    // Start countdowns for new items
    eligible.forEach(item => {
      if (!intervalsRef.current.has(item.id)) {
        setCountdowns(prev => new Map(prev).set(item.id, COUNTDOWN_SECONDS));

        const interval = setInterval(() => {
          setCountdowns(prev => {
            const current = prev.get(item.id);
            if (current === undefined || current <= 1) {
              // Time's up — auto-approve
              clearInterval(intervalsRef.current.get(item.id)!);
              intervalsRef.current.delete(item.id);
              if (!cancelledRef.current.has(item.id)) {
                approve(item.id);
              }
              const next = new Map(prev);
              next.delete(item.id);
              return next;
            }
            return new Map(prev).set(item.id, current - 1);
          });
        }, 1000);

        intervalsRef.current.set(item.id, interval);
      }
    });

    // Cleanup intervals for items no longer present
    intervalsRef.current.forEach((interval, id) => {
      if (!newAuto.has(id)) {
        clearInterval(interval);
        intervalsRef.current.delete(id);
        setCountdowns(prev => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }
    });
  }, [items, approve]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();
    };
  }, []);

  const cancelAutoAccept = useCallback((id: string) => {
    cancelledRef.current.add(id);
    const interval = intervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalsRef.current.delete(id);
    }
    setAutoItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setCountdowns(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isAutoAccepting = useCallback((id: string) => autoItems.has(id), [autoItems]);

  return { autoItems, countdowns, cancelAutoAccept, isAutoAccepting };
}
