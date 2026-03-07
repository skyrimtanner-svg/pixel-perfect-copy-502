import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // ─── AUTH: Any authenticated user ───
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
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

  const userId = claimsData.claims.sub as string;

  try {
    const { topicTitle, socraticQuestion, cynicalLens, userComment, topicId, milestoneId, evidenceSummaries } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are David Hume — skeptical, modest, emphasizing custom/experience over necessary connexion, vivid impressions, and the mixed life of reason/action/society. Respond with a single probing Socratic question or cynical observation (2-3 sentences max) that challenges the user's comment and links back to the milestone evidence. Never break character. Be pithy, not verbose.`;

    const contextParts = [
      `Topic: "${topicTitle}"`,
      `Socratic Question: "${socraticQuestion}"`,
      `Cynical Lens: "${cynicalLens}"`,
      `User Comment: "${userComment}"`,
    ];
    if (evidenceSummaries?.length) {
      contextParts.push(`Relevant evidence: ${evidenceSummaries.join('; ')}`);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextParts.join("\n") },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content?.trim();
    if (!aiContent) throw new Error("Empty AI response");

    // Insert AI comment using service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Insert user comment first (attributed to the authenticated caller)
    const { error: userInsertError } = await sb.from("socratic_comments").insert({
      topic_id: topicId,
      milestone_id: milestoneId,
      user_id: userId,
      content: userComment,
      is_ai: false,
    });
    if (userInsertError) console.error("Failed to insert user comment:", userInsertError);

    // Insert AI reply (no user attribution — it's the AI persona)
    const { error: insertError } = await sb.from("socratic_comments").insert({
      topic_id: topicId,
      milestone_id: milestoneId,
      user_id: null,
      content: aiContent,
      is_ai: true,
    });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ content: aiContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("socratic-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
