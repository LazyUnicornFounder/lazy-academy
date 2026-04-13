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

    // Get all users with onboarding complete
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("onboarding_complete", true);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No users to email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    for (const profile of profiles) {
      const { data: children } = await supabase
        .from("children")
        .select("id, name, avatar_url")
        .eq("user_id", profile.id);

      if (!children || children.length === 0) continue;

      const childReports = [];
      for (const child of children) {
        const [lessonsRes, progressRes, badgesRes, rewardsRes] = await Promise.all([
          supabase
            .from("lessons")
            .select("id, duration_minutes")
            .eq("child_id", child.id)
            .eq("completed", true)
            .gte("completed_at", weekAgo.toISOString()),
          supabase.from("child_progress").select("current_streak").eq("child_id", child.id).single(),
          supabase
            .from("badges")
            .select("badge_type")
            .eq("child_id", child.id)
            .gte("earned_at", weekAgo.toISOString()),
          supabase.from("child_rewards").select("xp_total, level").eq("child_id", child.id).single(),
        ]);

        const lessonsCompleted = lessonsRes.data?.length || 0;
        const totalMinutes = (lessonsRes.data || []).reduce((sum: number, l: any) => sum + (l.duration_minutes || 15), 0);
        const streak = progressRes.data?.current_streak || 0;
        const newBadges = (badgesRes.data || []).map((b: any) => b.badge_type);
        const level = rewardsRes.data?.level || 1;
        const xp = rewardsRes.data?.xp_total || 0;

        if (lessonsCompleted > 0) {
          childReports.push({ name: child.name, lessonsCompleted, totalMinutes, streak, newBadges, level, xp });
        }
      }

      if (childReports.length === 0) continue;

      // Build email HTML
      const childName = childReports[0].name;
      const html = buildWeeklyReportHtml(childReports);

      const response = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "Lazy Academy <noreply@lazyacademy.com>",
          to: [profile.email],
          subject: `${childName}'s Week in Review — Lazy Academy`,
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
    console.error("send-weekly-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

const BADGE_EMOJI: Record<string, string> = {
  first_lesson: "🌱", week_complete: "⚔️", streak_3: "🔥", streak_7: "💪",
  streak_30: "👑", quiz_master: "🧠", explorer: "🧭", speed_learner: "⚡",
};

function buildWeeklyReportHtml(reports: any[]): string {
  const childSections = reports
    .map(
      (r) => `
    <div style="background:#faf9f5;border-radius:16px;padding:24px;margin-bottom:16px;border:1px solid #e5e4de;">
      <h2 style="font-family:Georgia,serif;font-size:20px;color:#141413;margin:0 0 16px;">${r.name}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#5e5d59;font-size:14px;">Lessons completed</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#141413;font-size:14px;">${r.lessonsCompleted}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#5e5d59;font-size:14px;">Time spent</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#141413;font-size:14px;">${r.totalMinutes} min</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#5e5d59;font-size:14px;">Current streak</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#c96442;font-size:14px;">🔥 ${r.streak} days</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#5e5d59;font-size:14px;">Level / XP</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#141413;font-size:14px;">Lv.${r.level} · ${r.xp} XP</td>
        </tr>
      </table>
      ${
        r.newBadges.length > 0
          ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e4de;">
              <p style="font-size:12px;color:#87867f;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">New Badges</p>
              <p style="font-size:20px;margin:0;">${r.newBadges.map((b: string) => BADGE_EMOJI[b] || "🏅").join(" ")}</p>
            </div>`
          : ""
      }
    </div>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f5f4ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-family:Georgia,serif;font-size:24px;color:#141413;margin:0;">Weekly Learning Report</h1>
      <p style="color:#87867f;font-size:14px;margin:8px 0 0;">Lazy Academy</p>
    </div>
    ${childSections}
    <div style="text-align:center;margin-top:24px;">
      <a href="https://wonder-path-guide.lovable.app/app/parent"
         style="display:inline-block;background-color:#c96442;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:600;">
        See Full Report
      </a>
    </div>
    <p style="text-align:center;color:#87867f;font-size:12px;margin-top:32px;">
      Lazy Academy — Part of Lazy Founder Ventures
    </p>
  </div>
</body>
</html>`;
}
