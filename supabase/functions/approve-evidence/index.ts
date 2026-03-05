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
    const { action, pending_id } = await req.json();

    if (!pending_id || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action or pending_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch pending evidence
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

    // Approve: POST to milestones-api /evidence endpoint via internal call
    const evidencePayload = {
      milestone_id: pending.milestone_id,
      source: pending.source_url || pending.source,
      direction: pending.direction,
      type: pending.evidence_type,
      credibility: pending.credibility,
      consensus: pending.consensus,
      criteria_match: pending.criteria_match,
      recency: pending.recency,
      summary: pending.summary,
      date: new Date().toISOString().split("T")[0],
      raw_sources: [{ url: pending.source_url, publisher: pending.source, snippet: pending.raw_snippet }],
    };

    // Call milestones-api directly
    const msApiUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/milestones-api/evidence`;
    const msResp = await fetch(msApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify(evidencePayload),
    });

    const msResult = await msResp.json();

    if (!msResp.ok) {
      return new Response(JSON.stringify({ error: "Failed to commit evidence", detail: msResult }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as approved
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
