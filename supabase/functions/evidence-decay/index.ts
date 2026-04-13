/**
 * Evidence Decay Job — scheduled daily via pg_cron.
 * Applies time-based decay to pending evidence composite scores.
 * Two-stage stale flow: no unconditional auto-reject.
 * 
 * Decay formula: decayed = composite × 0.97^max(0, days_stale - 7)
 * - First 7 days: no penalty
 * - Day 8+: gradual decay
 * 
 * Stale routing:
 * - Below 0.20 + low source credibility + no corroboration → auto-reject
 * - Below 0.20 + high-credibility source OR strategic milestone → needs_final_review
 * - 21+ days stale + below 0.20 → eligible for stronger rejection
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HIGH_CRED_TIERS = [1, 2]; // Tier 1-2 sources are high credibility
const DECAY_RATE = 0.97;
const GRACE_DAYS = 7;
const SOFT_REJECT_THRESHOLD = 0.20;
const VERY_STALE_DAYS = 21;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const runId = crypto.randomUUID();
  const log = async (action: string, detail: any = {}) => {
    console.log(`[Decay ${runId.slice(0, 8)}] ${action}`, JSON.stringify(detail).slice(0, 300));
    await supabase.from("scout_logs").insert({ run_id: runId, action, detail });
  };

  try {
    await log("decay_job_started", { timestamp: new Date().toISOString() });

    // Fetch all pending items
    const { data: pending, error } = await supabase
      .from("pending_evidence")
      .select("id, composite_score, created_at, publisher_tier, milestone_id, credibility, source, queue_reason, direction")
      .eq("status", "pending");

    if (error) {
      await log("decay_error", { error: error.message });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pending || pending.length === 0) {
      await log("decay_job_complete", { message: "No pending items" });
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch corroboration data: count of supporting evidence per milestone
    const milestoneIds = [...new Set(pending.map(p => p.milestone_id))];
    const corroborationMap: Record<string, number> = {};
    for (const msId of milestoneIds) {
      const { count } = await supabase
        .from("evidence")
        .select("*", { count: "exact", head: true })
        .eq("milestone_id", msId);
      corroborationMap[msId] = count || 0;
    }

    // Fetch milestone domains for strategic priority check
    const { data: milestones } = await supabase
      .from("milestones")
      .select("id, domain, tier")
      .in("id", milestoneIds);
    const msMap: Record<string, { domain: string; tier: string }> = {};
    (milestones || []).forEach((m: any) => { msMap[m.id] = { domain: m.domain, tier: m.tier }; });

    // Load domain priorities from directives
    const { data: directives } = await supabase
      .from("scout_directives")
      .select("key, value")
      .eq("key", "domain_priorities")
      .maybeSingle();
    
    const highPriorityDomains = new Set<string>();
    if (directives?.value) {
      const lines = directives.value.split("\n");
      for (const line of lines) {
        const match = line.match(/-\s*(compute|energy|biology|connectivity|manufacturing)\s*:\s*HIGH/i);
        if (match) highPriorityDomains.add(match[1].toLowerCase());
      }
    }

    let decayed = 0;
    let autoRejected = 0;
    let markedForReview = 0;
    const now = Date.now();

    for (const item of pending) {
      const ageDays = (now - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const staleDays = Math.max(0, ageDays - GRACE_DAYS);
      const decayedScore = item.composite_score * Math.pow(DECAY_RATE, staleDays);

      const updates: Record<string, any> = {
        decayed_score: Math.round(decayedScore * 10000) / 10000,
        decay_applied_at: new Date().toISOString(),
      };

      // Two-stage stale flow
      if (decayedScore < SOFT_REJECT_THRESHOLD) {
        const isHighCredSource = HIGH_CRED_TIERS.includes(item.publisher_tier);
        const ms = msMap[item.milestone_id];
        const isStrategicMilestone = ms && (
          highPriorityDomains.has(ms.domain) ||
          ms.tier === 'near' // Near-term milestones are strategic
        );
        const hasCorroboration = (corroborationMap[item.milestone_id] || 0) > 0;

        if (isHighCredSource || isStrategicMilestone) {
          // High-value item decayed due to queue latency — flag for final review
          updates.queue_reason = 'stale_high_value_review';
          markedForReview++;
          await log("stale_flagged_review", {
            id: item.id, decayed_score: decayedScore, age_days: Math.round(ageDays),
            reason: isHighCredSource ? "high_cred_source" : "strategic_milestone",
            source: item.source, milestone_id: item.milestone_id,
          });
        } else if (ageDays >= VERY_STALE_DAYS && !hasCorroboration && item.credibility < 0.5) {
          // Very stale + weak + uncorroborated → auto-reject
          updates.status = "rejected";
          updates.reviewed_at = new Date().toISOString();
          updates.reviewed_by = null; // System action
          updates.queue_reason = 'stale_low_value_reject';
          autoRejected++;
          await log("stale_auto_rejected", {
            id: item.id, decayed_score: decayedScore, age_days: Math.round(ageDays),
            credibility: item.credibility, corroboration: corroborationMap[item.milestone_id] || 0,
            actor: "system_decay_job",
          });
        } else if (ageDays >= VERY_STALE_DAYS) {
          // Very stale but not auto-rejectable — flag
          updates.queue_reason = 'stale_high_value_review';
          markedForReview++;
        }
        // Otherwise: just update decayed score, leave in queue
      }

      await supabase
        .from("pending_evidence")
        .update(updates)
        .eq("id", item.id);

      decayed++;
    }

    const summary = {
      run_id: runId,
      processed: decayed,
      auto_rejected: autoRejected,
      marked_for_review: markedForReview,
      actor: "system_decay_job",
    };

    await log("decay_job_complete", summary);

    return new Response(JSON.stringify({ success: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    await log("decay_error", { error: String(e) });
    console.error("Decay job error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
