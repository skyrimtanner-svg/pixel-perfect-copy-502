import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════
// v3.0 CONSTANTS (from TechAccelDashboard v3 spec)
// ═══════════════════════════════════════════════════════════════

const STATUS_BOUNDS: Record<string, number> = {
  projected: 0.00, evidence_emerging: 0.17, in_progress: 0.33,
  demonstrated: 0.50, deployed: 0.70, accomplished: 0.88,
};
const STATUS_BOUNDS_UPPER = 1.00;
const STATUS_ORDER = [
  "projected","evidence_emerging","in_progress","demonstrated","deployed","accomplished"
];
const LATENT_TAU0 = 0.20;
const LATENT_W_MIN = 0.05;
const LATENT_INIT_SIGMA = 0.25;
const CONFLICT = { TAU_MULTIPLIER: 2.5, SIGMA_FLOOR_RATIO: 0.95 };
const DECAY = {
  lambda: 0.0065, falsify_ratio: 0.6, ambiguous_ratio: 0.8,
  base_floor: 0.05,
  get falsify_floor() { return this.base_floor / this.falsify_ratio; },
};
const TIER_WEIGHTS: Record<number, number> = { 1: 1.0, 2: 0.75, 3: 0.45, 4: 0.15 };
const WIRE_WEIGHT_CAP = 0.30;
const DOMAIN_GRAPH: Record<string, Record<string, number>> = {
  compute:       { biology: 0.35, connectivity: 0.15, energy: 0.10, manufacturing: 0.08 },
  biology:       { compute: 0.20, manufacturing: 0.10 },
  manufacturing: { energy: 0.18, compute: 0.05 },
  energy:        { compute: 0.12, manufacturing: 0.05 },
  connectivity:  { compute: 0.10 },
};
const COUPLING_ALPHA = 0.07;
const CALIB = {
  g: 0.20, G_MIN: 1.0, G_MAX: 5.0, h_days: 180,
  CRPS_process_noise: 0.02, FORWARD_PROCESS_NOISE: 0.008,
  MOMENTUM_DAMPING: 0.25, MOMENTUM_MIN_SPAN_DAYS: 30,
  MOMENTUM_DECAY_LAMBDA: 0.002,
  TIER_NOISE_MULTIPLIER: { active: 1.0, plausible: 1.3, speculative: 1.7 } as Record<string, number>,
};

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

// ═══════════════════════════════════════════════════════════════
// v3.0 ENGINE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getPublisherTier(url?: string, publisher?: string): number {
  const check = ((url || "") + " " + (publisher || "")).toLowerCase();
  for (const [key, tier] of Object.entries(PUBLISHER_TIER_MAP)) {
    if (check.includes(key)) return tier;
  }
  return 4;
}

function classifyEvidenceType(url?: string, publisher?: string, snippet?: string): { type: string; weight: number } {
  const check = ((url || "") + " " + (publisher || "") + " " + (snippet || "")).toLowerCase();
  for (const rule of EVIDENCE_TYPE_RULES) {
    if (rule.patterns.length === 0) return rule; // unknown fallback
    if (rule.patterns.some(p => check.includes(p))) return rule;
  }
  return { type: "unknown", weight: 0.30 };
}

function statusIndex(status: string): number {
  return STATUS_ORDER.indexOf(status);
}

function latentToStatus(mu: number): string {
  const entries = Object.entries(STATUS_BOUNDS).reverse();
  for (const [status, bound] of entries) {
    if (mu >= bound) return status;
  }
  return "projected";
}

function computeFreshnessWeight(publishedAt?: string, polarity?: string): number {
  if (!publishedAt) return 0.3;
  const ageDays = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);
  let lambda = DECAY.lambda;
  if (polarity === "falsify" || polarity === "contradicts") lambda *= DECAY.falsify_ratio;
  else if (polarity === "ambiguous") lambda *= DECAY.ambiguous_ratio;
  const floor = (polarity === "falsify" || polarity === "contradicts") ? DECAY.falsify_floor : DECAY.base_floor;
  return Math.max(floor, Math.exp(-lambda * Math.max(0, ageDays)));
}

function computeCredibilityScore(sources: any[]): {
  score: number; tier: number; breakdown: any[];
  independentCount: number; wireCapActivated: boolean;
} {
  if (!sources || sources.length === 0) return { score: 0, tier: 4, breakdown: [], independentCount: 0, wireCapActivated: false };
  
  const breakdown = sources.map(s => {
    const tier = getPublisherTier(s.url, s.publisher || s.source);
    const evType = classifyEvidenceType(s.url, s.publisher || s.source, s.snippet || s.summary);
    return { ...s, tier, evidenceType: evType.type, evidenceWeight: evType.weight, driftMul: 1.0 };
  });

  const rawWeights = breakdown.map(b => ({
    ...b, rawWeight: (TIER_WEIGHTS[b.tier] || 0.1) * b.evidenceWeight * b.driftMul,
    _isWire: false,
  }));
  
  const wireTotal = rawWeights.filter(w => w._isWire).reduce((s, w) => s + w.rawWeight, 0);
  const nonWireTotal = rawWeights.filter(w => !w._isWire).reduce((s, w) => s + w.rawWeight, 0);
  const nonWireMax = rawWeights.filter(w => !w._isWire).reduce((mx, w) => Math.max(mx, w.rawWeight), 0);
  const wireCap = nonWireMax > 0 ? nonWireMax * WIRE_WEIGHT_CAP : WIRE_WEIGHT_CAP;
  const wireCapActivated = wireTotal > wireCap;
  const totalWeight = nonWireTotal + Math.min(wireTotal, wireCap);
  const maxPossible = breakdown.length;
  const score = Math.min(1, totalWeight / Math.max(1, maxPossible));
  const bestTier = Math.min(...breakdown.map(b => b.tier));

  return { score, tier: bestTier, breakdown, independentCount: sources.length, wireCapActivated };
}

interface LatentState { mu: number; sigma: number; }

function initLatentState(milestone: any): LatentState {
  const sIdx = statusIndex(milestone.status);
  const bounds = Object.values(STATUS_BOUNDS);
  let mu: number;
  if (milestone.status === "accomplished") mu = 0.94;
  else if (sIdx >= 0 && sIdx < bounds.length - 1) mu = (bounds[sIdx] + bounds[sIdx + 1]) / 2;
  else mu = 0.08;
  return { mu, sigma: milestone.tier === "historical" ? 0.02 : LATENT_INIT_SIGMA };
}

function updateLatent(
  prior: LatentState, recommendedStatus: string, adjustedConfidence: number, hasConflict: boolean
) {
  const statusKeys = Object.keys(STATUS_BOUNDS);
  const sIdx = statusKeys.indexOf(recommendedStatus);
  const L = STATUS_BOUNDS[recommendedStatus] || 0;
  const U = sIdx < statusKeys.length - 1 ? STATUS_BOUNDS[statusKeys[sIdx + 1]] : STATUS_BOUNDS_UPPER;
  const c = Math.max(LATENT_W_MIN, adjustedConfidence);
  const zHat = (1 - c) * L + c * U;
  const w = Math.max(LATENT_W_MIN, adjustedConfidence);
  const baseTau = LATENT_TAU0 / w;
  let tau = baseTau;
  if (hasConflict) tau *= CONFLICT.TAU_MULTIPLIER;
  
  const priorPrec = 1 / (prior.sigma ** 2);
  const obsPrec = 1 / (tau ** 2);
  const postVar = 1 / (priorPrec + obsPrec);
  const postMu = postVar * (prior.mu * priorPrec + zHat * obsPrec);
  let postSigma = Math.sqrt(postVar);
  if (hasConflict) postSigma = Math.max(postSigma, prior.sigma * CONFLICT.SIGMA_FLOOR_RATIO);
  
  const clampedMu = Math.max(0, Math.min(1, postMu));
  const candidateStatus = latentToStatus(clampedMu);
  const boundaryCrossed = candidateStatus !== latentToStatus(prior.mu);

  return {
    mu: clampedMu, sigma: postSigma, zHat, tau, L, U,
    candidateStatus, boundaryCrossed,
    priorMu: prior.mu, priorSigma: prior.sigma,
  };
}

function propagateCoupling(
  sourceDomain: string, delta: number, allMilestones: any[]
): { receipts: any[]; updates: Record<string, number> } {
  const edges = DOMAIN_GRAPH[sourceDomain];
  if (!edges || Math.abs(delta) < 0.001) return { receipts: [], updates: {} };
  const receipts: any[] = [];
  const updates: Record<string, number> = {};
  
  for (const [targetDomain, weight] of Object.entries(edges)) {
    const contribution = COUPLING_ALPHA * weight * delta;
    const clampedContrib = Math.max(-0.05, Math.min(0.05, contribution));
    const targetMs = allMilestones.filter(m => m.domain === targetDomain && m.tier !== "historical");
    for (const m of targetMs) {
      if (!updates[m.id]) updates[m.id] = 0;
      updates[m.id] += clampedContrib;
    }
    receipts.push({ edge: `${sourceDomain}→${targetDomain}`, weight, rawContribution: contribution, clamped: clampedContrib, affectedCount: targetMs.length });
  }
  return { receipts, updates };
}

function scoreSignalDominance(evidence: any[]): {
  confirmCount: number; confirmScore: number;
  falsifyCount: number; falsifyScore: number;
  ratioCount: number; ratioScore: number;
  dominanceFlagCount: boolean; dominanceFlagScore: boolean;
} {
  const confirms = evidence.filter(e => e.direction === "supports");
  const falsifies = evidence.filter(e => e.direction === "contradicts");
  
  const confirmScore = confirms.reduce((s, e) => s + Math.abs(e.composite || e.delta_log_odds || 0), 0);
  const falsifyScore = falsifies.reduce((s, e) => s + Math.abs(e.composite || e.delta_log_odds || 0), 0);
  const EPS = 0.001;
  const ratioCount = falsifies.length / Math.max(confirms.length, 1);
  const ratioScore = falsifyScore / Math.max(confirmScore, EPS);

  return {
    confirmCount: confirms.length, confirmScore,
    falsifyCount: falsifies.length, falsifyScore,
    ratioCount, ratioScore,
    dominanceFlagCount: falsifies.length > 0 && falsifies.length > confirms.length,
    dominanceFlagScore: falsifyScore >= 0.8 && ratioScore >= 1.5,
  };
}

function logOdds(p: number): number {
  const clamped = Math.max(0.0001, Math.min(0.9999, p));
  return Math.log(clamped / (1 - clamped));
}

function fromLogOdds(lo: number): number {
  return 1 / (1 + Math.exp(-lo));
}

function standardNormalCDF(z: number): number {
  if (z >= 8.0) return 1.0;
  if (z <= -8.0) return 0.0;
  const abs_z = Math.abs(z);
  const p = 0.3275911;
  const t = 1.0 / (1.0 + p * abs_z);
  const t2 = t * t; const t3 = t2 * t; const t4 = t3 * t; const t5 = t4 * t;
  const erfcApprox = (0.254829592 * t - 0.284496736 * t2 + 1.421413741 * t3 - 1.453152027 * t4 + 1.061405429 * t5) * Math.exp(-abs_z * abs_z / 2);
  const phi = 1.0 - erfcApprox;
  return z >= 0 ? phi : 1.0 - phi;
}

function normalCDF(mu: number, sigma: number, threshold: number): number {
  if (sigma <= 0) return mu >= threshold ? 1.0 : 0.0;
  return standardNormalCDF((mu - threshold) / sigma);
}

// ═══════════════════════════════════════════════════════════════
// FULL v3 UPDATE PIPELINE
// ═══════════════════════════════════════════════════════════════

interface UpdateResult {
  prior: number;
  posterior: number;
  prior_log_odds: number;
  posterior_log_odds: number;
  delta_log_odds: number;
  contributions: any[];
  propagation: any[];
  latent: LatentState;
  signal_dominance: any;
}

function runV3Update(
  milestone: any,
  allEvidence: any[],
  currentLatent: LatentState,
  allMilestones: any[],
): UpdateResult {
  const priorP = milestone.posterior; // current posterior becomes new prior
  const priorLO = logOdds(priorP);

  // Compute contributions from each evidence piece
  const contributions = allEvidence.map(ev => {
    const credResult = computeCredibilityScore([{
      url: "", publisher: ev.source, snippet: ev.summary,
    }]);
    const freshness = computeFreshnessWeight(ev.date, ev.direction === "contradicts" ? "falsify" : "confirm");
    const composite = ev.credibility * ev.recency * ev.consensus * ev.criteria_match;
    const sign = ev.direction === "supports" ? 1 : ev.direction === "contradicts" ? -1 : 0.1;
    const dlo = sign * composite * 2; // scaled log-odds contribution

    return {
      evidence_id: ev.id,
      evidence_meta: {
        type: ev.type,
        credibility: ev.credibility,
        recency: ev.recency,
        decay: freshness,
        consensus: ev.consensus,
        direction: ev.direction,
        criteria_match: ev.criteria_match,
      },
      composite,
      delta_log_odds: dlo,
    };
  });

  // Sum contributions
  const totalDeltaLO = contributions.reduce((s, c) => s + c.delta_log_odds, 0);
  const posteriorLO = priorLO + totalDeltaLO;
  const posteriorP = fromLogOdds(posteriorLO);

  // Signal dominance
  const signalDominance = scoreSignalDominance(allEvidence);
  const hasConflict = signalDominance.dominanceFlagCount || signalDominance.dominanceFlagScore;

  // Determine recommended status from posterior
  const recommendedStatus = latentToStatus(posteriorP);
  const adjustedConfidence = Math.min(1, allEvidence.length * 0.15 + 0.2);

  // Update latent state
  const latentResult = updateLatent(currentLatent, recommendedStatus, adjustedConfidence, hasConflict);
  const newLatent: LatentState = { mu: latentResult.mu, sigma: latentResult.sigma };

  // Domain coupling propagation
  const muDelta = latentResult.mu - currentLatent.mu;
  const propagation = propagateCoupling(milestone.domain, muDelta, allMilestones);

  return {
    prior: priorP,
    posterior: posteriorP,
    prior_log_odds: priorLO,
    posterior_log_odds: posteriorLO,
    delta_log_odds: totalDeltaLO,
    contributions,
    propagation: propagation.receipts,
    latent: newLatent,
    signal_dominance: signalDominance,
  };
}

// ═══════════════════════════════════════════════════════════════
// SHA-256 HASH
// ═══════════════════════════════════════════════════════════════

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ═══════════════════════════════════════════════════════════════
// CALIBRATION SNAPSHOT
// ═══════════════════════════════════════════════════════════════

function computeCalibrationSnapshot(milestone: any, latent: LatentState) {
  const nowYear = new Date().getFullYear() + (new Date().getMonth() / 12);
  const H = Math.max(0.25, milestone.year - nowYear);
  const G = Math.max(CALIB.G_MIN, Math.min(CALIB.G_MAX, CALIB.g * H));
  const tierNoiseMul = CALIB.TIER_NOISE_MULTIPLIER[milestone.tier] || 1.0;
  const sigmaFuture = Math.sqrt(latent.sigma ** 2 + CALIB.FORWARD_PROCESS_NOISE * tierNoiseMul * H);

  return {
    latent_mu: latent.mu,
    latent_sigma: latent.sigma,
    grace_window: G,
    horizon_years: H,
    tier_noise_mul: tierNoiseMul,
    sigma_future: sigmaFuture,
    p_demonstrated: normalCDF(latent.mu, sigmaFuture, STATUS_BOUNDS.demonstrated),
    p_deployed: normalCDF(latent.mu, sigmaFuture, STATUS_BOUNDS.deployed),
    p_accomplished: normalCDF(latent.mu, sigmaFuture, STATUS_BOUNDS.accomplished),
    implied_status: latentToStatus(latent.mu),
  };
}

// ═══════════════════════════════════════════════════════════════
// REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ─── AUTH: Verify caller identity ───
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const isServiceRole = token === serviceRoleKey;

  let callerId: string | null = null;
  let callerIsAdmin = false;

  if (isServiceRole) {
    // Service-role calls (from approve-evidence, evidence-scout) are trusted
    callerIsAdmin = true;
    callerId = "service-role";
  } else {
    // Validate user JWT
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await supabaseAnon.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    callerId = claimsData.claims.sub as string;

    // Check admin role for mutation routes
    const adminCheck = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const { data: roleData } = await adminCheck
      .from("user_roles").select("role")
      .eq("user_id", callerId).eq("role", "admin").maybeSingle();
    callerIsAdmin = !!roleData;
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
  );

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    let milestoneId: string | null = null;
    let action: string | null = null;
    
    // Find "milestones-api" in path, then take segments after it
    const fnIdx = pathParts.indexOf("milestones-api");
    const afterFn = fnIdx >= 0 ? pathParts.slice(fnIdx + 1) : pathParts;
    
    
    
    if (afterFn.length >= 1) {
      milestoneId = afterFn[0];
      action = afterFn.length >= 2 ? afterFn[1] : null;
    }

    // ─── POST /milestones-api/recalculate-all ───
    if (milestoneId === "recalculate-all" && req.method === "POST") {
      const { data: allMilestones } = await supabase.from("milestones").select("*").neq("tier", "historical");
      if (!allMilestones || allMilestones.length === 0) {
        return new Response(JSON.stringify({ error: "No milestones found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: any[] = [];
      for (const milestone of allMilestones) {
        const { data: evidence } = await supabase.from("evidence").select("*").eq("milestone_id", milestone.id);
        if (!evidence || evidence.length === 0) { results.push({ id: milestone.id, skipped: true }); continue; }

        const { data: latent } = await supabase.from("latent_states").select("*").eq("milestone_id", milestone.id).single();
        const currentLatent = latent ? { mu: latent.mu, sigma: latent.sigma } : initLatentState(milestone);

        // Reset milestone to prior for clean recalculation
        const resetMilestone = { ...milestone, posterior: milestone.prior };
        const updateResult = runV3Update(resetMilestone, evidence, initLatentState(milestone), allMilestones);

        // Update milestone
        await supabase.from("milestones").update({
          prior: milestone.prior,
          posterior: updateResult.posterior,
          delta_log_odds: updateResult.delta_log_odds,
        }).eq("id", milestone.id);

        // Upsert latent state
        await supabase.from("latent_states").upsert({
          milestone_id: milestone.id,
          mu: updateResult.latent.mu,
          sigma: updateResult.latent.sigma,
        });

        // Create trust ledger snapshot
        const calibration = computeCalibrationSnapshot(milestone, updateResult.latent);
        const fullState = {
          milestone_id: milestone.id,
          prior: milestone.prior,
          posterior: updateResult.posterior,
          prior_log_odds: updateResult.prior_log_odds,
          posterior_log_odds: updateResult.posterior_log_odds,
          delta_log_odds: updateResult.delta_log_odds,
          contributions: updateResult.contributions,
          propagation: updateResult.propagation,
          latent: updateResult.latent,
          signal_dominance: updateResult.signal_dominance,
          calibration,
          timestamp: new Date().toISOString(),
        };

        const hash = await sha256(JSON.stringify(fullState));

        const { data: prevSnapshot } = await supabase
          .from("trust_ledger").select("sha256_hash").eq("milestone_id", milestone.id)
          .order("created_at", { ascending: false }).limit(1).single();

        await supabase.from("trust_ledger").insert({
          milestone_id: milestone.id,
          snapshot_type: "bulk_recalculate",
          prior: milestone.prior,
          posterior: updateResult.posterior,
          prior_log_odds: updateResult.prior_log_odds,
          posterior_log_odds: updateResult.posterior_log_odds,
          delta_log_odds: updateResult.delta_log_odds,
          contributions: updateResult.contributions,
          propagation: updateResult.propagation,
          calibration_snapshot: calibration,
          full_state: fullState,
          sha256_hash: hash,
          prev_hash: prevSnapshot?.sha256_hash || null,
        });

        results.push({
          id: milestone.id,
          title: milestone.title,
          prior: milestone.prior,
          posterior: updateResult.posterior,
          delta_log_odds: updateResult.delta_log_odds,
          hash,
        });
      }

      return new Response(JSON.stringify({ recalculated: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!milestoneId) {
      return new Response(JSON.stringify({ error: "Milestone ID required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── GET /milestones/{id}?include=bayes,evidence,calibration ───
    if (req.method === "GET" && !action) {
      const include = (url.searchParams.get("include") || "").split(",").map(s => s.trim());

      const { data: milestone, error: msErr } = await supabase
        .from("milestones").select("*").eq("id", milestoneId).single();
      if (msErr || !milestone) {
        return new Response(JSON.stringify({ error: "Milestone not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result: any = { milestone };

      if (include.includes("evidence")) {
        const { data: evidence } = await supabase
          .from("evidence").select("*").eq("milestone_id", milestoneId).order("created_at", { ascending: true });
        result.evidence = evidence || [];
      }

      if (include.includes("bayes")) {
        const { data: latent } = await supabase
          .from("latent_states").select("*").eq("milestone_id", milestoneId).single();
        
        const lat = latent || initLatentState(milestone);
        const evidence = result.evidence || (await supabase
          .from("evidence").select("*").eq("milestone_id", milestoneId)).data || [];

        const contributions = evidence.map((ev: any) => {
          const freshness = computeFreshnessWeight(ev.date, ev.direction === "contradicts" ? "falsify" : "confirm");
          return {
            evidence_id: ev.id,
            evidence_meta: {
              type: ev.type,
              credibility: ev.credibility,
              recency: ev.recency,
              decay: freshness,
              consensus: ev.consensus,
              direction: ev.direction,
              criteria_match: ev.criteria_match,
            },
            composite: ev.composite,
            delta_log_odds: ev.delta_log_odds,
          };
        });

        result.bayes = {
          prior: milestone.prior,
          posterior: milestone.posterior,
          log_odds: logOdds(milestone.posterior),
          delta_log_odds: milestone.delta_log_odds,
          contributions,
          latent: lat,
          signal_dominance: scoreSignalDominance(evidence),
        };
      }

      if (include.includes("calibration")) {
        const { data: latent } = await supabase
          .from("latent_states").select("*").eq("milestone_id", milestoneId).single();
        const lat = latent || initLatentState(milestone);
        result.calibration = computeCalibrationSnapshot(milestone, lat);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── POST /milestones/{id}/evidence ───
    if (req.method === "POST" && action === "evidence") {
      const body = await req.json();
      const { direction, credibility, recency, consensus, criteria_match, source, type, date, summary, raw_sources } = body;

      if (!direction || !["supports", "contradicts", "ambiguous"].includes(direction)) {
        return new Response(JSON.stringify({ error: "Invalid direction" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch milestone
      const { data: milestone, error: msErr } = await supabase
        .from("milestones").select("*").eq("id", milestoneId).single();
      if (msErr || !milestone) {
        return new Response(JSON.stringify({ error: "Milestone not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get existing evidence
      const { data: existingEvidence } = await supabase
        .from("evidence").select("*").eq("milestone_id", milestoneId);
      
      // Get or init latent state
      const { data: latent } = await supabase
        .from("latent_states").select("*").eq("milestone_id", milestoneId).single();
      const currentLatent = latent ? { mu: latent.mu, sigma: latent.sigma } : initLatentState(milestone);

      // Compute composite
      const cred = credibility ?? 0.5;
      const rec = recency ?? computeFreshnessWeight(date);
      const cons = consensus ?? 0.5;
      const cm = criteria_match ?? 0.5;
      const composite = cred * rec * cons * cm;
      const sign = direction === "supports" ? 1 : direction === "contradicts" ? -1 : 0.1;
      const delta_lo = sign * composite * 2;

      // Insert evidence
      const evidenceId = `ev-${milestoneId}-${Date.now()}`;
      const newEvidence = {
        id: evidenceId,
        milestone_id: milestoneId,
        source: source || "Unknown",
        type: type || "unknown",
        direction,
        credibility: cred,
        recency: rec,
        consensus: cons,
        criteria_match: cm,
        composite,
        delta_log_odds: delta_lo,
        date: date || new Date().toISOString().split("T")[0],
        summary: summary || "",
        raw_sources: raw_sources || [],
      };

      await supabase.from("evidence").insert(newEvidence);

      // Get all milestones for coupling
      const { data: allMilestones } = await supabase.from("milestones").select("id, domain, tier");
      
      // Run full v3 update with all evidence
      const allEvidence = [...(existingEvidence || []), newEvidence];
      const updateResult = runV3Update(milestone, allEvidence, currentLatent, allMilestones || []);

      // Update milestone
      await supabase.from("milestones").update({
        prior: updateResult.prior,
        posterior: updateResult.posterior,
        delta_log_odds: updateResult.delta_log_odds,
      }).eq("id", milestoneId);

      // Upsert latent state
      await supabase.from("latent_states").upsert({
        milestone_id: milestoneId,
        mu: updateResult.latent.mu,
        sigma: updateResult.latent.sigma,
      });

      // Log latent update
      await supabase.from("latent_log").insert({
        milestone_id: milestoneId,
        domain: milestone.domain,
        prior_mu: currentLatent.mu,
        post_mu: updateResult.latent.mu,
        mu_delta: updateResult.latent.mu - currentLatent.mu,
        prior_sigma: currentLatent.sigma,
        post_sigma: updateResult.latent.sigma,
        adjusted_confidence: Math.min(1, allEvidence.length * 0.15 + 0.2),
        was_conflict_shock_applied: updateResult.signal_dominance.dominanceFlagCount || updateResult.signal_dominance.dominanceFlagScore,
        boundary_crossed: updateResult.latent.mu !== currentLatent.mu && latentToStatus(updateResult.latent.mu) !== latentToStatus(currentLatent.mu),
      });

      // Apply coupling propagation
      if (updateResult.propagation.length > 0) {
        const coupling = propagateCoupling(milestone.domain, updateResult.latent.mu - currentLatent.mu, allMilestones || []);
        for (const [targetId, delta] of Object.entries(coupling.updates)) {
          const { data: targetLatent } = await supabase
            .from("latent_states").select("*").eq("milestone_id", targetId).single();
          if (targetLatent) {
            await supabase.from("latent_states").update({
              mu: Math.max(0, Math.min(1, targetLatent.mu + delta)),
            }).eq("milestone_id", targetId);
          }
        }
      }

      // Get previous hash for chain
      const { data: prevSnapshot } = await supabase
        .from("trust_ledger")
        .select("sha256_hash")
        .eq("milestone_id", milestoneId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Create immutable Trust Ledger snapshot
      const calibration = computeCalibrationSnapshot(milestone, updateResult.latent);
      const fullState = {
        milestone_id: milestoneId,
        prior: updateResult.prior,
        posterior: updateResult.posterior,
        prior_log_odds: updateResult.prior_log_odds,
        posterior_log_odds: updateResult.posterior_log_odds,
        delta_log_odds: updateResult.delta_log_odds,
        contributions: updateResult.contributions,
        propagation: updateResult.propagation,
        latent: updateResult.latent,
        signal_dominance: updateResult.signal_dominance,
        calibration,
        evidence_id: evidenceId,
        timestamp: new Date().toISOString(),
      };

      const hash = await sha256(JSON.stringify(fullState));

      await supabase.from("trust_ledger").insert({
        milestone_id: milestoneId,
        snapshot_type: "evidence_update",
        prior: updateResult.prior,
        posterior: updateResult.posterior,
        prior_log_odds: updateResult.prior_log_odds,
        posterior_log_odds: updateResult.posterior_log_odds,
        delta_log_odds: updateResult.delta_log_odds,
        evidence_id: evidenceId,
        contributions: updateResult.contributions,
        propagation: updateResult.propagation,
        calibration_snapshot: calibration,
        full_state: fullState,
        sha256_hash: hash,
        prev_hash: prevSnapshot?.sha256_hash || null,
      });

      // Return response
      const updatedMilestone = { ...milestone, prior: updateResult.prior, posterior: updateResult.posterior, delta_log_odds: updateResult.delta_log_odds };
      return new Response(JSON.stringify({
        milestone: updatedMilestone,
        update_result: {
          prior: updateResult.prior,
          posterior: updateResult.posterior,
          prior_log_odds: updateResult.prior_log_odds,
          posterior_log_odds: updateResult.posterior_log_odds,
          delta_log_odds: updateResult.delta_log_odds,
          contributions: updateResult.contributions,
          propagation: updateResult.propagation,
        },
        trust_ledger: { sha256_hash: hash, prev_hash: prevSnapshot?.sha256_hash || null },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── POST /milestones/{id}/whatif ───
    if (req.method === "POST" && action === "whatif") {
      const body = await req.json();
      const { exclude_evidence_ids } = body;

      if (!Array.isArray(exclude_evidence_ids)) {
        return new Response(JSON.stringify({ error: "exclude_evidence_ids must be an array" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch milestone
      const { data: milestone, error: msErr } = await supabase
        .from("milestones").select("*").eq("id", milestoneId).single();
      if (msErr || !milestone) {
        return new Response(JSON.stringify({ error: "Milestone not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get all evidence, filter out excluded
      const { data: allEvidence } = await supabase
        .from("evidence").select("*").eq("milestone_id", milestoneId);
      const filteredEvidence = (allEvidence || []).filter(e => !exclude_evidence_ids.includes(e.id));

      // Use initial latent (recompute from scratch for what-if)
      const initialLatent = initLatentState(milestone);
      const { data: allMilestones } = await supabase.from("milestones").select("id, domain, tier");

      // Run v3 update with filtered evidence — NO DB mutation
      const updateResult = runV3Update(
        { ...milestone, posterior: milestone.prior }, // reset to original prior
        filteredEvidence,
        initialLatent,
        allMilestones || [],
      );

      return new Response(JSON.stringify({
        whatif: true,
        excluded_count: exclude_evidence_ids.length,
        remaining_evidence_count: filteredEvidence.length,
        update_result: {
          prior: updateResult.prior,
          posterior: updateResult.posterior,
          prior_log_odds: updateResult.prior_log_odds,
          posterior_log_odds: updateResult.posterior_log_odds,
          delta_log_odds: updateResult.delta_log_odds,
          contributions: updateResult.contributions,
          propagation: updateResult.propagation,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found", method: req.method, action }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("milestones-api error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
