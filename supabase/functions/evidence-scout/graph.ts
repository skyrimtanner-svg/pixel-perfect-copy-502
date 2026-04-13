/**
 * LangGraph-style stateful multi-step reasoning graph for Evidence Scout.
 * Nodes: search → classify → score → queue
 * Features: in-run memory for milestone classification history, per-node tracing.
 * Scout Directives: reads admin-configured scoring weights and auto-commit rules from DB.
 * v2: Weighted contradiction pressure, tiered auto-approve, queue_reason taxonomy.
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
  contradictionPressure: number;
  autoCommitted?: boolean;
  queueReason?: string;
}

// ═══════════════════════════════════════════════════════════════
// SCOUT DIRECTIVES — parsed from DB markdown
// ═══════════════════════════════════════════════════════════════

interface ScoringWeights {
  credibility: number;
  recency: number;
  consensus: number;
  criteria_match: number;
}

interface AutoCommitConfig {
  autoCommitThreshold: number;
  lowRiskThreshold: number;
  pendingFloor: number;
  softDiscardFloor: number;
  blockContradictAutoCommit: boolean;
}

interface DomainPriority {
  domain: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ParsedDirectives {
  scoringWeights: ScoringWeights;
  autoCommitConfig: AutoCommitConfig;
  domainPriorities: DomainPriority[];
  directiveVersions: Record<string, string>;
}

const DEFAULT_WEIGHTS: ScoringWeights = { credibility: 0.25, recency: 0.25, consensus: 0.25, criteria_match: 0.25 };
const DEFAULT_AUTO_COMMIT: AutoCommitConfig = {
  autoCommitThreshold: 0.85,
  lowRiskThreshold: 0.72,
  pendingFloor: 0.40,
  softDiscardFloor: 0.20,
  blockContradictAutoCommit: true,
};

function parseWeightsFromMarkdown(md: string): ScoringWeights {
  const weights = { ...DEFAULT_WEIGHTS };
  const lines = md.split('\n');
  for (const line of lines) {
    const match = line.match(/-\s*(credibility|recency|consensus|criteria_match)\s*:\s*([\d.]+)/i);
    if (match) {
      const key = match[1].toLowerCase() as keyof ScoringWeights;
      const val = parseFloat(match[2]);
      if (!isNaN(val) && val >= 0 && val <= 1) weights[key] = val;
    }
  }
  const sum = weights.credibility + weights.recency + weights.consensus + weights.criteria_match;
  if (sum > 0) {
    weights.credibility /= sum;
    weights.recency /= sum;
    weights.consensus /= sum;
    weights.criteria_match /= sum;
  }
  return weights;
}

function parseAutoCommitFromMarkdown(md: string): AutoCommitConfig {
  const config = { ...DEFAULT_AUTO_COMMIT };
  const lines = md.split('\n');
  for (const line of lines) {
    const autoMatch = line.match(/composite_score\s*>=?\s*([\d.]+)\s*:\s*auto[_-]?commit/i);
    if (autoMatch) config.autoCommitThreshold = parseFloat(autoMatch[1]);
    const floorMatch = line.match(/composite_score\s*([\d.]+)\s*-\s*([\d.]+)\s*:/i);
    if (floorMatch) config.pendingFloor = parseFloat(floorMatch[1]);
    if (/never\s+auto[_-]?commit.*contradict/i.test(line)) config.blockContradictAutoCommit = true;
  }
  return config;
}

function parseDomainPrioritiesFromMarkdown(md: string): DomainPriority[] {
  const priorities: DomainPriority[] = [];
  const lines = md.split('\n');
  for (const line of lines) {
    const match = line.match(/-\s*(compute|energy|biology|connectivity|manufacturing)\s*:\s*(HIGH|MEDIUM|LOW)/i);
    if (match) {
      priorities.push({ domain: match[1].toLowerCase(), level: match[2].toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW' });
    }
  }
  return priorities;
}

async function loadDirectives(supabase: SupabaseClient): Promise<ParsedDirectives> {
  const { data } = await supabase.from("scout_directives").select("key, value, updated_at");
  const map = new Map((data || []).map((d: any) => [d.key, d]));
  const versions: Record<string, string> = {};
  (data || []).forEach((d: any) => { versions[d.key] = d.updated_at; });

  return {
    scoringWeights: map.has('scoring_weights')
      ? parseWeightsFromMarkdown(map.get('scoring_weights').value)
      : DEFAULT_WEIGHTS,
    autoCommitConfig: map.has('auto_commit_rules')
      ? parseAutoCommitFromMarkdown(map.get('auto_commit_rules').value)
      : DEFAULT_AUTO_COMMIT,
    domainPriorities: map.has('domain_priorities')
      ? parseDomainPrioritiesFromMarkdown(map.get('domain_priorities').value)
      : [],
    directiveVersions: versions,
  };
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

  milestones: Milestone[];
  articles: Article[];
  uniqueArticles: Article[];
  classifications: { article: Article; milestone: Milestone; result: ClassificationResult }[];
  scoredEvidence: ScoredEvidence[];
  queuedCount: number;
  autoCommittedCount: number;
  highSignalItems: any[];

  memory: Map<string, { totalSeen: number; avgComposite: number; directions: string[] }>;
  sourceSummary: Record<string, { fetched: number; errors: number }>;
  aiCallsMade: number;
  aiCallsFailed: number;
  directives?: ParsedDirectives;
}

// ═══════════════════════════════════════════════════════════════
// NODE TRACER
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
// CONSTANTS
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

function computeWeightedComposite(
  credibility: number,
  recency: number,
  consensus: number,
  criteriaMatch: number,
  weights: ScoringWeights,
): number {
  return (
    credibility * weights.credibility +
    recency * weights.recency +
    consensus * weights.consensus +
    criteriaMatch * weights.criteria_match
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTRADICTION PRESSURE — weighted, not counted
// ═══════════════════════════════════════════════════════════════

async function computeContradictionPressure(
  supabase: SupabaseClient,
  milestoneId: string,
  direction: string,
): Promise<number> {
  if (direction === "ambiguous") return 0;

  // Fetch existing committed evidence for this milestone
  const { data: existing } = await supabase
    .from("evidence")
    .select("direction, credibility, criteria_match, delta_log_odds")
    .eq("milestone_id", milestoneId);

  if (!existing || existing.length === 0) return 0;

  // Opposing direction
  const opposing = direction === "supports" ? "contradicts" : "supports";

  let pressure = 0;
  for (const e of existing) {
    if (e.direction === opposing) {
      // pressure = Σ(credibility × criteria_match × |delta_log_odds| / 2)
      const cred = e.credibility || 0.5;
      const relevance = e.criteria_match || 0.5;
      const strength = Math.min(1, Math.abs(e.delta_log_odds || 0) / 2);
      pressure += cred * relevance * strength;
    }
  }

  return Math.min(1, pressure); // Cap at 1
}

// ═══════════════════════════════════════════════════════════════
// QUEUE REASON TAXONOMY
// ═══════════════════════════════════════════════════════════════

type QueueReason =
  | 'auto_commit_high_confidence'
  | 'auto_commit_low_risk'
  | 'forced_human_review_contradiction_pressure'
  | 'human_review_standard'
  | 'human_review_high_value_domain'
  | 'soft_discard_low_value'
  | 'discarded_below_floor'
  | 'blocked_contradict_auto_commit';

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
// NODE 0: LOAD DIRECTIVES
// ═══════════════════════════════════════════════════════════════

const loadDirectivesNode: NodeFn = async (state) => {
  const directives = await loadDirectives(state.supabase);
  await logToScout(state, "directives_loaded", {
    weights: directives.scoringWeights,
    autoCommit: directives.autoCommitConfig,
    domainPriorities: directives.domainPriorities,
    versions: directives.directiveVersions,
  });
  return { ...state, directives };
};

// ═══════════════════════════════════════════════════════════════
// NODE 1: SEARCH
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

  const seenInRun = new Set<string>();
  const unique = articles.filter(a => {
    if (!a.link || a.link.length <= 5) return false;
    if (existingUrls.has(a.link) || existingSources.has(a.link)) return false;
    const normalizedUrl = a.link.toLowerCase().replace(/\/+$/, '').replace(/^https?:\/\//, '');
    if (seenInRun.has(normalizedUrl)) return false;
    seenInRun.add(normalizedUrl);
    return true;
  }).slice(0, 60);

  return { ...state, articles, uniqueArticles: unique, sourceSummary };
};

// ═══════════════════════════════════════════════════════════════
// NODE 2: CLASSIFY
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

  const MAX_RETRIES = 2;
  const RETRY_DELAYS = [1000, 2000];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
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

      if (!resp.ok) {
        const body = await resp.text();
        if ((resp.status === 429 || resp.status >= 500) && attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
          continue;
        }
        return null;
      }
      const data = await resp.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) return null;
      return JSON.parse(toolCall.function.arguments);
    } catch {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      return null;
    }
  }
  return null;
}

const MAX_AI_CALLS = 15;
const PARALLEL_BATCH_SIZE = 5;
const BATCH_SPACING_MS = 200;

const classifyNode: NodeFn = async (state) => {
  const classifications: GraphState["classifications"] = [];
  let aiCallsMade = 0;
  let aiCallsFailed = 0;

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

  const capped = pairs.slice(0, MAX_AI_CALLS);
  await logToScout(state, "classify_plan", { totalPairs: pairs.length, capped: capped.length });

  for (let i = 0; i < capped.length; i += PARALLEL_BATCH_SIZE) {
    if (i > 0) await new Promise(r => setTimeout(r, BATCH_SPACING_MS));
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
// NODE 3: SCORE — compute weighted composite + contradiction pressure
// ═══════════════════════════════════════════════════════════════

const scoreNode: NodeFn = async (state) => {
  const weights = state.directives?.scoringWeights || DEFAULT_WEIGHTS;

  const scored: ScoredEvidence[] = [];

  for (const { article, milestone, result } of state.classifications) {
    const publisherTier = getPublisherTier(article.link || article.source);
    const recency = computeRecency(article.pubDate);
    const composite = computeWeightedComposite(
      result.credibility, recency, result.consensus, result.criteria_match, weights
    );
    const deltaLogOdds = computeDeltaLogOdds(result.direction, composite);
    const contradictionPressure = await computeContradictionPressure(
      state.supabase, milestone.id, result.direction
    );

    scored.push({
      article, milestone, classification: result,
      publisherTier, recency, composite, deltaLogOdds,
      contradictionPressure,
    });
  }

  await logToScout(state, "score_weights_applied", {
    weights,
    scoredCount: scored.length,
    avgContradictionPressure: scored.length > 0
      ? (scored.reduce((s, e) => s + e.contradictionPressure, 0) / scored.length).toFixed(3)
      : 0,
  });

  return { ...state, scoredEvidence: scored };
};

// ═══════════════════════════════════════════════════════════════
// NODE 4: AUTO-COMMIT — tiered with contradiction pressure gating
// ═══════════════════════════════════════════════════════════════

const autoCommitNode: NodeFn = async (state) => {
  const config = state.directives?.autoCommitConfig || DEFAULT_AUTO_COMMIT;
  const domainPriorities = state.directives?.domainPriorities || [];
  let autoCommittedCount = 0;
  const committedMilestoneIds: string[] = [];

  for (const ev of state.scoredEvidence) {
    // ── Determine if this qualifies for auto-commit ──
    let reason: QueueReason | null = null;

    if (ev.composite >= config.autoCommitThreshold) {
      // Tier 1: High confidence (≥ 0.85)
      if (config.blockContradictAutoCommit && ev.classification.direction === 'contradicts') {
        ev.queueReason = 'blocked_contradict_auto_commit';
        await logToScout(state, "auto_commit_blocked_contradict", {
          milestone_id: ev.milestone.id, composite: ev.composite,
        });
        continue;
      }
      // Check contradiction pressure
      if (ev.contradictionPressure > 0.60) {
        ev.queueReason = 'forced_human_review_contradiction_pressure';
        await logToScout(state, "auto_commit_blocked_pressure", {
          milestone_id: ev.milestone.id, composite: ev.composite,
          contradictionPressure: ev.contradictionPressure,
        });
        continue;
      }
      reason = 'auto_commit_high_confidence';
    } else if (ev.composite >= config.lowRiskThreshold) {
      // Tier 2: Low-risk auto-commit (0.72–0.85)
      // Only if: no contradiction pressure, high source credibility, non-sensitive milestone
      const highCredSource = ev.publisherTier <= 2;
      const lowPressure = ev.contradictionPressure < 0.30;
      const domainPri = domainPriorities.find(d => d.domain === ev.milestone.domain);
      const notSensitive = !domainPri || domainPri.level !== 'HIGH';

      if (highCredSource && lowPressure && notSensitive) {
        if (config.blockContradictAutoCommit && ev.classification.direction === 'contradicts') {
          ev.queueReason = 'blocked_contradict_auto_commit';
          continue;
        }
        reason = 'auto_commit_low_risk';
      }
    }

    if (!reason) continue;

    // ── Commit evidence ──
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
        ev.queueReason = reason;
        autoCommittedCount++;
        committedMilestoneIds.push(ev.milestone.id);

        // Log to trust ledger with full provenance
        await logToScout(state, "auto_committed", {
          milestone_id: ev.milestone.id,
          reason,
          original_score: ev.composite,
          contradiction_pressure: ev.contradictionPressure,
          source_credibility: TIER_WEIGHTS[ev.publisherTier] || 0.15,
          publisher_tier: ev.publisherTier,
          direction: ev.classification.direction,
          actor: 'system_auto_commit',
        });
      } else {
        const errText = await resp.text();
        await logToScout(state, "auto_commit_failed", { milestone_id: ev.milestone.id, status: resp.status, error: errText.slice(0, 200) });
      }
    } catch (e) {
      await logToScout(state, "auto_commit_error", { milestone_id: ev.milestone.id, error: String(e).slice(0, 200) });
    }
  }

  await logToScout(state, "node_auto_commit", {
    count: autoCommittedCount,
    milestone_ids: committedMilestoneIds,
    thresholds: {
      high: config.autoCommitThreshold,
      lowRisk: config.lowRiskThreshold,
    },
    blockContradict: config.blockContradictAutoCommit,
  });

  return { ...state, autoCommittedCount };
};

// ═══════════════════════════════════════════════════════════════
// NODE 5: QUEUE — tiered routing with queue_reason + contradiction pressure
// ═══════════════════════════════════════════════════════════════

const queueNode: NodeFn = async (state) => {
  const config = state.directives?.autoCommitConfig || DEFAULT_AUTO_COMMIT;
  const domainPriorities = state.directives?.domainPriorities || [];
  let queuedCount = 0;
  let discardedCount = 0;

  for (const ev of state.scoredEvidence) {
    if (ev.autoCommitted) continue;

    // Determine queue reason and whether to insert
    let queueReason: QueueReason;

    if (ev.composite >= config.pendingFloor) {
      // Standard human review (0.40–0.85 range, or blocked auto-commits)
      if (ev.queueReason === 'forced_human_review_contradiction_pressure') {
        queueReason = 'forced_human_review_contradiction_pressure';
      } else if (ev.queueReason === 'blocked_contradict_auto_commit') {
        queueReason = 'blocked_contradict_auto_commit';
      } else {
        queueReason = 'human_review_standard';
      }
    } else if (ev.composite >= config.softDiscardFloor) {
      // Soft discard zone (0.20–0.40): keep if high-value domain or high-credibility source
      const isHighValueDomain = domainPriorities.some(d => d.domain === ev.milestone.domain && d.level === 'HIGH');
      const isHighCredSource = ev.publisherTier <= 2;

      if (isHighValueDomain || isHighCredSource) {
        queueReason = 'human_review_high_value_domain';
      } else {
        queueReason = 'soft_discard_low_value';
        discardedCount++;
        await logToScout(state, "soft_discard", {
          milestone_id: ev.milestone.id, composite: ev.composite,
          reason: queueReason, source: ev.article.source,
        });
        continue; // Don't insert
      }
    } else {
      // Below floor (< 0.20): discard
      queueReason = 'discarded_below_floor';
      discardedCount++;
      continue;
    }

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
      decayed_score: ev.composite, // Fresh items: decayed = original
      contradiction_pressure: ev.contradictionPressure,
      queue_reason: queueReason,
      summary: ev.classification.summary,
      raw_snippet: ev.article.description?.slice(0, 1000),
      status: "pending",
      scout_run_id: state.runId,
    };

    await state.supabase.from("pending_evidence").insert(row);
    queuedCount++;
  }

  // Slack notification for high-signal items
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
          text: `*${dirEmoji} ${title}*${pChange ? `  ·  ${pChange}` : ""}\nComposite: \`${item.composite.toFixed(3)}\`  ·  ${item.classification.direction}  ·  Pressure: \`${item.contradictionPressure.toFixed(2)}\`\n${item.classification.summary || "_No summary_"}`,
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
      { type: "context", elements: [{ type: "mrkdwn", text: `_Run ${state.runId.slice(0, 8)} · ${new Date().toISOString().split("T")[0]} · LangGraph v2 · Auto-committed: ${state.autoCommittedCount} · Discarded: ${discardedCount} · <https://lovable.dev|View in Observatory>_` }] },
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

  await logToScout(state, "node_queue_summary", {
    queued: queuedCount,
    discarded: discardedCount,
    autoCommitted: state.autoCommittedCount,
  });

  return { ...state, queuedCount, highSignalItems };
};

// ═══════════════════════════════════════════════════════════════
// GRAPH RUNNER
// ═══════════════════════════════════════════════════════════════

const tracedLoadDirectives = traceNode("loadDirectives", loadDirectivesNode);
const tracedSearch = traceNode("search", searchNode);
const tracedClassify = traceNode("classify", classifyNode);
const tracedScore = traceNode("score", scoreNode);
const tracedAutoCommit = traceNode("autoCommit", autoCommitNode);
const tracedQueue = traceNode("queue", queueNode);

export async function runGraph(initialState: GraphState): Promise<GraphState> {
  let state = initialState;
  state = await tracedLoadDirectives(state);
  state = await tracedSearch(state);
  state = await tracedClassify(state);
  state = await tracedScore(state);
  state = await tracedAutoCommit(state);
  state = await tracedQueue(state);
  return state;
}
