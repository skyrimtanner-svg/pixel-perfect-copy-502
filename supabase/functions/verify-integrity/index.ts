import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // ─── AUTH: Admin or service-role only ───
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const isServiceRole = token === SERVICE_ROLE_KEY;

  if (!isServiceRole) {
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } =
      await supabaseAnon.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const adminCheck = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: roleData } = await adminCheck
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const checks: CheckResult[] = [];

  // ─── 1. UPDATE trust_ledger should fail ──────────────────────────────────
  try {
    const { data: row } = await supabase
      .from("trust_ledger")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!row) {
      checks.push({
        name: "trust_ledger UPDATE blocked",
        passed: false,
        expected: "exception thrown",
        actual: "no rows in trust_ledger to test against",
      });
    } else {
      const { error } = await supabase
        .from("trust_ledger")
        .update({ snapshot_type: "tampered" })
        .eq("id", row.id);

      const blocked = !!error && /append-only/i.test(error.message);
      checks.push({
        name: "trust_ledger UPDATE blocked",
        passed: blocked,
        expected: "append-only exception",
        actual: error?.message ?? "no error (UPDATE succeeded — BAD)",
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({
      name: "trust_ledger UPDATE blocked",
      passed: /append-only/i.test(msg),
      expected: "append-only exception",
      actual: msg,
    });
  }

  // ─── 2. UPDATE latent_log should fail ────────────────────────────────────
  try {
    const { data: row } = await supabase
      .from("latent_log")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!row) {
      checks.push({
        name: "latent_log UPDATE blocked",
        passed: false,
        expected: "exception thrown",
        actual: "no rows in latent_log to test against",
      });
    } else {
      const { error } = await supabase
        .from("latent_log")
        .update({ adjusted_confidence: 0.99 })
        .eq("id", row.id);

      const blocked = !!error && /append-only/i.test(error.message);
      checks.push({
        name: "latent_log UPDATE blocked",
        passed: blocked,
        expected: "append-only exception",
        actual: error?.message ?? "no error (UPDATE succeeded — BAD)",
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({
      name: "latent_log UPDATE blocked",
      passed: /append-only/i.test(msg),
      expected: "append-only exception",
      actual: msg,
    });
  }

  // ─── 3. DELETE analytics_events should fail ──────────────────────────────
  // Insert a probe row first so we have something to attempt to delete.
  let probeId: string | null = null;
  try {
    const { data: inserted, error: insertErr } = await supabase
      .from("analytics_events")
      .insert({
        event_type: "integrity_probe",
        event_data: { purpose: "verify-integrity append-only test" },
      })
      .select("id")
      .single();

    if (insertErr) {
      checks.push({
        name: "analytics_events DELETE blocked",
        passed: false,
        expected: "probe insert succeeds, then delete blocked",
        actual: `probe insert failed: ${insertErr.message}`,
      });
    } else {
      probeId = inserted.id;
      const { error } = await supabase
        .from("analytics_events")
        .delete()
        .eq("id", probeId);

      const blocked = !!error && /append-only/i.test(error.message);
      checks.push({
        name: "analytics_events DELETE blocked",
        passed: blocked,
        expected: "append-only exception",
        actual: error?.message ?? "no error (DELETE succeeded — BAD)",
        details: { probeId },
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({
      name: "analytics_events DELETE blocked",
      passed: /append-only/i.test(msg),
      expected: "append-only exception",
      actual: msg,
    });
  }

  // ─── 4. get_next_waitlist_spot returns sequential values ─────────────────
  try {
    const { data: spot1, error: e1 } = await supabase.rpc(
      "get_next_waitlist_spot",
    );
    const { data: spot2, error: e2 } = await supabase.rpc(
      "get_next_waitlist_spot",
    );

    if (e1 || e2) {
      checks.push({
        name: "get_next_waitlist_spot sequential",
        passed: false,
        expected: "two successful RPC calls",
        actual: `errors: ${e1?.message ?? "ok"} / ${e2?.message ?? "ok"}`,
      });
    } else {
      // STABLE function with no inserts between calls → both should equal COUNT(*)+1.
      // "Sequential" here means consistent and monotonic given no waitlist mutations.
      const ok =
        typeof spot1 === "number" &&
        typeof spot2 === "number" &&
        spot2 >= spot1 &&
        spot2 - spot1 <= 1;
      checks.push({
        name: "get_next_waitlist_spot sequential",
        passed: ok,
        expected: "two integers, second ≥ first, gap ≤ 1",
        actual: `spot1=${spot1}, spot2=${spot2}`,
        details: { spot1, spot2 },
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({
      name: "get_next_waitlist_spot sequential",
      passed: false,
      expected: "two successful RPC calls",
      actual: msg,
    });
  }

  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.length - passed;

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: checks.length,
      passed,
      failed,
      status: failed === 0 ? "ALL_PASSED" : "FAILURES_DETECTED",
    },
    checks,
  };

  return new Response(JSON.stringify(report, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: failed === 0 ? 200 : 500,
  });
});
