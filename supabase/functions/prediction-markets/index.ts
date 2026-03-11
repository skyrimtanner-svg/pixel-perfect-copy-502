import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map milestone IDs to Metaculus question IDs
const MILESTONE_TO_METACULUS: Record<string, number> = {
  'agi': 5121,          // When will the first AGI be created?
  'fusion': 3526,       // When will fusion power be viable?
  'longevity': 3621,    // Life extension
  'quantum': 6345,      // Quantum computing milestones
  'bci': 8384,          // Brain-computer interfaces
};

// Map milestone IDs to Polymarket slugs (example mappings)
const MILESTONE_TO_POLYMARKET: Record<string, string> = {
  'agi': 'will-artificial-general-intelligence-be-created-by-2030',
};

interface MarketData {
  source: 'metaculus' | 'polymarket';
  question: string;
  probability: number | null;
  url: string;
  lastUpdated: string;
  participantCount?: number;
}

async function fetchMetaculus(questionId: number): Promise<MarketData | null> {
  try {
    const res = await fetch(`https://www.metaculus.com/api2/questions/${questionId}/`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();

    return {
      source: 'metaculus',
      question: data.title || '',
      probability: data.community_prediction?.full?.q2 ?? null,
      url: `https://www.metaculus.com/questions/${questionId}/`,
      lastUpdated: data.last_activity_time || new Date().toISOString(),
      participantCount: data.number_of_forecasters || 0,
    };
  } catch {
    return null;
  }
}

async function fetchPolymarket(slug: string): Promise<MarketData | null> {
  try {
    // Polymarket CLOB API
    const res = await fetch(`https://clob.polymarket.com/markets?slug=${slug}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const market = Array.isArray(data) ? data[0] : data;
    if (!market) return null;

    return {
      source: 'polymarket',
      question: market.question || market.title || '',
      probability: market.outcomePrices ? parseFloat(market.outcomePrices[0]) : null,
      url: `https://polymarket.com/event/${slug}`,
      lastUpdated: market.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const milestoneId = url.searchParams.get('milestone_id');

    // If specific milestone requested
    if (milestoneId) {
      const results: MarketData[] = [];

      const metaculusId = MILESTONE_TO_METACULUS[milestoneId];
      if (metaculusId) {
        const data = await fetchMetaculus(metaculusId);
        if (data) results.push(data);
      }

      const polymarketSlug = MILESTONE_TO_POLYMARKET[milestoneId];
      if (polymarketSlug) {
        const data = await fetchPolymarket(polymarketSlug);
        if (data) results.push(data);
      }

      return new Response(JSON.stringify({ milestone_id: milestoneId, markets: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all mapped markets
    const allResults: Record<string, MarketData[]> = {};

    const promises = Object.entries(MILESTONE_TO_METACULUS).map(async ([mid, qid]) => {
      const data = await fetchMetaculus(qid);
      if (!allResults[mid]) allResults[mid] = [];
      if (data) allResults[mid].push(data);
    });

    const polyPromises = Object.entries(MILESTONE_TO_POLYMARKET).map(async ([mid, slug]) => {
      const data = await fetchPolymarket(slug);
      if (!allResults[mid]) allResults[mid] = [];
      if (data) allResults[mid].push(data);
    });

    await Promise.all([...promises, ...polyPromises]);

    return new Response(JSON.stringify({ markets: allResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Prediction markets error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
