import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!SLACK_API_KEY || !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing Slack config" }), { status: 500, headers: corsHeaders });
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Count scout runs in last week
    const { data: runs } = await supabase
      .from("scout_logs")
      .select("run_id, created_at")
      .gte("created_at", oneWeekAgo);

    const uniqueRuns = new Set((runs || []).map((r: any) => r.run_id));
    const totalLogs = runs?.length || 0;

    // 2. Count evidence processed
    const { count: evidenceCount } = await supabase
      .from("pending_evidence")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo);

    // 3. Top milestone movers (biggest |delta_log_odds| changes this week)
    const { data: recentEvidence } = await supabase
      .from("evidence")
      .select("milestone_id, delta_log_odds")
      .gte("created_at", oneWeekAgo);

    const moverMap: Record<string, number> = {};
    for (const e of recentEvidence || []) {
      moverMap[e.milestone_id] = (moverMap[e.milestone_id] || 0) + e.delta_log_odds;
    }

    const topMovers = Object.entries(moverMap)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 5);

    // Fetch milestone titles
    const msIds = topMovers.map(([id]) => id);
    const { data: msData } = await supabase
      .from("milestones")
      .select("id, title, posterior")
      .in("id", msIds);
    const msMap: Record<string, any> = {};
    (msData || []).forEach((m: any) => { msMap[m.id] = m; });

    // Build Slack blocks
    const blocks: any[] = [
      {
        type: "header",
        text: { type: "plain_text", text: "📊 Weekly Evidence Digest", emoji: true },
      },
      { type: "divider" },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Scout Runs:*\n${uniqueRuns.size}` },
          { type: "mrkdwn", text: `*Evidence Processed:*\n${evidenceCount || 0}` },
          { type: "mrkdwn", text: `*Log Entries:*\n${totalLogs}` },
          { type: "mrkdwn", text: `*Period:*\nLast 7 days` },
        ],
      },
      { type: "divider" },
      {
        type: "section",
        text: { type: "mrkdwn", text: "*Top Milestone Movers:*" },
      },
    ];

    for (const [msId, totalDelta] of topMovers) {
      const ms = msMap[msId];
      const title = ms?.title || msId;
      const arrow = totalDelta >= 0 ? "↑" : "↓";
      const posterior = ms ? `${(ms.posterior * 100).toFixed(0)}%` : "?";
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${arrow} *${title}*  ·  P(X): ${posterior}  ·  Net Δ: \`${totalDelta >= 0 ? "+" : ""}${totalDelta.toFixed(3)}\` log-odds`,
        },
      });
    }

    if (topMovers.length === 0) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: "_No milestone movement this week._" },
      });
    }

    blocks.push(
      { type: "divider" },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `_Weekly digest · ${new Date().toISOString().split("T")[0]} · <https://lovable.dev|View in Observatory>_` },
        ],
      },
    );

    const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";
    const gatewayHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": SLACK_API_KEY,
    };
    const fallbackText = `📊 Weekly Digest: ${uniqueRuns.size} scout runs, ${evidenceCount || 0} evidence items, ${topMovers.length} top movers`;

    // Find the channel ID first
    const listResp = await fetch(`${GATEWAY_URL}/conversations.list?types=public_channel&limit=200`, {
      headers: gatewayHeaders,
    });
    const listData = await listResp.json();
    const channel = (listData.channels || []).find((c: any) => c.name === "evidence-scout");

    if (!channel) {
      return new Response(JSON.stringify({ ok: false, error: "Channel #evidence-scout not found", channels: (listData.channels || []).map((c: any) => c.name).slice(0, 20) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Join the channel
    await fetch(`${GATEWAY_URL}/conversations.join`, {
      method: "POST",
      headers: gatewayHeaders,
      body: JSON.stringify({ channel: channel.id }),
    });

    const slackResp = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
      method: "POST",
      headers: gatewayHeaders,
      body: JSON.stringify({
        channel: channel.id,
        text: fallbackText,
        blocks,
        username: "ÆETH Weekly Digest",
        icon_emoji: ":bar_chart:",
      }),
    });

    const result = await slackResp.json();

    return new Response(JSON.stringify({ ok: true, slack: result, stats: { runs: uniqueRuns.size, evidence: evidenceCount, movers: topMovers.length } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
