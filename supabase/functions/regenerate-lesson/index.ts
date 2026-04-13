import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { lesson_id, reason } = await req.json();
    if (!lesson_id) return jsonResponse({ error: "lesson_id required" }, 400);

    // Get lesson + verify ownership
    const { data: lesson, error: lessonErr } = await supabase
      .from("lessons")
      .select("*, curriculum_modules!inner(child_id, title, theme_emoji)")
      .eq("id", lesson_id)
      .single();

    if (lessonErr || !lesson) return jsonResponse({ error: "Lesson not found" }, 404);

    // Verify child belongs to user
    const { data: child } = await supabase
      .from("children")
      .select("id, name, age")
      .eq("id", lesson.child_id)
      .eq("user_id", user.id)
      .single();

    if (!child) return jsonResponse({ error: "Unauthorized" }, 403);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonResponse({ error: "AI API key not configured" }, 500);

    const ageRules = child.age <= 5
      ? "Ages 3-5: simple sentences, no quizzes >3 questions, matching/drawing exercises only."
      : child.age <= 9
      ? "Ages 6-9: short paragraphs, basic vocabulary, can include fill-in-the-blank."
      : child.age <= 12
      ? "Ages 10-12: full paragraphs, sorting and complex quizzes OK."
      : "Ages 13-16: nuanced topics OK, still no graphic content.";

    const prompt = `Regenerate this children's lesson. The original was flagged: "${reason || "parent disapproval"}".

Child: ${child.name}, age ${child.age}
Module: ${(lesson as any).curriculum_modules?.title || ""}
Original title: ${lesson.title}
Type: ${lesson.type}
Duration: ${lesson.duration_minutes} minutes
${ageRules}

STRICT RULES: Content for children. No violence, sexual content, horror, drugs, profanity, bias, dangerous activities, stereotypes. Tone must be encouraging and positive.

Return JSON only:
{
  "title": "string",
  "description": "string",
  "image_prompt": "short illustration description",
  "content_json": {
    "instructions": "string",
    "materials": ["optional"],
    "exercises": [{ "type": "matching|fill_blank|sorting|drawing", "data": { ... } }],
    "quiz": [{"question": "string", "options": ["a","b","c","d"], "answer": "string"}]
  }
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a children's education content creator. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status);
      return jsonResponse({ error: "Failed to regenerate lesson" }, 500);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let newLesson;
    try {
      const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      newLesson = JSON.parse(jsonStr);
    } catch {
      return jsonResponse({ error: "Failed to parse regenerated lesson" }, 500);
    }

    // Update the lesson
    const { error: updateErr } = await supabase
      .from("lessons")
      .update({
        title: newLesson.title,
        description: newLesson.description,
        content_json: newLesson.content_json,
      })
      .eq("id", lesson_id);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return jsonResponse({ error: "Failed to save regenerated lesson" }, 500);
    }

    return jsonResponse({ success: true, lesson: newLesson });
  } catch (e) {
    console.error("regenerate-lesson error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
