import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Default directive values — if current value differs, the directive is "active" (non-default). */
const DEFAULTS: Record<string, string> = {
  'search_focus': '',
  'scoring_weights': '',
  'auto_commit_rules': '',
  'domain_priorities': '',
};

export function useDirectivesActive() {
  const [activeCount, setActiveCount] = useState(0);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('scout_directives')
        .select('key, value');

      if (data) {
        const nonDefault = data.filter(d => {
          const def = DEFAULTS[d.key];
          // If we don't know the default, any non-empty value counts as active
          return d.value && d.value.trim().length > 0 && d.value !== def;
        });
        setActiveCount(nonDefault.length);
        setActiveKeys(nonDefault.map(d => d.key));
      }
      setLoading(false);
    };

    fetch();

    // Subscribe to changes
    const channel = supabase
      .channel('directives-active-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scout_directives' }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { activeCount, activeKeys, loading };
}
