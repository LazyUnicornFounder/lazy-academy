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

async function generateImage(prompt: string): Promise<string | null> {
  const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
  if (!REPLICATE_API_TOKEN) return null;

  try {
    // Create prediction with Recraft v3
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "3ef87af9c0b3b8e5cd7e1d2ddbe1e47e26b3a97c17b261dffd7e396007596b67",
        input: {
          prompt: `${prompt}, children's educational illustration, friendly, colorful, simple, no text`,
          size: "1365x1024",
          style: "digital_illustration",
        },
      }),
    });

    if (!createRes.ok) {
      console.error("Replicate create error:", await createRes.text());
      return null;
    }

    const prediction = await createRes.json();
    let result = prediction;

    // Poll for completion (max 60s)
    for (let i = 0; i < 30; i++) {
      if (result.status === "succeeded") {
        return result.output?.[0] || result.output || null;
      }
      if (result.status === "failed" || result.status === "canceled") {
        console.error("Replicate prediction failed:", result.error);
        return null;
      }
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(result.urls.get, {
        headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
      });
      result = await pollRes.json();
    }
    return null;
  } catch (e) {
    console.error("Image generation error:", e);
    return null;
  }
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

    const { child_id } = await req.json();
    if (!child_id) return jsonResponse({ error: "child_id required" }, 400);

    const { data: child, error: childErr } = await supabase
      .from("children")
      .select("*")
      .eq("id", child_id)
      .eq("user_id", user.id)
      .single();

    if (childErr || !child) return jsonResponse({ error: "Child not found" }, 404);

    const [interestsRes, prefsRes, schedRes, progRes] = await Promise.all([
      supabase.from("child_interests").select("interest").eq("child_id", child_id),
      supabase.from("child_preferences").select("preference").eq("child_id", child_id),
      supabase.from("learning_schedules").select("*").eq("child_id", child_id).single(),
      supabase.from("child_progress").select("difficulty_level").eq("child_id", child_id).single(),
    ]);

    const interests = (interestsRes.data || []).map((r) => r.interest);
    const preferences = (prefsRes.data || []).map((r) => r.preference);
    const schedule = schedRes.data || { minutes_per_day: 30, days: ["Mon", "Tue", "Wed", "Thu", "Fri"] };
    const difficultyLevel = progRes.data?.difficulty_level || 2;

    const systemPrompt = `You are a children's education curriculum designer. Create a 4-week curriculum blending interests into themed modules. Each week is one module with daily lessons. LazyAcademy is VIDEO-FREE — never include video content or YouTube references. Lesson types: read, hands_on, audio, game, quiz only. Each lesson should include 1-2 interactive exercises from these types:
- matching: pairs of items to connect. Data: { pairs: [{ left: "item", right: "match" }] }
- fill_blank: sentence with missing word. Data: { sentence: "The ___ is...", options: ["a","b","c","d"], answer: "b" }
- sorting: put items in correct order. Data: { items: ["c","a","b"], correct_order: ["a","b","c"], instruction: "Sort by..." }
- drawing: creative prompt. Data: { prompt: "Draw what you think..." }
Return JSON only, no markdown.`;

    const userPrompt = `Create a curriculum for:
- Name: ${child.name}
- Age: ${child.age}
- Interests: ${interests.join(", ") || "general learning"}
- Learning preferences: ${preferences.join(", ") || "mixed"}
- Daily time: ${schedule.minutes_per_day} minutes
- Days per week: ${schedule.days.length} (${schedule.days.join(", ")})
- Difficulty level: ${difficultyLevel}/5 (1=easiest, 5=hardest). Adjust complexity accordingly.

Return this exact JSON structure:
{
  "modules": [
    {
      "title": "string",
      "description": "string",
      "theme_emoji": "single emoji",
      "week_number": 1,
      "lessons": [
        {
          "title": "string",
          "description": "string",
          "type": "read|hands_on|audio|game|quiz",
          "duration_minutes": number,
          "day_number": 1,
          "image_prompt": "short description for generating an illustration for this lesson",
          "content_json": {
            "instructions": "string",
            "materials": ["optional array"],
            "exercises": [
              { "type": "matching|fill_blank|sorting|drawing", "data": { ... } }
            ],
            "quiz": [{"question": "string", "options": ["a","b","c","d"], "answer": "string"}]
          }
        }
      ]
    }
  ]
}

Create ${schedule.days.length} lessons per week, 4 modules total. Each lesson ≈${schedule.minutes_per_day} minutes. Never use type "video". Make lessons fun, age-appropriate, and creative.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonResponse({ error: "AI API key not configured" }, 500);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return jsonResponse({ error: "Rate limited, please try again shortly." }, 429);
      if (status === 402) return jsonResponse({ error: "AI credits exhausted." }, 402);
      console.error("AI error:", status, await aiResponse.text());
      return jsonResponse({ error: "Failed to generate curriculum" }, 500);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let curriculum;
    try {
      const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      curriculum = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return jsonResponse({ error: "Failed to parse curriculum" }, 500);
    }

    const modules = curriculum.modules || [];
    for (const mod of modules) {
      const { data: insertedModule, error: modErr } = await supabase
        .from("curriculum_modules")
        .insert({
          child_id,
          title: mod.title,
          description: mod.description,
          theme_emoji: mod.theme_emoji,
          week_number: mod.week_number,
          status: mod.week_number === 1 ? "active" : "locked",
        })
        .select("id")
        .single();

      if (modErr) {
        console.error("Module insert error:", modErr);
        continue;
      }

      // Generate images in parallel for all lessons
      const imagePromises = (mod.lessons || []).map((lesson: any) =>
        lesson.image_prompt ? generateImage(lesson.image_prompt) : Promise.resolve(null)
      );
      const imageUrls = await Promise.all(imagePromises);

      const lessons = (mod.lessons || []).map((lesson: any, idx: number) => ({
        module_id: insertedModule.id,
        child_id,
        title: lesson.title,
        description: lesson.description,
        type: lesson.type === "video" ? "read" : lesson.type,
        duration_minutes: lesson.duration_minutes || 15,
        content_json: lesson.content_json || {},
        day_number: lesson.day_number,
        image_url: imageUrls[idx] || null,
      }));

      if (lessons.length > 0) {
        const { error: lessonErr } = await supabase.from("lessons").insert(lessons);
        if (lessonErr) console.error("Lesson insert error:", lessonErr);
      }
    }

    await supabase.from("child_progress").upsert({
      child_id,
      total_lessons_completed: 0,
      current_streak: 0,
      longest_streak: 0,
    }, { onConflict: "child_id" });

    return jsonResponse({ success: true, modules_created: modules.length });
  } catch (e) {
    console.error("generate-curriculum error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
