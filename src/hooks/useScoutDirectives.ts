import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ScoutDirective {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export function useScoutDirectives() {
  const [directives, setDirectives] = useState<ScoutDirective[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { isAdmin, user } = useAuth();

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('scout_directives')
      .select('*')
      .order('key');

    if (error) {
      console.error('Failed to fetch scout directives:', error);
    } else {
      setDirectives((data || []) as ScoutDirective[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateDirective = useCallback(async (key: string, value: string) => {
    if (!isAdmin || !user) return;
    setSaving(key);
    const { error } = await supabase
      .from('scout_directives')
      .update({ value, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      console.error('Failed to update directive:', error);
      toast.error('Failed to save directive');
    } else {
      toast.success('Directive saved');
      await fetch();
    }
    setSaving(null);
  }, [isAdmin, user, fetch]);

  return { directives, loading, saving, updateDirective, refetch: fetch };
}
