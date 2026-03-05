import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Publisher tier map (reused from milestones-api v3 rules)
const PUBLISHER_TIER_MAP: Record<string, number> = {
  "nature.com": 1, "science.org": 1, "thelancet.com": 1, "nejm.org": 1,
  "arxiv.org": 1, "biorxiv.org": 1, "medrxiv.org": 1, ".gov": 1,
  "reuters.com": 2, "apnews.com": 2, "nytimes.com": 2, "bbc.com": 2,
  "bloomberg.com": 2, "scientificamerican.com": 2,
  "techcrunch.com": 3, "arstechnica.com": 3, "wired.com": 3,
  "medium.com": 4, "substack.com": 4, "blog.": 4,
};

function getPublisherTier(url: string): number {
  const lower = url.toLowerCase();
  for (const [key, tier] of Object.entries(PUBLISHER_TIER_MAP)) {
    if (lower.includes(key)) return tier;
  }
  return 4;
}

// RSS feed URLs
const RSS_FEEDS = [
  { name: "arXiv CS.AI", url: "https://export.arxiv.org/rss/cs.AI", source: "arxiv.org" },
  { name: "arXiv quant-ph", url: "https://export.arxiv.org/rss/quant-ph", source: "arxiv.org" },
  { name: "Reuters Science", url: "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best&best-sectors=science", source: "reuters.com" },
  { name: "Nature", url: "https://www.nature.com/nature.rss", source: "nature.com" },
  { name: "Science", url: "https://www.science.org/action/showFeed?type=etoc&feed=rss&jc=science", source: "science.org" },
];

// Simple XML parser for RSS items
function parseRSSItems(xml: string): { title: string; link: string; description: string; pubDate?: string }[] {
  const items: { title: string; link: string; description: string; pubDate?: string }[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() || "";
    const link = content.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() || 
                 content.match(/<link[^>]*href="([^"]*)"[^>]*\/>/i)?.[1]?.trim() || "";
    const description = content.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim() || "";
    const pubDate = content.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
    if (title) items.push({ title, link, description: description.slice(0, 500), pubDate });
  }
  return items.slice(0, 20); // Cap per feed
}

// Fetch X/Twitter search results (if bearer token available)
async function fetchXPosts(query: string, bearerToken: string): Promise<{ title: string; link: string; description: string }[]> {
  try {
    const url = `https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=text,author_id,created_at`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    if (!resp.ok) { await resp.text(); return []; }
    const data = await resp.json();
    return (data.data || []).map((t: any) => ({
      title: t.text?.slice(0, 100) || "",
      link: `https://x.com/i/status/${t.id}`,
      description: t.text || "",
    }));
  } catch { return []; }
}

// Fetch ClinicalTrials.gov
async function fetchClinicalTrials(query: string): Promise<{ title: string; link: string; description: string }[]> {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=5&format=json`;
    const resp = await fetch(url);
    if (!resp.ok) { await resp.text(); return []; }
    const data = await resp.json();
    return (data.studies || []).map((s: any) => ({
      title: s.protocolSection?.identificationModule?.officialTitle || s.protocolSection?.identificationModule?.briefTitle || "",
      link: `https://clinicaltrials.gov/study/${s.protocolSection?.identificationModule?.nctId}`,
      description: s.protocolSection?.descriptionModule?.briefSummary?.slice(0, 500) || "",
    }));
  } catch { return []; }
}

// Fetch Google Patents
async function fetchPatents(query: string): Promise<{ title: string; link: string; description: string }[]> {
  try {
    const url = `https://patents.google.com/xhr/query?url=q%3D${encodeURIComponent(query)}&num=5&type=RESULT`;
    const resp = await fetch(url);
    if (!resp.ok) { await resp.text(); return []; }
    const data = await resp.json();
    return (data.results?.cluster?.[0]?.result || []).slice(0, 5).map((r: any) => ({
      title: r.patent?.title || "",
      link: `https://patents.google.com/patent/${r.patent?.publication_number}`,
      description: r.patent?.snippet || "",
    }));
  } catch { return []; }
}

// Use Lovable AI to classify an article against a milestone
async function classifyWithAI(
  article: { title: string; description: string; link: string; source: string },
  milestone: { id: string; title: string; description: string; success_criteria: string; falsification: string; domain: string },
  apiKey: string
): Promise<{
  relevant: boolean;
  direction: string;
  evidence_type: string;
  credibility: number;
  consensus: number;
  criteria_match: number;
  summary: string;
} | null> {
  const prompt = `You are an evidence classifier for a frontier technology observatory.

Milestone: "${milestone.title}"
Domain: ${milestone.domain}
Description: ${milestone.description || "N/A"}
Success Criteria: ${milestone.success_criteria || "N/A"}
Falsification: ${milestone.falsification || "N/A"}

Article Title: "${article.title}"
Article Source: ${article.source}
Article Snippet: "${article.description}"

Determine if this article is relevant to this milestone. If relevant, classify it.`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Classify evidence for frontier tech milestones. Be selective—only mark as relevant if the article directly relates to the milestone's success criteria or falsification conditions." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify_evidence",
            description: "Classify whether an article is relevant to a milestone and score it.",
            parameters: {
              type: "object",
              properties: {
                relevant: { type: "boolean", description: "True if article directly relates to milestone" },
                direction: { type: "string", enum: ["supports", "contradicts", "ambiguous"] },
                evidence_type: { type: "string", enum: ["peer_reviewed", "preprint", "government", "journalism", "trade_press", "press_release", "vendor_blog", "financial", "unknown"] },
                credibility: { type: "number", description: "0-1 credibility score" },
                consensus: { type: "number", description: "0-1 how much scientific consensus supports this" },
                criteria_match: { type: "number", description: "0-1 how directly it matches success criteria" },
                summary: { type: "string", description: "One-sentence summary of relevance" },
              },
              required: ["relevant", "direction", "evidence_type", "credibility", "consensus", "criteria_match", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classify_evidence" } },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("AI classification error:", resp.status, errText);
      return null;
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return null;

    const args = JSON.parse(toolCall.function.arguments);
    return args;
  } catch (e) {
    console.error("AI classify error:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const X_BEARER_TOKEN = Deno.env.get("X_BEARER_TOKEN");
  const runId = crypto.randomUUID();

  const log = async (action: string, detail: any = {}) => {
    console.log(`[Scout ${runId.slice(0, 8)}] ${action}`, JSON.stringify(detail).slice(0, 200));
    await supabase.from("scout_logs").insert({ run_id: runId, action, detail });
  };

  try {
    await log("run_started", { timestamp: new Date().toISOString() });

    // 1. Fetch all milestones
    const { data: milestones, error: msErr } = await supabase
      .from("milestones")
      .select("id, title, description, success_criteria, falsification, domain, tier")
      .neq("tier", "historical");

    if (msErr || !milestones) {
      await log("error", { message: "Failed to fetch milestones", error: msErr });
      return new Response(JSON.stringify({ error: "Failed to fetch milestones" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await log("milestones_loaded", { count: milestones.length });

    // 2. Fetch articles from all sources
    const allArticles: { title: string; link: string; description: string; source: string; pubDate?: string }[] = [];

    // RSS feeds
    for (const feed of RSS_FEEDS) {
      try {
        const resp = await fetch(feed.url, { headers: { "User-Agent": "EvidenceScout/1.0" } });
        if (resp.ok) {
          const xml = await resp.text();
          const items = parseRSSItems(xml);
          items.forEach(item => allArticles.push({ ...item, source: feed.source }));
          await log("feed_fetched", { name: feed.name, items: items.length });
        } else {
          await resp.text();
          await log("feed_error", { name: feed.name, status: resp.status });
        }
      } catch (e) {
        await log("feed_error", { name: feed.name, error: String(e) });
      }
    }

    // X/Twitter (if bearer token available)
    if (X_BEARER_TOKEN) {
      const xQueries = ["fusion energy breakthrough", "AGI artificial general intelligence", "quantum computing", "CRISPR gene therapy", "solid state battery"];
      for (const q of xQueries) {
        const posts = await fetchXPosts(q, X_BEARER_TOKEN);
        posts.forEach(p => allArticles.push({ ...p, source: "x.com" }));
      }
      await log("x_fetched", { queries: xQueries.length });
    } else {
      await log("x_skipped", { reason: "No X_BEARER_TOKEN configured" });
    }

    // ClinicalTrials.gov
    const clinicalQueries = ["gene therapy", "CRISPR", "mRNA vaccine"];
    for (const q of clinicalQueries) {
      const trials = await fetchClinicalTrials(q);
      trials.forEach(t => allArticles.push({ ...t, source: "clinicaltrials.gov" }));
    }
    await log("clinical_trials_fetched", { queries: clinicalQueries.length });

    // Google Patents
    const patentQueries = ["solid state battery", "quantum computing", "fusion reactor"];
    for (const q of patentQueries) {
      const patents = await fetchPatents(q);
      patents.forEach(p => allArticles.push({ ...p, source: "patents.google.com" }));
    }
    await log("patents_fetched", { queries: patentQueries.length });

    await log("total_articles", { count: allArticles.length });

    // 3. Check existing pending evidence to avoid duplicates
    const { data: existingPending } = await supabase
      .from("pending_evidence")
      .select("source_url")
      .not("source_url", "is", null);
    const existingUrls = new Set((existingPending || []).map(e => e.source_url));

    // Also check committed evidence
    const { data: existingEvidence } = await supabase
      .from("evidence")
      .select("source");
    const existingSources = new Set((existingEvidence || []).map(e => e.source));

    // 4. Classify articles against milestones (sample to stay within rate limits)
    const uniqueArticles = allArticles.filter(a => a.link && !existingUrls.has(a.link) && !existingSources.has(a.link));
    const sampled = uniqueArticles.slice(0, 50); // Process max 50 articles per run

    await log("classifying", { unique: uniqueArticles.length, sampled: sampled.length });

    let insertedCount = 0;

    for (const article of sampled) {
      // Match against top milestones by keyword overlap (pre-filter to reduce AI calls)
      const articleText = `${article.title} ${article.description}`.toLowerCase();
      const candidateMilestones = milestones.filter(m => {
        const msText = `${m.title} ${m.description || ""} ${m.success_criteria || ""}`.toLowerCase();
        const words = msText.split(/\s+/).filter(w => w.length > 4);
        const matches = words.filter(w => articleText.includes(w));
        return matches.length >= 2;
      }).slice(0, 3); // Max 3 milestone matches per article

      for (const milestone of candidateMilestones) {
        const classification = await classifyWithAI(article, milestone as any, LOVABLE_API_KEY);

        if (classification && classification.relevant) {
          const tier = getPublisherTier(article.link || article.source);
          const recency = article.pubDate
            ? Math.max(0.05, Math.exp(-0.0065 * Math.max(0, (Date.now() - new Date(article.pubDate).getTime()) / 86400000)))
            : 0.5;
          const composite = classification.credibility * recency * classification.consensus * classification.criteria_match;

          await supabase.from("pending_evidence").insert({
            milestone_id: milestone.id,
            source: article.source,
            source_url: article.link,
            direction: classification.direction,
            evidence_type: classification.evidence_type,
            publisher_tier: tier,
            credibility: classification.credibility,
            consensus: classification.consensus,
            criteria_match: classification.criteria_match,
            recency,
            composite_score: composite,
            summary: classification.summary,
            raw_snippet: article.description?.slice(0, 1000),
            status: "pending",
            scout_run_id: runId,
          });
          insertedCount++;
          await log("evidence_queued", { milestone: milestone.id, direction: classification.direction, source: article.source });
        }
      }
    }

    await log("run_completed", { inserted: insertedCount, articlesProcessed: sampled.length });

    return new Response(JSON.stringify({
      success: true,
      run_id: runId,
      articles_fetched: allArticles.length,
      articles_classified: sampled.length,
      evidence_queued: insertedCount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    await log("run_error", { error: String(e) });
    console.error("Scout error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
