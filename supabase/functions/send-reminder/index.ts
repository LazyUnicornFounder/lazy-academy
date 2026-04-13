import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current hour in UTC
    const now = new Date();
    const currentHour = `${String(now.getUTCHours()).padStart(2, "0")}:00:00`;

    // Find users with matching reminder time
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, reminder_time")
      .eq("reminder_enabled", true)
      .eq("reminder_time", currentHour)
      .eq("onboarding_complete", true);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders to send" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;

    for (const profile of profiles) {
      const { data: children } = await supabase
        .from("children")
        .select("name")
        .eq("user_id", profile.id)
        .limit(1);

      const childName = children?.[0]?.name || "your child";

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f5f4ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;text-align:center;">
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#141413;margin:0 0 8px;">⏰ Time for ${childName}'s lesson!</h1>
    <p style="color:#5e5d59;font-size:14px;margin:0 0 24px;">Keep the streak going — just a few minutes of learning today.</p>
    <a href="https://wonder-path-guide.lovable.app/app"
       style="display:inline-block;background-color:#c96442;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:600;">
      Start Today's Lesson
    </a>
    <p style="color:#87867f;font-size:12px;margin-top:32px;">LazyAcademy — Part of Lazy Founder Ventures</p>
  </div>
</body>
</html>`;

      const response = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "LazyAcademy <noreply@lazyacademy.com>",
          to: [profile.email],
          subject: `Time for ${childName}'s lesson! — LazyAcademy`,
          html,
        }),
      });

      if (response.ok) sent++;
      else console.error("Resend error:", await response.text());
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-reminder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
