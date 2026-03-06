import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════
// v3.0 PUBLISHER TIER MAP (exact match from milestones-api)
// ═══════════════════════════════════════════════════════════════
const PUBLISHER_TIER_MAP: Record<string, number> = {
  "nature.com": 1, "science.org": 1, "thelancet.com": 1, "nejm.org": 1,
  "cell.com": 1, "pnas.org": 1, "aps.org": 1, "ieee.org": 1, "acm.org": 1,
  "arxiv.org": 1, "biorxiv.org": 1, "medrxiv.org": 1,
  ".gov": 1, "scholar.google.com": 1, "pubmed.ncbi": 1,
  "reuters.com": 2, "apnews.com": 2, "nytimes.com": 2, "wsj.com": 2,
  "ft.com": 2, "bbc.com": 2, "bloomberg.com": 2, "scientificamerican.com": 2,
  "technologyreview.com": 2, "spectrum.ieee.org": 2,
  "techcrunch.com": 3, "arstechnica.com": 3, "wired.com": 3,
  "theverge.com": 3, "venturebeat.com": 3,
  "prnewswire.com": 4, "businesswire.com": 4, "globenewswire.com": 4,
  "medium.com": 4, "substack.com": 4, "blog.": 4,
};

const EVIDENCE_TYPE_RULES = [
  { type: "government", weight: 1.0, patterns: [".gov", "regulatory", "certification"] },
  { type: "preprint", weight: 0.85, patterns: ["arxiv.org", "biorxiv.org", "medrxiv.org"] },
  { type: "peer_reviewed", weight: 0.95, patterns: ["nature.com", "science.org", "thelancet.com", "cell.com", "pnas.org"] },
  { type: "financial", weight: 0.85, patterns: ["sec.gov", "10-K", "earnings"] },
  { type: "journalism", weight: 0.75, patterns: ["reuters.com", "apnews.com", "nytimes.com", "wsj.com", "bbc.com", "bloomberg.com"] },
  { type: "trade_press", weight: 0.55, patterns: ["techcrunch.com", "arstechnica.com", "wired.com"] },
  { type: "press_release", weight: 0.25, patterns: ["prnewswire.com", "businesswire.com", "globenewswire.com"] },
  { type: "vendor_blog", weight: 0.15, patterns: ["blog.", "medium.com", "substack.com"] },
  { type: "unknown", weight: 0.30, patterns: [] },
];

const TIER_WEIGHTS: Record<number, number> = { 1: 1.0, 2: 0.75, 3: 0.45, 4: 0.15 };
const DECAY_LAMBDA = 0.0065;
const COMPOSITE_THRESHOLD = 0.35;

function getPublisherTier(url: string): number {
  const lower = url.toLowerCase();
  for (const [key, tier] of Object.entries(PUBLISHER_TIER_MAP)) {
    if (lower.includes(key)) return tier;
  }
  return 4;
}

function classifyEvidenceType(url: string, source: string): { type: string; weight: number } {
  const check = `${url} ${source}`.toLowerCase();
  for (const rule of EVIDENCE_TYPE_RULES) {
    if (rule.patterns.length === 0) continue;
    if (rule.patterns.some(p => check.includes(p))) return rule;
  }
  return { type: "unknown", weight: 0.30 };
}

function computeRecency(pubDate?: string): number {
  if (!pubDate) return 0.5;
  const ageDays = (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0.05, Math.exp(-DECAY_LAMBDA * Math.max(0, ageDays)));
}

function computeDeltaLogOdds(direction: string, composite: number): number {
  const sign = direction === "supports" ? 1 : direction === "contradicts" ? -1 : 0.1;
  return sign * composite * 2;
}

// ═══════════════════════════════════════════════════════════════
// RSS FEEDS
// ═══════════════════════════════════════════════════════════════
const RSS_FEEDS = [
  { name: "arXiv CS.AI", url: "https://export.arxiv.org/rss/cs.AI", source: "arxiv.org" },
  { name: "arXiv quant-ph", url: "https://export.arxiv.org/rss/quant-ph", source: "arxiv.org" },
  { name: "arXiv cond-mat", url: "https://export.arxiv.org/rss/cond-mat", source: "arxiv.org" },
  { name: "arXiv physics.plasm-ph", url: "https://export.arxiv.org/rss/physics.plasm-ph", source: "arxiv.org" },
  { name: "Reuters Science", url: "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best&best-sectors=science", source: "reuters.com" },
  { name: "Nature", url: "https://www.nature.com/nature.rss", source: "nature.com" },
  { name: "Science", url: "https://www.science.org/action/showFeed?type=etoc&feed=rss&jc=science", source: "science.org" },
];

function parseRSSItems(xml: string): { title: string; link: string; description: string; pubDate?: string }[] {
  const items: { title: string; link: string; description: string; pubDate?: string }[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
      ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() || "";
    const link = content.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() ||
      content.match(/<link[^>]*href="([^"]*)"[^>]*\/>/i)?.[1]?.trim() || "";
    const description = content.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]
      ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim() || "";
    const pubDate = content.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ||
      content.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i)?.[1]?.trim();
    if (title && title.length > 5) items.push({ title, link, description: description.slice(0, 600), pubDate });
  }
  return items.slice(0, 25);
}

// ═══════════════════════════════════════════════════════════════
// X/TWITTER
// ═══════════════════════════════════════════════════════════════
async function fetchXPosts(query: string, bearerToken: string): Promise<{ title: string; link: string; description: string; pubDate?: string }[]> {
  try {
    const url = `https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(query + " -is:retweet lang:en")}&max_results=10&tweet.fields=text,author_id,created_at`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`X API error for "${query}":`, resp.status, errText);
      return [];
    }
    const data = await resp.json();
    return (data.data || []).map((t: any) => ({
      title: (t.text || "").slice(0, 120),
      link: `https://x.com/i/status/${t.id}`,
      description: t.text || "",
      pubDate: t.created_at,
    }));
  } catch (e) {
    console.error(`X fetch error for "${query}":`, e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// CLINICALTRIALS.GOV
// ═══════════════════════════════════════════════════════════════
async function fetchClinicalTrials(query: string): Promise<{ title: string; link: string; description: string; pubDate?: string }[]> {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=5&format=json&sort=LastUpdatePostDate`;
    const resp = await fetch(url);
    if (!resp.ok) { await resp.text(); return []; }
    const data = await resp.json();
    return (data.studies || []).map((s: any) => ({
      title: s.protocolSection?.identificationModule?.officialTitle ||
        s.protocolSection?.identificationModule?.briefTitle || "",
      link: `https://clinicaltrials.gov/study/${s.protocolSection?.identificationModule?.nctId}`,
      description: (s.protocolSection?.descriptionModule?.briefSummary || "").slice(0, 600),
      pubDate: s.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date,
    }));
  } catch (e) {
    console.error(`ClinicalTrials fetch error for "${query}":`, e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// GOOGLE PATENTS
// ═══════════════════════════════════════════════════════════════
async function fetchPatents(query: string): Promise<{ title: string; link: string; description: string; pubDate?: string }[]> {
  try {
    const url = `https://patents.google.com/xhr/query?url=q%3D${encodeURIComponent(query)}&num=5&type=RESULT`;
    const resp = await fetch(url);
    if (!resp.ok) { await resp.text(); return []; }
    const data = await resp.json();
    return (data.results?.cluster?.[0]?.result || []).slice(0, 5).map((r: any) => ({
      title: r.patent?.title || "",
      link: `https://patents.google.com/patent/${r.patent?.publication_number}`,
      description: r.patent?.snippet || "",
      pubDate: r.patent?.filing_date,
    }));
  } catch (e) {
    console.error(`Patents fetch error for "${query}":`, e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// AI CLASSIFICATION (Lovable AI — gemini-2.5-flash-lite)
// ═══════════════════════════════════════════════════════════════
async function classifyWithAI(
  article: { title: string; description: string; link: string; source: string },
  milestone: { id: string; title: string; description: string | null; success_criteria: string | null; falsification: string | null; domain: string },
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
  const prompt = `You are a frontier technology evidence classifier using v3.0 Bayesian assessment rules.

MILESTONE: "${milestone.title}"
Domain: ${milestone.domain}
Description: ${milestone.description || "N/A"}
Success Criteria: ${milestone.success_criteria || "N/A"}
Falsification Conditions: ${milestone.falsification || "N/A"}

ARTICLE:
Title: "${article.title}"
Source: ${article.source}
URL: ${article.link}
Snippet: "${article.description}"

RULES:
- Mark relevant=true ONLY if article directly bears on success criteria or falsification conditions
- direction: "supports" if evidence makes milestone MORE likely, "contradicts" if LESS likely, "ambiguous" if mixed/unclear
- credibility: 0-1 based on source quality, methodology rigor, specificity of claims
- consensus: 0-1 how much broader scientific community would agree with the findings
- criteria_match: 0-1 how directly this maps to the stated success criteria
- summary: one concise sentence explaining the relevance

Be SELECTIVE. Most articles are NOT relevant to most milestones.`;

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
          { role: "system", content: "You classify evidence for a Bayesian frontier technology observatory. Be precise and selective." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify_evidence",
            description: "Classify whether an article is relevant to a milestone and score it using v3.0 rules.",
            parameters: {
              type: "object",
              properties: {
                relevant: { type: "boolean", description: "True only if article directly relates to milestone success criteria or falsification" },
                direction: { type: "string", enum: ["supports", "contradicts", "ambiguous"] },
                evidence_type: { type: "string", enum: ["peer_reviewed", "preprint", "government", "journalism", "trade_press", "press_release", "vendor_blog", "financial", "unknown"] },
                credibility: { type: "number", description: "0-1 credibility based on source quality and rigor" },
                consensus: { type: "number", description: "0-1 scientific consensus alignment" },
                criteria_match: { type: "number", description: "0-1 direct match to success criteria" },
                summary: { type: "string", description: "One sentence explaining relevance to milestone" },
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
    return JSON.parse(toolCall.function.arguments);
  } catch (e) {
    console.error("AI classify error:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// DOMAIN-SPECIFIC SEARCH QUERIES
// ═══════════════════════════════════════════════════════════════
const DOMAIN_QUERIES: Record<string, string[]> = {
  compute: ["artificial general intelligence", "LLM reasoning benchmark", "quantum computing error correction", "neuromorphic computing", "autonomous AI agent"],
  energy: ["fusion energy net gain", "solid state battery", "small modular reactor", "perovskite solar cell efficiency", "green hydrogen electrolyzer"],
  biology: ["CRISPR gene therapy clinical trial", "mRNA cancer vaccine", "xenotransplantation", "aging biomarker", "brain-computer interface"],
  connectivity: ["satellite internet constellation", "6G terahertz", "quantum internet entanglement"],
  manufacturing: ["reusable orbital launch", "3D printed organ", "carbon nanotube manufacturing"],
};

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════
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
  const sourceSummary: Record<string, { fetched: number; errors: number }> = {};

  const log = async (action: string, detail: any = {}) => {
    console.log(`[Scout ${runId.slice(0, 8)}] ${action}`, JSON.stringify(detail).slice(0, 300));
    await supabase.from("scout_logs").insert({ run_id: runId, action, detail });
  };

  try {
    await log("run_started", { timestamp: new Date().toISOString(), has_x_token: !!X_BEARER_TOKEN });

    // ─── 1. FETCH MILESTONES ───
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

    // ─── 2. FETCH ARTICLES FROM ALL SOURCES ───
    type Article = { title: string; link: string; description: string; source: string; pubDate?: string };
    const allArticles: Article[] = [];

    // --- RSS Feeds ---
    for (const feed of RSS_FEEDS) {
      try {
        const resp = await fetch(feed.url, {
          headers: { "User-Agent": "EvidenceScout/1.0 (Lovable Cloud)" },
          signal: AbortSignal.timeout(10000),
        });
        if (resp.ok) {
          const xml = await resp.text();
          const items = parseRSSItems(xml);
          items.forEach(item => allArticles.push({ ...item, source: feed.source }));
          sourceSummary[feed.name] = { fetched: items.length, errors: 0 };
          await log("feed_fetched", { name: feed.name, items: items.length });
        } else {
          await resp.text();
          sourceSummary[feed.name] = { fetched: 0, errors: 1 };
          await log("feed_error", { name: feed.name, status: resp.status });
        }
      } catch (e) {
        sourceSummary[feed.name] = { fetched: 0, errors: 1 };
        await log("feed_error", { name: feed.name, error: String(e).slice(0, 100) });
      }
    }

    // --- X/Twitter ---
    if (X_BEARER_TOKEN) {
      const xQueries = Object.values(DOMAIN_QUERIES).flat().slice(0, 8);
      let xTotal = 0;
      let xErrors = 0;
      for (const q of xQueries) {
        try {
          const posts = await fetchXPosts(q, X_BEARER_TOKEN);
          posts.forEach(p => allArticles.push({ ...p, source: "x.com" }));
          xTotal += posts.length;
        } catch {
          xErrors++;
        }
      }
      sourceSummary["X/Twitter"] = { fetched: xTotal, errors: xErrors };
      await log("x_fetched", { queries: xQueries.length, total: xTotal, errors: xErrors });
    } else {
      sourceSummary["X/Twitter"] = { fetched: 0, errors: 0 };
      await log("x_skipped", { reason: "No X_BEARER_TOKEN configured" });
    }

    // --- ClinicalTrials.gov ---
    const clinicalQueries = ["gene therapy", "CRISPR", "mRNA vaccine", "xenotransplantation", "brain computer interface"];
    let ctTotal = 0;
    for (const q of clinicalQueries) {
      try {
        const trials = await fetchClinicalTrials(q);
        trials.forEach(t => allArticles.push({ ...t, source: "clinicaltrials.gov" }));
        ctTotal += trials.length;
      } catch { /* logged inside function */ }
    }
    sourceSummary["ClinicalTrials.gov"] = { fetched: ctTotal, errors: 0 };
    await log("clinical_trials_fetched", { queries: clinicalQueries.length, total: ctTotal });

    // --- Google Patents ---
    const patentQueries = ["solid state battery", "quantum computing", "fusion reactor", "CRISPR delivery", "neuromorphic chip"];
    let ptTotal = 0;
    for (const q of patentQueries) {
      try {
        const patents = await fetchPatents(q);
        patents.forEach(p => allArticles.push({ ...p, source: "patents.google.com" }));
        ptTotal += patents.length;
      } catch { /* logged inside function */ }
    }
    sourceSummary["Google Patents"] = { fetched: ptTotal, errors: 0 };
    await log("patents_fetched", { queries: patentQueries.length, total: ptTotal });

    await log("total_articles_fetched", { count: allArticles.length, sources: sourceSummary });

    // ─── 3. DEDUPLICATE ───
    const { data: existingPending } = await supabase
      .from("pending_evidence")
      .select("source_url")
      .not("source_url", "is", null);
    const existingUrls = new Set((existingPending || []).map((e: any) => e.source_url));

    const { data: existingEvidence } = await supabase
      .from("evidence")
      .select("source");
    const existingSources = new Set((existingEvidence || []).map((e: any) => e.source));

    const uniqueArticles = allArticles.filter(a =>
      a.link && a.link.length > 5 &&
      !existingUrls.has(a.link) &&
      !existingSources.has(a.link)
    );

    // Sample to stay within rate limits (max 60 per run)
    const sampled = uniqueArticles.slice(0, 60);
    await log("deduplication", { total: allArticles.length, unique: uniqueArticles.length, sampled: sampled.length });

    // ─── 4. CLASSIFY & INSERT ───
    let pendingInserted = 0;
    let autoCommitted = 0;
    let aiCallsMade = 0;
    let aiCallsFailed = 0;

    for (const article of sampled) {
      // Pre-filter: keyword overlap to reduce AI calls
      const articleText = `${article.title} ${article.description}`.toLowerCase();
      const candidateMilestones = milestones.filter(m => {
        const msText = `${m.title} ${m.description || ""} ${m.success_criteria || ""}`.toLowerCase();
        const words = msText.split(/\s+/).filter(w => w.length > 4);
        const matches = words.filter(w => articleText.includes(w));
        return matches.length >= 2;
      }).slice(0, 3);

      if (candidateMilestones.length === 0) continue;

      for (const milestone of candidateMilestones) {
        aiCallsMade++;
        const classification = await classifyWithAI(article, milestone as any, LOVABLE_API_KEY);

        if (!classification) {
          aiCallsFailed++;
          await log("ai_classify_failed", { article: article.title.slice(0, 60), milestone: milestone.id });
          continue;
        }

        if (!classification.relevant) continue;

        // Compute v3 scores
        const tier = getPublisherTier(article.link || article.source);
        const evTypeResult = classifyEvidenceType(article.link || "", article.source);
        const recency = computeRecency(article.pubDate);
        const tierWeight = TIER_WEIGHTS[tier] || 0.15;

        // Composite = credibility * recency * consensus * criteria_match (v3 formula)
        const composite = classification.credibility * recency * classification.consensus * classification.criteria_match;
        const deltaLogOdds = computeDeltaLogOdds(classification.direction, composite);

        // Insert into pending_evidence
        const pendingRow = {
          milestone_id: milestone.id,
          source: article.source,
          source_url: article.link,
          direction: classification.direction,
          evidence_type: classification.evidence_type || evTypeResult.type,
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
        };

        await supabase.from("pending_evidence").insert(pendingRow);
        pendingInserted++;

        await log("evidence_queued", {
          milestone: milestone.id,
          direction: classification.direction,
          source: article.source,
          composite: composite.toFixed(3),
          delta_lo: deltaLogOdds.toFixed(3),
          tier,
          above_threshold: composite >= COMPOSITE_THRESHOLD,
        });
      }
    }

    const summary = {
      run_id: runId,
      articles_fetched: allArticles.length,
      articles_classified: sampled.length,
      ai_calls: aiCallsMade,
      ai_failures: aiCallsFailed,
      evidence_queued: pendingInserted,
      auto_committed: autoCommitted,
      sources: sourceSummary,
    };

    await log("run_completed", summary);

    return new Response(JSON.stringify({ success: true, ...summary }), {
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
