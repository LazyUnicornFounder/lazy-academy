import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lessons, child_age } = await req.json();
    if (!lessons || !Array.isArray(lessons)) {
      return jsonResponse({ error: "lessons array required" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonResponse({ error: "AI API key not configured" }, 500);

    const ageGroup = child_age <= 5 ? "3-5" : child_age <= 9 ? "6-9" : child_age <= 12 ? "10-12" : "13-16";

    const lessonsText = lessons.map((l: any, i: number) => {
      const content = l.content_json || {};
      return `Lesson ${i + 1}: "${l.title}"\nDescription: ${l.description || ""}\nInstructions: ${content.instructions || ""}\nQuiz: ${JSON.stringify(content.quiz || [])}\nExercises: ${JSON.stringify(content.exercises || [])}`;
    }).join("\n\n---\n\n");

    const moderationPrompt = `Review this children's educational content for ages ${ageGroup}. Flag any content that is: violent, sexual, scary, dangerous, biased, factually wrong, or inappropriate for ages ${ageGroup}.

Age-specific rules for ${ageGroup}:
${ageGroup === "3-5" ? "- Only simple sentences allowed\n- No quizzes longer than 3 questions\n- No reading-heavy lessons\n- Only matching and drawing exercises" : ""}
${ageGroup === "6-9" ? "- Short paragraphs, basic vocabulary only\n- Exercises can include fill-in-the-blank" : ""}
${ageGroup === "10-12" ? "- Full paragraphs OK\n- Can include sorting and complex quizzes" : ""}
${ageGroup === "13-16" ? "- Can discuss historical conflicts, basic economics, more nuanced topics\n- Still no graphic/explicit content" : ""}

Content to review:

${lessonsText}

Return JSON only: { "safe": boolean, "flags": [{ "lesson_index": number, "lesson_title": string, "issue": string, "suggestion": string }] }`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a children's content safety reviewer. Return only valid JSON." },
          { role: "user", content: moderationPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI moderation error:", aiResponse.status);
      // Fail open - if moderation fails, allow content through
      return jsonResponse({ safe: true, flags: [] });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    try {
      const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(jsonStr);
      return jsonResponse(result);
    } catch {
      console.error("Failed to parse moderation response:", rawContent);
      return jsonResponse({ safe: true, flags: [] });
    }
  } catch (e) {
    console.error("moderate-content error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
