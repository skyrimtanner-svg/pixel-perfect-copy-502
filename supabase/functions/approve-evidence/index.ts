import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify admin via JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await supabaseAnon.auth.getClaims(token);
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claims.claims.sub as string;

  // Use service role for operations
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Check admin role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, pending_id, pending_ids } = body;

    // ─── BATCH OPERATIONS ───
    if (pending_ids && Array.isArray(pending_ids) && pending_ids.length > 0) {
      if (!["approve", "reject"].includes(action)) {
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const pid of pending_ids) {
        try {
          const { data: pending, error: fetchErr } = await supabase
            .from("pending_evidence")
            .select("*")
            .eq("id", pid)
            .eq("status", "pending")
            .single();

          if (fetchErr || !pending) {
            results.push({ id: pid, success: false, error: "Not found or already processed" });
            continue;
          }

          if (action === "reject") {
            await supabase.from("pending_evidence").update({
              status: "rejected",
              reviewed_at: new Date().toISOString(),
              reviewed_by: userId,
            }).eq("id", pid);
            results.push({ id: pid, success: true });
            continue;
          }

          // Approve: POST to milestones-api
          const msApiUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/milestones-api/${pending.milestone_id}/evidence`;
          const msResp = await fetch(msApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              direction: pending.direction,
              credibility: pending.credibility,
              consensus: pending.consensus,
              criteria_match: pending.criteria_match,
              recency: pending.recency,
              source: pending.source_url || pending.source,
              type: pending.evidence_type,
              summary: pending.summary,
              date: new Date().toISOString().split("T")[0],
              raw_sources: [{ url: pending.source_url, publisher: pending.source, snippet: pending.raw_snippet }],
            }),
          });

          const msResult = await msResp.json();

          if (!msResp.ok) {
            results.push({ id: pid, success: false, error: `Evidence commit failed: ${msResult.error || msResp.status}` });
            continue;
          }

          await supabase.from("pending_evidence").update({
            status: "approved",
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId,
          }).eq("id", pid);

          results.push({ id: pid, success: true });
        } catch (e) {
          results.push({ id: pid, success: false, error: String(e) });
        }
      }

      const approved = results.filter(r => r.success && action === "approve").length;
      const rejected = results.filter(r => r.success && action === "reject").length;
      const failed = results.filter(r => !r.success).length;

      return new Response(JSON.stringify({
        success: true,
        action,
        batch: true,
        approved,
        rejected,
        failed,
        results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── SINGLE OPERATION ───
    if (!pending_id || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action or pending_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pending, error: fetchErr } = await supabase
      .from("pending_evidence")
      .select("*")
      .eq("id", pending_id)
      .eq("status", "pending")
      .single();

    if (fetchErr || !pending) {
      return new Response(JSON.stringify({ error: "Pending evidence not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reject") {
      await supabase.from("pending_evidence").update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      }).eq("id", pending_id);

      return new Response(JSON.stringify({ success: true, action: "rejected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Approve: POST to milestones-api/{id}/evidence
    const msApiUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/milestones-api/${pending.milestone_id}/evidence`;
    const msResp = await fetch(msApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        direction: pending.direction,
        credibility: pending.credibility,
        consensus: pending.consensus,
        criteria_match: pending.criteria_match,
        recency: pending.recency,
        source: pending.source_url || pending.source,
        type: pending.evidence_type,
        summary: pending.summary,
        date: new Date().toISOString().split("T")[0],
        raw_sources: [{ url: pending.source_url, publisher: pending.source, snippet: pending.raw_snippet }],
      }),
    });

    const msResult = await msResp.json();

    if (!msResp.ok) {
      return new Response(JSON.stringify({ error: "Failed to commit evidence", detail: msResult }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("pending_evidence").update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    }).eq("id", pending_id);

    return new Response(JSON.stringify({
      success: true,
      action: "approved",
      evidence_result: msResult,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Approve error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
