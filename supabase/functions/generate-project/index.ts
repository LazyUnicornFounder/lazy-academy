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

    const { child_id, module_id } = await req.json();
    if (!child_id || !module_id) {
      return new Response(JSON.stringify({ error: "child_id and module_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership
    const { data: child } = await supabase
      .from("children")
      .select("*")
      .eq("id", child_id)
      .eq("user_id", user.id)
      .single();

    if (!child) {
      return new Response(JSON.stringify({ error: "Child not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the module
    const { data: module } = await supabase
      .from("curriculum_modules")
      .select("*")
      .eq("id", module_id)
      .eq("child_id", child_id)
      .single();

    if (!module) {
      return new Response(JSON.stringify({ error: "Module not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get child's interests
    const { data: interestsData } = await supabase
      .from("child_interests")
      .select("interest")
      .eq("child_id", child_id);
    const interests = (interestsData || []).map((r) => r.interest);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Create a creative capstone project for a ${child.age}-year-old child who just completed a learning module titled "${module.title}" (${module.description || ""}). Their interests include: ${interests.join(", ") || "general learning"}.

The project should be:
- Fun and hands-on
- Completable in 30-60 minutes
- Use common household materials
- Related to the module theme
- Age-appropriate

Return JSON only:
{
  "title": "short creative title",
  "description": "1-2 sentence overview",
  "instructions": "step-by-step instructions, each step on a new line",
  "materials": ["list", "of", "materials"],
  "estimated_time": 30
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
          { role: "system", content: "You are a creative children's project designer. Return JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", await aiResponse.text());
      return new Response(JSON.stringify({ error: "Failed to generate project" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let project;
    try {
      const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      project = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse project:", rawContent);
      return new Response(JSON.stringify({ error: "Failed to parse project" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert project
    const { data: inserted, error: insertErr } = await supabase
      .from("module_projects")
      .insert({
        child_id,
        module_id,
        title: project.title,
        description: project.description,
        instructions: project.instructions,
        content_json: { materials: project.materials, estimated_time: project.estimated_time },
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to save project" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, project: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-project error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
