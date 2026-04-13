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

    const childAge = child.age || 7;
    const ageRules = childAge <= 5
      ? `AGE GROUP 3-5: Use only simple sentences (1-2 per paragraph). No quizzes longer than 3 questions. No reading-heavy lessons. Only matching (3-4 pairs) and drawing exercises allowed. Instructions should be 1-2 sentences. Content should be very visual and tactile.`
      : childAge <= 9
      ? `AGE GROUP 6-9: Short paragraphs (3-4 sentences each), basic vocabulary. Provide 3-4 paragraphs of teaching content before exercises. Exercises: fill-in-the-blank, matching (5-6 pairs), and drawing. Include 2-3 exercises per lesson. Quiz questions should have plausible distractors.`
      : childAge <= 12
      ? `AGE GROUP 10-12: IMPORTANT — this age group needs SUBSTANTIAL content. Provide 4-6 detailed paragraphs of teaching material with real facts, explanations, and examples BEFORE exercises. Include 3-4 exercises per lesson. Matching should have 6-8 pairs. Fill-in-the-blank should test comprehension, not just recall. Sorting exercises should have 5-7 items. Quiz questions (4-6 per lesson) must have thoughtful distractors that require understanding, not guessing. Instructions must be detailed and specific (at least 3-4 sentences explaining what to do and why). Avoid overly obvious answers. Content should teach something genuinely interesting and new.`
      : `AGE GROUP 13-16: Provide RICH, detailed content — 5-8 paragraphs of in-depth material with nuanced explanations, real-world connections, and critical thinking prompts. Include 3-5 challenging exercises per lesson. Matching: 8-10 pairs. Sorting: 6-8 items requiring analysis. Fill-in-the-blank: requires inference, not just memory. Quiz: 5-8 questions with subtle distractors. Can discuss historical conflicts, basic economics, philosophy, more nuanced topics. Still no graphic or explicit content.`;

    const systemPrompt = `STRICT RULES: You are generating content for children ages 3-16. You MUST follow these rules with zero exceptions:
- No violence, weapons, gore, death descriptions, or war details beyond basic historical facts
- No sexual content, romance, innuendo, or body image commentary
- No horror, scary imagery, dark themes, nightmares, or creepy scenarios
- No drugs, alcohol, smoking, or substance references
- No profanity, slang insults, or mean-spirited humor
- No religious bias — mention religions only as neutral historical/cultural facts
- No political opinions or partisan content
- No dangerous activities kids could imitate (fire, chemicals, sharp tools, heights) unless explicitly marked as 'with adult supervision'
- No content that could cause anxiety about death, divorce, illness, or abandonment
- No stereotypes about gender, race, ethnicity, body type, or disability
- All quiz answers must be factually accurate — never trick questions
- Tone must be encouraging, curious, and positive. Never shame wrong answers.
- When discussing animals: no graphic predator/prey descriptions
- When discussing history: age-appropriate framing, focus on courage and progress not suffering

${ageRules}

You are a children's education curriculum designer. Create a 4-week curriculum blending interests into themed modules. Each week is one module with daily lessons. Lazy Academy is VIDEO-FREE — never include video content or YouTube references. Lesson types: read, hands_on, audio, game, quiz only.

CRITICAL — CONTENT DEPTH REQUIREMENTS:
- The "instructions" field must be SUBSTANTIAL teaching content, not a one-liner. It should contain multiple paragraphs that actually TEACH the topic with facts, explanations, examples, and context. Think of it as a mini-article the child reads and learns from. For ages 10+, instructions should be at least 300 words.
- Exercises must be CHALLENGING and require actual thought. Never make answers obvious. Distractors in quizzes must be plausible.
- The total content (reading + exercises + quiz) must realistically fill the stated duration_minutes. A 15-minute lesson needs enough content for 15 minutes — that means substantial reading material PLUS multiple exercises.
- Each lesson MUST include 2-4 interactive exercises from these types:
- matching: pairs of items to connect. Data: { pairs: [{ left: "item", right: "match" }] } — minimum 5 pairs for ages 8+
- fill_blank: sentence with missing word. Data: { sentence: "The ___ is...", options: ["a","b","c","d"], answer: "b" } — sentence must require comprehension
- sorting: put items in SEQUENTIAL order (chronological, size, etc). NOT categorization. Data: { items: ["c","a","b"], correct_order: ["a","b","c"], instruction: "Sort from smallest to largest" } — 5-7 items max. The instruction must describe a clear linear ordering criterion, NOT grouping into categories.
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

Create ${schedule.days.length} lessons per week, 4 modules total. Each lesson ≈${schedule.minutes_per_day} minutes. Never use type "video". Make lessons fun, age-appropriate, and creative. IMPORTANT: Each lesson's "instructions" field must contain REAL teaching content (multiple paragraphs with facts and explanations), not just "Read about X" or "Learn about Y". The content must realistically take ${schedule.minutes_per_day} minutes to complete including reading and all exercises.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonResponse({ error: "AI API key not configured" }, 500);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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

    // Content moderation: verify all lessons are kid-safe
    const allLessonsFlat = modules.flatMap((mod: any) => mod.lessons || []);
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY && allLessonsFlat.length > 0) {
        const modResponse = await fetch(`${supabaseUrl}/functions/v1/moderate-content`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({ lessons: allLessonsFlat, child_age: child.age }),
        });

        if (modResponse.ok) {
          const modResult = await modResponse.json();
          if (!modResult.safe && modResult.flags?.length > 0) {
            console.log("Content moderation flagged issues:", JSON.stringify(modResult.flags));
            // Regenerate flagged lessons inline
            for (const flag of modResult.flags) {
              const idx = flag.lesson_index;
              if (idx >= 0 && idx < allLessonsFlat.length) {
                const flaggedLesson = allLessonsFlat[idx];
                const regenResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${LOVABLE_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: "google/gemini-2.5-flash",
                    messages: [
                      { role: "system", content: systemPrompt },
                      { role: "user", content: `The previous version of lesson "${flaggedLesson.title}" was flagged for: ${flag.issue}. Rewrite this single lesson to avoid this issue. Keep the same type (${flaggedLesson.type}) and duration (${flaggedLesson.duration_minutes} min). Return JSON only: { "title": "...", "description": "...", "type": "...", "duration_minutes": N, "day_number": ${flaggedLesson.day_number}, "image_prompt": "...", "content_json": { ... } }` },
                    ],
                  }),
                });
                if (regenResponse.ok) {
                  const regenData = await regenResponse.json();
                  const raw = regenData.choices?.[0]?.message?.content || "";
                  try {
                    const fixed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
                    // Find and replace in the module
                    for (const mod of modules) {
                      const lessonIdx = (mod.lessons || []).findIndex((l: any) => l.title === flaggedLesson.title && l.day_number === flaggedLesson.day_number);
                      if (lessonIdx >= 0) {
                        mod.lessons[lessonIdx] = { ...mod.lessons[lessonIdx], ...fixed };
                        break;
                      }
                    }
                  } catch { console.error("Failed to parse regenerated lesson"); }
                }
              }
            }
          }
        }
      }
    } catch (modErr) {
      console.error("Moderation check failed (proceeding anyway):", modErr);
    }

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
