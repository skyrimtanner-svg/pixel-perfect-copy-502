import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runGraph, GraphState } from "./graph.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER — LangGraph orchestration
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

  const runId = crypto.randomUUID();

  const log = async (action: string, detail: any = {}) => {
    console.log(`[Scout ${runId.slice(0, 8)}] ${action}`, JSON.stringify(detail).slice(0, 300));
    await supabase.from("scout_logs").insert({ run_id: runId, action, detail });
  };

  try {
    await log("run_started", { timestamp: new Date().toISOString(), orchestration: "langgraph" });

    // ─── FETCH MILESTONES ───
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

    // ─── BUILD INITIAL GRAPH STATE ───
    const initialState: GraphState = {
      runId,
      supabase,
      apiKey: LOVABLE_API_KEY,
      xBearerToken: Deno.env.get("X_BEARER_TOKEN"),
      slackApiKey: Deno.env.get("SLACK_API_KEY"),
      milestones: milestones as any,
      articles: [],
      uniqueArticles: [],
      classifications: [],
      scoredEvidence: [],
      queuedCount: 0,
      autoCommittedCount: 0,
      highSignalItems: [],
      memory: new Map(),
      sourceSummary: {},
      aiCallsMade: 0,
      aiCallsFailed: 0,
    };

    // ─── EXECUTE GRAPH: search → classify → score → queue ───
    const finalState = await runGraph(initialState);

    // ─── LOG MEMORY STATE ───
    const memorySnapshot: Record<string, any> = {};
    finalState.memory.forEach((v, k) => { memorySnapshot[k] = v; });
    await log("memory_snapshot", memorySnapshot);

    // ─── BUILD SUMMARY ───
    const summary = {
      run_id: runId,
      orchestration: "langgraph",
      articles_fetched: finalState.articles.length,
      articles_classified: finalState.uniqueArticles.length,
      ai_calls: finalState.aiCallsMade,
      ai_failures: finalState.aiCallsFailed,
      auto_committed: finalState.autoCommittedCount,
      evidence_queued: finalState.queuedCount,
      high_composite_count: finalState.highSignalItems.length,
      slack_notified: finalState.highSignalItems.length > 0 && !!finalState.slackApiKey,
      memory_milestones: finalState.memory.size,
      sources: finalState.sourceSummary,
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
