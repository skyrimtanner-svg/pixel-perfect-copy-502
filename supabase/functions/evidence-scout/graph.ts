/**
 * LangGraph-style stateful multi-step reasoning graph for Evidence Scout.
 * Nodes: search → classify → score → queue
 * Features: in-run memory for milestone classification history, per-node tracing.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface Article {
  title: string;
  link: string;
  description: string;
  source: string;
  pubDate?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  success_criteria: string | null;
  falsification: string | null;
  domain: string;
  tier: string;
}

export interface ClassificationResult {
  relevant: boolean;
  direction: string;
  evidence_type: string;
  credibility: number;
  consensus: number;
  criteria_match: number;
  summary: string;
}

export interface ScoredEvidence {
  article: Article;
  milestone: Milestone;
  classification: ClassificationResult;
  publisherTier: number;
  recency: number;
  composite: number;
  deltaLogOdds: number;
  autoCommitted?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// GRAPH STATE — carries data between nodes
// ═══════════════════════════════════════════════════════════════

export interface GraphState {
  runId: string;
  supabase: SupabaseClient;
  apiKey: string;
  xBearerToken?: string;
  slackApiKey?: string;

  // Data flowing through nodes
  milestones: Milestone[];
  articles: Article[];
  uniqueArticles: Article[];
  classifications: { article: Article; milestone: Milestone; result: ClassificationResult }[];
  scoredEvidence: ScoredEvidence[];
  queuedCount: number;
  autoCommittedCount: number;
  highSignalItems: any[];

  // Memory: tracks previous classifications per milestone in this run
  // Used by classify node to improve scoring on second-pass articles
  memory: Map<string, { totalSeen: number; avgComposite: number; directions: string[] }>;

  // Source summary for logging
  sourceSummary: Record<string, { fetched: number; errors: number }>;

  // Stats
  aiCallsMade: number;
  aiCallsFailed: number;
}

// ═══════════════════════════════════════════════════════════════
// NODE TRACER — logs each node execution to scout_logs
// ═══════════════════════════════════════════════════════════════

type NodeFn = (state: GraphState) => Promise<GraphState>;

function traceNode(name: string, fn: NodeFn): NodeFn {
  return async (state: GraphState) => {
    const start = Date.now();
    await logToScout(state, `node_enter:${name}`, { timestamp: new Date().toISOString() });

    try {
      const result = await fn(state);
      const durationMs = Date.now() - start;
      await logToScout(state, `node_exit:${name}`, { durationMs, success: true });
      return result;
    } catch (e) {
      const durationMs = Date.now() - start;
      await logToScout(state, `node_error:${name}`, { durationMs, error: String(e).slice(0, 300) });
      throw e;
    }
  };
}

async function logToScout(state: GraphState, action: string, detail: any = {}) {
  console.log(`[Scout ${state.runId.slice(0, 8)}] ${action}`, JSON.stringify(detail).slice(0, 300));
  await state.supabase.from("scout_logs").insert({ run_id: state.runId, action, detail });
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS (shared with index.ts via re-export)
// ═══════════════════════════════════════════════════════════════

export const PUBLISHER_TIER_MAP: Record<string, number> = {
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

const TIER_WEIGHTS: Record<number, number> = { 1: 1.0, 2: 0.75, 3: 0.45, 4: 0.15 };
const DECAY_LAMBDA = 0.0065;
export const COMPOSITE_THRESHOLD = 0.35;

export function getPublisherTier(url: string): number {
  const lower = url.toLowerCase();
  for (const [key, tier] of Object.entries(PUBLISHER_TIER_MAP)) {
    if (lower.includes(key)) return tier;
  }
  return 4;
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
// RSS / X / CLINICAL / PATENTS (source fetchers)
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

async function fetchXPosts(query: string, bearerToken: string): Promise<Article[]> {
  try {
    const url = `https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(query + " -is:retweet lang:en")}&max_results=10&tweet.fields=text,author_id,created_at`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${bearerToken}` } });
    if (!resp.ok) { await resp.text(); return []; }
    const data = await resp.json();
    return (data.data || []).map((t: any) => ({
      title: (t.text || "").slice(0, 120),
      link: `https://x.com/i/status/${t.id}`,
      description: t.text || "",
      source: "x.com",
      pubDate: t.created_at,
    }));
  } catch { return []; }
}

async function fetchClinicalTrials(query: string): Promise<Article[]> {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=5&format=json&sort=LastUpdatePostDate`;
    const resp = await fetch(url);
    if (!resp.ok) { await resp.text(); return []; }
    const data = await resp.json();
    return (data.studies || []).map((s: any) => ({
      title: s.protocolSection?.identificationModule?.officialTitle || s.protocolSection?.identificationModule?.briefTitle || "",
      link: `https://clinicaltrials.gov/study/${s.protocolSection?.identificationModule?.nctId}`,
      description: (s.protocolSection?.descriptionModule?.briefSummary || "").slice(0, 600),
      source: "clinicaltrials.gov",
      pubDate: s.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date,
    }));
  } catch { return []; }
}

async function fetchPatents(query: string): Promise<Article[]> {
  try {
    const url = `https://patents.google.com/xhr/query?url=q%3D${encodeURIComponent(query)}&num=5&type=RESULT`;
    const resp = await fetch(url);
    if (!resp.ok) { await resp.text(); return []; }
    const data = await resp.json();
    return (data.results?.cluster?.[0]?.result || []).slice(0, 5).map((r: any) => ({
      title: r.patent?.title || "",
      link: `https://patents.google.com/patent/${r.patent?.publication_number}`,
      description: r.patent?.snippet || "",
      source: "patents.google.com",
      pubDate: r.patent?.filing_date,
    }));
  } catch { return []; }
}

const DOMAIN_QUERIES: Record<string, string[]> = {
  compute: ["artificial general intelligence", "LLM reasoning benchmark", "quantum computing error correction", "neuromorphic computing", "autonomous AI agent"],
  energy: ["fusion energy net gain", "solid state battery", "small modular reactor", "perovskite solar cell efficiency", "green hydrogen electrolyzer"],
  biology: ["CRISPR gene therapy clinical trial", "mRNA cancer vaccine", "xenotransplantation", "aging biomarker", "brain-computer interface"],
  connectivity: ["satellite internet constellation", "6G terahertz", "quantum internet entanglement"],
  manufacturing: ["reusable orbital launch", "3D printed organ", "carbon nanotube manufacturing"],
};

// ═══════════════════════════════════════════════════════════════
// NODE 1: SEARCH — fetch articles from all sources
// ═══════════════════════════════════════════════════════════════

const searchNode: NodeFn = async (state) => {
  const articles: Article[] = [];
  const sourceSummary: Record<string, { fetched: number; errors: number }> = {};

  // RSS
  for (const feed of RSS_FEEDS) {
    try {
      const resp = await fetch(feed.url, {
        headers: { "User-Agent": "EvidenceScout/2.0 (LangGraph)" },
        signal: AbortSignal.timeout(10000),
      });
      if (resp.ok) {
        const xml = await resp.text();
        const items = parseRSSItems(xml);
        items.forEach(item => articles.push({ ...item, source: feed.source }));
        sourceSummary[feed.name] = { fetched: items.length, errors: 0 };
      } else {
        await resp.text();
        sourceSummary[feed.name] = { fetched: 0, errors: 1 };
      }
    } catch {
      sourceSummary[feed.name] = { fetched: 0, errors: 1 };
    }
  }

  // X/Twitter
  if (state.xBearerToken) {
    const xQueries = Object.values(DOMAIN_QUERIES).flat().slice(0, 8);
    let xTotal = 0, xErrors = 0;
    for (const q of xQueries) {
      try {
        const posts = await fetchXPosts(q, state.xBearerToken);
        posts.forEach(p => articles.push(p));
        xTotal += posts.length;
      } catch { xErrors++; }
    }
    sourceSummary["X/Twitter"] = { fetched: xTotal, errors: xErrors };
  } else {
    sourceSummary["X/Twitter"] = { fetched: 0, errors: 0 };
  }

  // ClinicalTrials
  const clinicalQueries = ["gene therapy", "CRISPR", "mRNA vaccine", "xenotransplantation", "brain computer interface"];
  let ctTotal = 0;
  for (const q of clinicalQueries) {
    try {
      const trials = await fetchClinicalTrials(q);
      trials.forEach(t => articles.push(t));
      ctTotal += trials.length;
    } catch {}
  }
  sourceSummary["ClinicalTrials.gov"] = { fetched: ctTotal, errors: 0 };

  // Patents
  const patentQueries = ["solid state battery", "quantum computing", "fusion reactor", "CRISPR delivery", "neuromorphic chip"];
  let ptTotal = 0;
  for (const q of patentQueries) {
    try {
      const patents = await fetchPatents(q);
      patents.forEach(p => articles.push(p));
      ptTotal += patents.length;
    } catch {}
  }
  sourceSummary["Google Patents"] = { fetched: ptTotal, errors: 0 };

  // Deduplicate against existing DB
  const { data: existingPending } = await state.supabase
    .from("pending_evidence").select("source_url").not("source_url", "is", null);
  const existingUrls = new Set((existingPending || []).map((e: any) => e.source_url));
  const { data: existingEvidence } = await state.supabase.from("evidence").select("source");
  const existingSources = new Set((existingEvidence || []).map((e: any) => e.source));

  const unique = articles.filter(a =>
    a.link && a.link.length > 5 && !existingUrls.has(a.link) && !existingSources.has(a.link)
  ).slice(0, 60);

  return {
    ...state,
    articles,
    uniqueArticles: unique,
    sourceSummary,
  };
};

// ═══════════════════════════════════════════════════════════════
// NODE 2: CLASSIFY — AI classification with memory context
// ═══════════════════════════════════════════════════════════════

async function classifyWithAI(
  article: Article,
  milestone: Milestone,
  apiKey: string,
  memoryContext?: { totalSeen: number; avgComposite: number; directions: string[] }
): Promise<ClassificationResult | null> {
  const memoryHint = memoryContext
    ? `\n\nMEMORY CONTEXT (from prior classifications this run for "${milestone.title}"):\n- ${memoryContext.totalSeen} articles previously classified\n- Average composite: ${memoryContext.avgComposite.toFixed(3)}\n- Direction trend: ${memoryContext.directions.slice(-5).join(", ")}\nUse this to calibrate your assessment — if many articles support/contradict, weigh corroboration vs. redundancy.`
    : "";

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

Be SELECTIVE. Most articles are NOT relevant to most milestones.${memoryHint}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s per call
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
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
                relevant: { type: "boolean" },
                direction: { type: "string", enum: ["supports", "contradicts", "ambiguous"] },
                evidence_type: { type: "string", enum: ["peer_reviewed", "preprint", "government", "journalism", "trade_press", "press_release", "vendor_blog", "financial", "unknown"] },
                credibility: { type: "number" },
                consensus: { type: "number" },
                criteria_match: { type: "number" },
                summary: { type: "string" },
              },
              required: ["relevant", "direction", "evidence_type", "credibility", "consensus", "criteria_match", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classify_evidence" } },
      }),
    });
    clearTimeout(timeout);

    if (!resp.ok) { await resp.text(); return null; }
    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return null;
    return JSON.parse(toolCall.function.arguments);
  } catch { return null; }
}

const MAX_AI_CALLS = 15; // Cap to stay within edge function timeout (~60s)
const PARALLEL_BATCH_SIZE = 5; // Concurrent AI calls per batch

const classifyNode: NodeFn = async (state) => {
  const classifications: GraphState["classifications"] = [];
  let aiCallsMade = 0;
  let aiCallsFailed = 0;

  // Build all (article, milestone) pairs first, then process in parallel batches
  const pairs: { article: Article; milestone: Milestone }[] = [];
  for (const article of state.uniqueArticles) {
    const articleText = `${article.title} ${article.description}`.toLowerCase();
    const candidateMilestones = state.milestones.filter(m => {
      const msText = `${m.title} ${m.description || ""} ${m.success_criteria || ""}`.toLowerCase();
      const words = msText.split(/\s+/).filter(w => w.length > 4);
      return words.filter(w => articleText.includes(w)).length >= 2;
    }).slice(0, 3);

    for (const milestone of candidateMilestones) {
      pairs.push({ article, milestone });
    }
  }

  // Cap total pairs to avoid timeout
  const capped = pairs.slice(0, MAX_AI_CALLS);
  await logToScout(state, "classify_plan", { totalPairs: pairs.length, capped: capped.length });

  // Process in parallel batches
  for (let i = 0; i < capped.length; i += PARALLEL_BATCH_SIZE) {
    const batch = capped.slice(i, i + PARALLEL_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async ({ article, milestone }) => {
        const memCtx = state.memory.get(milestone.id);
        const result = await classifyWithAI(article, milestone, state.apiKey, memCtx || undefined);
        return { article, milestone, result };
      })
    );

    for (const r of results) {
      aiCallsMade++;
      if (r.status === "rejected" || !r.value.result) { aiCallsFailed++; continue; }
      const { article, milestone, result } = r.value;
      if (!result.relevant) continue;

      classifications.push({ article, milestone, result });

      // Update memory for this milestone
      const prev = state.memory.get(milestone.id) || { totalSeen: 0, avgComposite: 0, directions: [] };
      const newComposite = result.credibility * result.consensus * result.criteria_match;
      const newTotal = prev.totalSeen + 1;
      const newAvg = (prev.avgComposite * prev.totalSeen + newComposite) / newTotal;
      state.memory.set(milestone.id, {
        totalSeen: newTotal,
        avgComposite: newAvg,
        directions: [...prev.directions, result.direction],
      });
    }
  }

  return { ...state, classifications, aiCallsMade, aiCallsFailed };
};

// ═══════════════════════════════════════════════════════════════
// NODE 3: SCORE — compute v3 composite scores
// ═══════════════════════════════════════════════════════════════

const scoreNode: NodeFn = async (state) => {
  const scored: ScoredEvidence[] = state.classifications.map(({ article, milestone, result }) => {
    const publisherTier = getPublisherTier(article.link || article.source);
    const recency = computeRecency(article.pubDate);
    const composite = result.credibility * recency * result.consensus * result.criteria_match;
    const deltaLogOdds = computeDeltaLogOdds(result.direction, composite);
    return { article, milestone, classification: result, publisherTier, recency, composite, deltaLogOdds };
  });

  return { ...state, scoredEvidence: scored };
};

// ═══════════════════════════════════════════════════════════════
// NODE 4: AUTO-COMMIT — route high-confidence evidence directly
// ═══════════════════════════════════════════════════════════════

const AUTO_COMMIT_THRESHOLD = 0.75;

const autoCommitNode: NodeFn = async (state) => {
  let autoCommittedCount = 0;
  const committedMilestoneIds: string[] = [];

  for (const ev of state.scoredEvidence) {
    if (ev.composite < AUTO_COMMIT_THRESHOLD) continue;

    try {
      const msApiUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/milestones-api/${ev.milestone.id}/evidence`;
      const resp = await fetch(msApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          direction: ev.classification.direction,
          credibility: ev.classification.credibility,
          consensus: ev.classification.consensus,
          criteria_match: ev.classification.criteria_match,
          recency: ev.recency,
          source: ev.article.link || ev.article.source,
          type: ev.classification.evidence_type,
          summary: ev.classification.summary,
          date: new Date().toISOString().split("T")[0],
          raw_sources: [{ url: ev.article.link, publisher: ev.article.source, snippet: ev.article.description?.slice(0, 500) }],
        }),
      });

      if (resp.ok) {
        ev.autoCommitted = true;
        autoCommittedCount++;
        committedMilestoneIds.push(ev.milestone.id);
      } else {
        const errText = await resp.text();
        await logToScout(state, "auto_commit_failed", { milestone_id: ev.milestone.id, status: resp.status, error: errText.slice(0, 200) });
      }
    } catch (e) {
      await logToScout(state, "auto_commit_error", { milestone_id: ev.milestone.id, error: String(e).slice(0, 200) });
    }
  }

  await logToScout(state, "node_auto_commit", { count: autoCommittedCount, milestone_ids: committedMilestoneIds });

  return { ...state, autoCommittedCount };
};

// ═══════════════════════════════════════════════════════════════
// NODE 5: QUEUE — insert remaining into pending_evidence + Slack notify
// ═══════════════════════════════════════════════════════════════

const queueNode: NodeFn = async (state) => {
  let queuedCount = 0;

  for (const ev of state.scoredEvidence) {
    if (ev.autoCommitted) continue;
    const row = {
      milestone_id: ev.milestone.id,
      source: ev.article.source,
      source_url: ev.article.link,
      direction: ev.classification.direction,
      evidence_type: ev.classification.evidence_type,
      publisher_tier: ev.publisherTier,
      credibility: ev.classification.credibility,
      consensus: ev.classification.consensus,
      criteria_match: ev.classification.criteria_match,
      recency: ev.recency,
      composite_score: ev.composite,
      summary: ev.classification.summary,
      raw_snippet: ev.article.description?.slice(0, 1000),
      status: "pending",
      scout_run_id: state.runId,
    };

    await state.supabase.from("pending_evidence").insert(row);
    queuedCount++;
  }

  // Slack notification for high-signal items (composite >= 0.5)
  const highSignalItems = state.scoredEvidence.filter(e => e.composite >= 0.5);

  if (highSignalItems.length > 0 && state.slackApiKey) {
    const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";
    const msIds = [...new Set(highSignalItems.map(i => i.milestone.id))];
    const { data: msData } = await state.supabase.from("milestones").select("id, title, posterior, prior").in("id", msIds);
    const msMap: Record<string, { title: string; posterior: number; prior: number }> = {};
    (msData || []).forEach((m: any) => { msMap[m.id] = m; });

    const blocks: any[] = [
      { type: "header", text: { type: "plain_text", text: `🔬 Evidence Scout — ${highSignalItems.length} high-signal finding${highSignalItems.length > 1 ? "s" : ""}`, emoji: true } },
      { type: "divider" },
    ];

    for (const item of highSignalItems.slice(0, 10)) {
      const ms = msMap[item.milestone.id];
      const title = ms?.title || item.milestone.id;
      const dirEmoji = item.classification.direction === "supports" ? "↑" : item.classification.direction === "contradicts" ? "↓" : "↔";
      const pChange = ms ? `P(X): ${(ms.prior * 100).toFixed(0)}% → ${(ms.posterior * 100).toFixed(0)}%` : "";
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${dirEmoji} ${title}*${pChange ? `  ·  ${pChange}` : ""}\nComposite: \`${item.composite.toFixed(3)}\`  ·  ${item.classification.direction}\n${item.classification.summary || "_No summary_"}`,
        },
        accessory: item.article.link ? {
          type: "button",
          text: { type: "plain_text", text: "View Source ↗", emoji: true },
          url: item.article.link,
          action_id: `view_source_${item.milestone.id}`,
        } : undefined,
      });
    }

    blocks.push(
      { type: "divider" },
      { type: "context", elements: [{ type: "mrkdwn", text: `_Run ${state.runId.slice(0, 8)} · ${new Date().toISOString().split("T")[0]} · LangGraph orchestration · <https://lovable.dev|View in Observatory>_` }] },
    );

    const fallbackText = `🔬 Evidence Scout: ${highSignalItems.length} high-signal finding(s)`;

    try {
      const slackResp = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${state.apiKey}`,
          "X-Connection-Api-Key": state.slackApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: "#evidence-scout",
          text: fallbackText,
          blocks,
          username: "ÆETH Evidence Scout",
          icon_emoji: ":telescope:",
        }),
      });
      const slackData = await slackResp.json();
      if (!slackResp.ok || !slackData.ok) {
        await logToScout(state, "slack_error", { status: slackResp.status, error: slackData.error });
      } else {
        await logToScout(state, "slack_notified", { channel: "#evidence-scout", items: highSignalItems.length });
      }
    } catch (e) {
      await logToScout(state, "slack_error", { error: String(e).slice(0, 200) });
    }
  }

  return { ...state, queuedCount, highSignalItems };
};

// ═══════════════════════════════════════════════════════════════
// GRAPH RUNNER — executes nodes in sequence with tracing
// ═══════════════════════════════════════════════════════════════

const tracedSearch = traceNode("search", searchNode);
const tracedClassify = traceNode("classify", classifyNode);
const tracedScore = traceNode("score", scoreNode);
const tracedAutoCommit = traceNode("autoCommit", autoCommitNode);
const tracedQueue = traceNode("queue", queueNode);

export async function runGraph(initialState: GraphState): Promise<GraphState> {
  let state = initialState;
  state = await tracedSearch(state);
  state = await tracedClassify(state);
  state = await tracedScore(state);
  state = await tracedAutoCommit(state);
  state = await tracedQueue(state);
  return state;
}
