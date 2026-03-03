import { useAuth } from '@/contexts/AuthContext';

export type UserTier = 'free' | 'starter' | 'pro' | 'vc_alpha';

const EXPORT_ALLOWED_TIERS: UserTier[] = ['pro', 'vc_alpha'];

/**
 * Entitlement hook — reads tier from auth profile.
 * Falls back to 'free' if not authenticated.
 */
export function useEntitlement() {
  const { profile } = useAuth();
  const tier = (profile?.tier as UserTier) || 'free';

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
    canExportMemo,
    canSendToLP,
    tierLabel: tierLabel[tier],
  };
}
