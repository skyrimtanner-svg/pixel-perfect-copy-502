import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ContributionMeta {
  type: string;
  credibility: number;
  recency: number;
  decay: number;
  consensus: number;
  direction: string;
  criteria_match: number;
}

export interface Contribution {
  evidence_id: string;
  evidence_meta: ContributionMeta;
  composite: number;
  delta_log_odds: number;
}

export interface BayesBundle {
  prior: number;
  posterior: number;
  log_odds: number;
  delta_log_odds: number;
  contributions: Contribution[];
  latent: { mu: number; sigma: number };
  signal_dominance: {
    confirmCount: number;
    confirmScore: number;
    falsifyCount: number;
    falsifyScore: number;
    ratioCount: number;
    ratioScore: number;
    dominanceFlagCount: boolean;
    dominanceFlagScore: boolean;
  };
}

export interface CalibrationSnapshot {
  latent_mu: number;
  latent_sigma: number;
  grace_window: number;
  horizon_years: number;
  sigma_future: number;
  p_demonstrated: number;
  p_deployed: number;
  p_accomplished: number;
  implied_status: string;
}

export interface EvidenceItem {
  id: string;
  milestone_id: string;
  source: string;
  type: string;
  direction: string;
  credibility: number;
  recency: number;
  consensus: number;
  criteria_match: number;
  composite: number;
  delta_log_odds: number;
  date: string;
  summary: string;
}

export interface MilestoneDetail {
  milestone: any;
  evidence: EvidenceItem[];
  bayes: BayesBundle;
  calibration: CalibrationSnapshot;
}

export interface WhatIfResult {
  whatif: true;
  excluded_count: number;
  remaining_evidence_count: number;
  update_result: {
    prior: number;
    posterior: number;
    prior_log_odds: number;
    posterior_log_odds: number;
    delta_log_odds: number;
    contributions: Contribution[];
    propagation: any[];
  };
}

export function useMilestoneAPI() {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<MilestoneDetail | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);

  const fetchMilestone = useCallback(async (id: string) => {
    setLoading(true);
    setWhatIfResult(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/milestones-api/${id}?include=bayes,evidence,calibration`;
      const res = await fetch(url, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = await res.json();
      setDetail(result);
      return result;
    } catch (err) {
      console.error('Failed to fetch milestone:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const runWhatIf = useCallback(async (id: string, excludeIds: string[]) => {
    setWhatIfLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/milestones-api/${id}/whatif`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exclude_evidence_ids: excludeIds }),
      });
      if (!res.ok) throw new Error(`WhatIf error: ${res.status}`);
      const result: WhatIfResult = await res.json();
      setWhatIfResult(result);
      return result;
    } catch (err) {
      console.error('WhatIf failed:', err);
      return null;
    } finally {
      setWhatIfLoading(false);
    }
  }, []);

  return { loading, detail, whatIfResult, whatIfLoading, fetchMilestone, runWhatIf };
}
