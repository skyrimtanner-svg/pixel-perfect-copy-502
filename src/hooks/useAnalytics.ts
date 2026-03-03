import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAnalytics() {
  const { user } = useAuth();

  const track = useCallback(async (eventType: string, eventData: Record<string, unknown> = {}) => {
    if (!user) return;
    await supabase.from('analytics_events').insert([{
      user_id: user.id,
      event_type: eventType,
      event_data: eventData as any,
    }]);
  }, [user]);

  return { track };
}
