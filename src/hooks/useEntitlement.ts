import { useState, useCallback } from 'react';

export type UserTier = 'free' | 'starter' | 'pro' | 'vc_alpha';

const EXPORT_ALLOWED_TIERS: UserTier[] = ['pro', 'vc_alpha'];

/**
 * Entitlement hook — checks user tier for gated features.
 * Currently uses a local default (expandable to Supabase auth profile later).
 * Set tier via setTier() for testing; defaults to 'free'.
 */
export function useEntitlement() {
  // In production, this would come from Supabase auth + profiles table
  const [tier, setTier] = useState<UserTier>('free');

  const canExportMemo = EXPORT_ALLOWED_TIERS.includes(tier);
  const canSendToLP = tier === 'vc_alpha';

  const tierLabel: Record<UserTier, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
    vc_alpha: 'VC Alpha',
  };

  return {
    tier,
    setTier,
    canExportMemo,
    canSendToLP,
    tierLabel: tierLabel[tier],
  };
}
