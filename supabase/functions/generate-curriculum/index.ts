import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { child_id } = await req.json();
    if (!child_id) {
      return new Response(JSON.stringify({ error: "child_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership
    const { data: child, error: childErr } = await supabase
      .from("children")
      .select("*")
      .eq("id", child_id)
      .eq("user_id", user.id)
      .single();

    if (childErr || !child) {
      return new Response(JSON.stringify({ error: "Child not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch child data
    const [interestsRes, prefsRes, schedRes] = await Promise.all([
      supabase.from("child_interests").select("interest").eq("child_id", child_id),
      supabase.from("child_preferences").select("preference").eq("child_id", child_id),
      supabase.from("learning_schedules").select("*").eq("child_id", child_id).single(),
    ]);

    const interests = (interestsRes.data || []).map((r) => r.interest);
    const preferences = (prefsRes.data || []).map((r) => r.preference);
    const schedule = schedRes.data || { minutes_per_day: 30, days: ["Mon", "Tue", "Wed", "Thu", "Fri"] };

    const systemPrompt = `You are a children's education curriculum designer. Given a child's age, interests, learning preferences, and daily time budget, create a 4-week curriculum. Blend interests into creative themed modules (don't separate by subject). Each week is one module with daily lessons matching their time budget. Return JSON only, no markdown.`;

    const userPrompt = `Create a curriculum for:
- Name: ${child.name}
- Age: ${child.age}
- Interests: ${interests.join(", ") || "general learning"}
- Learning preferences: ${preferences.join(", ") || "mixed"}
- Daily time: ${schedule.minutes_per_day} minutes
- Days per week: ${schedule.days.length} (${schedule.days.join(", ")})

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
          "type": "video|read|hands_on|audio|game|quiz",
          "duration_minutes": number,
          "day_number": 1,
          "content_json": {
            "instructions": "string",
            "materials": ["optional array"],
            "quiz": [{"question": "string", "options": ["a","b","c","d"], "answer": "string"}]
          }
        }
      ]
    }
  ]
}

Create ${schedule.days.length} lessons per week per module, 4 modules total. Each lesson should be approximately ${schedule.minutes_per_day} minutes. Make lessons fun, age-appropriate, and creative.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      return new Response(JSON.stringify({ error: "Failed to generate curriculum" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown code fences if present)
    let curriculum;
    try {
      const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      curriculum = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(JSON.stringify({ error: "Failed to parse curriculum" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert modules and lessons
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

      const lessons = (mod.lessons || []).map((lesson: any) => ({
        module_id: insertedModule.id,
        child_id,
        title: lesson.title,
        description: lesson.description,
        type: lesson.type,
        duration_minutes: lesson.duration_minutes || 15,
        content_json: lesson.content_json || {},
        day_number: lesson.day_number,
      }));

      if (lessons.length > 0) {
        const { error: lessonErr } = await supabase.from("lessons").insert(lessons);
        if (lessonErr) console.error("Lesson insert error:", lessonErr);
      }
    }

    // Create child_progress row
    await supabase.from("child_progress").upsert({
      child_id,
      total_lessons_completed: 0,
      current_streak: 0,
      longest_streak: 0,
    }, { onConflict: "child_id" });

    return new Response(JSON.stringify({ success: true, modules_created: modules.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-curriculum error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
