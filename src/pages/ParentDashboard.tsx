import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  TrendingUp, Flame, Trophy, BookOpen, Star,
  Clock, Calendar, Palette, ChevronRight, BarChart3, Eye, RefreshCw,
} from "lucide-react";
import AppNav from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BADGE_CONFIG } from "@/lib/engagement";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const AVATARS: Record<string, string> = {
  owl: "🦉", fox: "🦊", bear: "🐻", rabbit: "🐰", cat: "🐱",
  dog: "🐶", panda: "🐼", unicorn: "🦄",
};

interface Child {
  id: string;
  name: string;
  age: number;
  avatar_url: string | null;
}

const ParentDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [children, setChildren] = useState<Child[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Child-specific data
  const [rewards, setRewards] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [lessonsByInterest, setLessonsByInterest] = useState<Record<string, number>>({});
  const [weeklyMinutes, setWeeklyMinutes] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [projectPhotos, setProjectPhotos] = useState<any[]>([]);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [previewModule, setPreviewModule] = useState<any>(null);
  const [previewLessons, setPreviewLessons] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const activeChild = children[activeIdx];

  useEffect(() => {
    if (!user) return;
    loadChildren();
  }, [user]);

  useEffect(() => {
    if (!activeChild) return;
    loadChildData(activeChild.id);
  }, [activeChild?.id]);

  const loadChildren = async () => {
    const { data } = await supabase
      .from("children")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at");
    if (data && data.length > 0) setChildren(data);
  };

  const loadChildData = async (childId: string) => {
    setLoading(true);
    const [rewardsRes, progRes, badgesRes, lessonsRes, interestsRes, projectsRes] = await Promise.all([
      supabase.from("child_rewards").select("*").eq("child_id", childId).single(),
      supabase.from("child_progress").select("*").eq("child_id", childId).single(),
      supabase.from("badges").select("*").eq("child_id", childId).order("earned_at", { ascending: false }),
      supabase.from("lessons").select("*").eq("child_id", childId).eq("completed", true).order("completed_at", { ascending: false }).limit(10),
      supabase.from("child_interests").select("interest").eq("child_id", childId),
      supabase.from("module_projects").select("*").eq("child_id", childId).order("created_at", { ascending: false }),
    ]);

    setRewards(rewardsRes.data);
    setProgress(progRes.data);
    setBadges(badgesRes.data || []);
    setRecentLessons(lessonsRes.data || []);
    setInterests(interestsRes.data || []);
    setProjectPhotos((projectsRes.data || []).filter((p: any) => p.photo_url));

    // Calculate lessons by interest (using module titles as proxy)
    const allLessons = lessonsRes.data || [];
    // Get all modules for this child
    const { data: modulesData } = await supabase
      .from("curriculum_modules")
      .select("id, title, description, theme_emoji, week_number, status")
      .eq("child_id", childId)
      .order("week_number");
    setModules(modulesData || []);
    const moduleMap = new Map((modulesData || []).map((m: any) => [m.id, m.title]));

    // Count completed lessons per module title
    const counts: Record<string, number> = {};
    for (const lesson of allLessons) {
      const modTitle = moduleMap.get(lesson.module_id) || "Other";
      counts[modTitle] = (counts[modTitle] || 0) + 1;
    }
    setLessonsByInterest(counts);

    // Weekly minutes calculation
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const mondayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - mondayIdx);
    monday.setHours(0, 0, 0, 0);

    const { data: weekLessons } = await supabase
      .from("lessons")
      .select("completed_at, duration_minutes")
      .eq("child_id", childId)
      .eq("completed", true)
      .gte("completed_at", monday.toISOString());

    const mins = [0, 0, 0, 0, 0, 0, 0];
    for (const l of weekLessons || []) {
      if (l.completed_at) {
        const d = new Date(l.completed_at);
        const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
        mins[idx] += l.duration_minutes || 15;
      }
    }
    setWeeklyMinutes(mins);

    // Drawing gallery - check for lessons with drawing exercises
    const { data: drawingLessons } = await supabase
      .from("lessons")
      .select("title, content_json")
      .eq("child_id", childId)
      .eq("completed", true);

    // Note: In a real implementation, drawings would be saved to storage.
    // For now, we show project photos as the gallery.
    setDrawings([]);

    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f4ed]">
        <p className="text-[#87867f]">Loading...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxMinutes = Math.max(...weeklyMinutes, 1);
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  // Strengths: top 3 by count
  const sortedInterests = Object.entries(lessonsByInterest).sort((a, b) => b[1] - a[1]);
  const strengths = sortedInterests.slice(0, 3);
  const maxStrength = strengths.length > 0 ? strengths[0][1] : 1;

  // Areas to explore: interests with fewest lessons
  const childInterestNames = (interests || []).map((i: any) => i.interest);
  const areasToExplore = childInterestNames
    .filter((name: string) => !sortedInterests.find(([k]) => k.toLowerCase().includes(name.toLowerCase())))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      {/* Header */}
      <AppNav />

      <div className="container max-w-3xl py-8">
        {/* Child tabs */}
        {children.length > 1 && (
          <div className="flex gap-2 mb-6">
            {children.map((child, i) => (
              <button
                key={child.id}
                onClick={() => setActiveIdx(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  i === activeIdx
                    ? "bg-[#c96442] text-white"
                    : "bg-[#faf9f5] text-[#5e5d59] hover:bg-[#e5e4de]"
                }`}
              >
                <span>{AVATARS[child.avatar_url || "owl"]}</span>
                <span>{child.name}</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
        ) : activeChild ? (
          <div className="space-y-6">
            {/* Summary card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-[#e5e4de] text-2xl">
                  {AVATARS[activeChild.avatar_url || "owl"]}
                </div>
                <div>
                  <h2 className="font-serif text-xl text-[#141413]">{activeChild.name}</h2>
                  <p className="text-sm text-[#87867f]">Age {activeChild.age}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl bg-white border border-[#e5e4de] p-3 text-center">
                  <TrendingUp className="h-4 w-4 text-[#c96442] mx-auto mb-1" />
                  <p className="text-lg font-serif text-[#141413]">Lv.{rewards?.level || 1}</p>
                  <p className="text-[10px] text-[#87867f]">Level</p>
                </div>
                <div className="rounded-xl bg-white border border-[#e5e4de] p-3 text-center">
                  <Star className="h-4 w-4 text-[#c96442] mx-auto mb-1" />
                  <p className="text-lg font-serif text-[#141413]">{rewards?.xp_total || 0}</p>
                  <p className="text-[10px] text-[#87867f]">Total XP</p>
                </div>
                <div className="rounded-xl bg-white border border-[#e5e4de] p-3 text-center">
                  <Flame className="h-4 w-4 text-[#c96442] mx-auto mb-1" />
                  <p className="text-lg font-serif text-[#141413]">{progress?.current_streak || 0}</p>
                  <p className="text-[10px] text-[#87867f]">Streak</p>
                </div>
                <div className="rounded-xl bg-white border border-[#e5e4de] p-3 text-center">
                  <Trophy className="h-4 w-4 text-[#c96442] mx-auto mb-1" />
                  <p className="text-lg font-serif text-[#141413]">{badges.length}</p>
                  <p className="text-[10px] text-[#87867f]">Badges</p>
                </div>
              </div>
            </motion.div>

            {/* This Week chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-[#c96442]" />
                <h3 className="font-serif text-lg text-[#141413]">This Week</h3>
              </div>
              <div className="flex items-end gap-2 h-32">
                {weekDays.map((day, i) => {
                  const isFuture = i > todayIdx;
                  const height = weeklyMinutes[i] > 0 ? (weeklyMinutes[i] / maxMinutes) * 100 : 4;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-[#87867f]">{weeklyMinutes[i]}m</span>
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          isFuture ? "bg-[#e5e4de]" : weeklyMinutes[i] > 0 ? "bg-[#c96442]" : "bg-[#e5e4de]"
                        }`}
                        style={{ height: `${height}%`, minHeight: 4 }}
                      />
                      <span className={`text-[10px] ${i === todayIdx ? "font-medium text-[#141413]" : "text-[#87867f]"}`}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Strengths & Areas to Explore */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Strengths */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6"
              >
                <h3 className="font-serif text-base text-[#141413] mb-4">Strengths</h3>
                {strengths.length > 0 ? (
                  <div className="space-y-3">
                    {strengths.map(([name, count]) => (
                      <div key={name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[#5e5d59]">{name}</span>
                          <span className="text-xs text-[#87867f]">{count} lessons</span>
                        </div>
                        <Progress
                          value={(count / maxStrength) * 100}
                          className="h-2 bg-[#e5e4de]"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#87867f]">Complete lessons to see strengths</p>
                )}
              </motion.div>

              {/* Areas to Explore */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6"
              >
                <h3 className="font-serif text-base text-[#141413] mb-4">Areas to Explore</h3>
                {areasToExplore.length > 0 ? (
                  <div className="space-y-2.5">
                    {areasToExplore.map((interest: string) => (
                      <div
                        key={interest}
                        className="flex items-center gap-2 rounded-xl bg-white border border-[#e5e4de] px-4 py-3"
                      >
                        <BookOpen className="h-4 w-4 text-[#c96442]" />
                        <span className="text-sm text-[#5e5d59]">{interest}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#87867f]">All interests are being explored!</p>
                )}
              </motion.div>
            </div>

            {/* Badges earned */}
            {badges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6"
              >
                <h3 className="font-serif text-base text-[#141413] mb-4">Badges Earned</h3>
                <div className="grid grid-cols-4 gap-3">
                  {badges.map((badge) => {
                    const cfg = BADGE_CONFIG[badge.badge_type];
                    return cfg ? (
                      <div key={badge.id} className="text-center">
                        <div className="text-2xl mb-1">{cfg.emoji}</div>
                        <p className="text-[10px] text-[#5e5d59] font-medium">{cfg.label}</p>
                      </div>
                    ) : null;
                  })}
                </div>
              </motion.div>
            )}

            {/* Curriculum Modules - Preview Lessons */}
            {modules.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.27 }}
                className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6"
              >
                <h3 className="font-serif text-base text-[#141413] mb-4">Curriculum Modules</h3>
                <div className="space-y-3">
                  {modules.map((mod: any) => (
                    <div key={mod.id} className="flex items-center justify-between rounded-xl bg-white border border-[#e5e4de] px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{mod.theme_emoji || "📚"}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-[#141413] truncate">Week {mod.week_number}: {mod.title}</p>
                          <p className="text-[10px] text-[#87867f] capitalize">{mod.status}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setPreviewModule(mod);
                          setPreviewLoading(true);
                          const { data } = await supabase
                            .from("lessons")
                            .select("*")
                            .eq("module_id", mod.id)
                            .order("day_number");
                          setPreviewLessons(data || []);
                          setPreviewLoading(false);
                        }}
                        className="text-[#c96442] hover:text-[#b5593a] text-xs gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {projectPhotos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="h-4 w-4 text-[#c96442]" />
                  <h3 className="font-serif text-base text-[#141413]">Project Gallery</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {projectPhotos.map((proj: any) => (
                    <button
                      key={proj.id}
                      onClick={() => setSelectedDrawing(proj.photo_url)}
                      className="aspect-square rounded-xl overflow-hidden border border-[#e5e4de] bg-white"
                    >
                      <img src={proj.photo_url} alt={proj.title} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-[#c96442]" />
                <h3 className="font-serif text-base text-[#141413]">Recent Activity</h3>
              </div>
              {recentLessons.length > 0 ? (
                <div className="space-y-3">
                  {recentLessons.map((lesson: any) => (
                    <div key={lesson.id} className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#141413] truncate">{lesson.title}</p>
                        <p className="text-[10px] text-[#87867f]">
                          {lesson.completed_at
                            ? formatRelativeTime(lesson.completed_at)
                            : ""}
                        </p>
                      </div>
                      <span className="text-xs text-[#87867f]">{lesson.duration_minutes}m</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#87867f]">No completed lessons yet</p>
              )}
            </motion.div>
          </div>
        ) : (
          <p className="text-[#87867f] text-center py-16">No children found. Complete onboarding first.</p>
        )}
      </div>

      {/* Full-size image dialog */}
      <Dialog open={!!selectedDrawing} onOpenChange={() => setSelectedDrawing(null)}>
        <DialogContent className="bg-[#faf9f5] border-[#e5e4de] rounded-2xl max-w-lg p-2">
          {selectedDrawing && (
            <img src={selectedDrawing} alt="Project" className="w-full rounded-xl" />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Lessons Dialog */}
      <Dialog open={!!previewModule} onOpenChange={() => setPreviewModule(null)}>
        <DialogContent className="bg-[#faf9f5] border-[#e5e4de] rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#141413]">
              {previewModule?.theme_emoji} Week {previewModule?.week_number}: {previewModule?.title}
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {previewLessons.map((lesson: any) => {
                const content = lesson.content_json || {};
                return (
                  <div key={lesson.id} className="rounded-xl bg-white border border-[#e5e4de] p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-medium text-[#141413]">
                          Day {lesson.day_number}: {lesson.title}
                        </p>
                        <p className="text-xs text-[#87867f] mt-0.5">{lesson.type} • {lesson.duration_minutes}m</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={regeneratingId === lesson.id}
                        onClick={async () => {
                          setRegeneratingId(lesson.id);
                          try {
                            const { data, error } = await supabase.functions.invoke("regenerate-lesson", {
                              body: { lesson_id: lesson.id, reason: "parent disapproval" },
                            });
                            if (error) throw error;
                            // Refresh lessons
                            const { data: refreshed } = await supabase
                              .from("lessons")
                              .select("*")
                              .eq("module_id", previewModule.id)
                              .order("day_number");
                            setPreviewLessons(refreshed || []);
                            toast({ title: "Lesson regenerated", description: "Content has been updated." });
                          } catch (e: any) {
                            toast({ title: "Error", description: e.message, variant: "destructive" });
                          } finally {
                            setRegeneratingId(null);
                          }
                        }}
                        className="text-[#c96442] hover:text-[#b5593a] text-xs gap-1 flex-shrink-0"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${regeneratingId === lesson.id ? "animate-spin" : ""}`} />
                        {regeneratingId === lesson.id ? "..." : "Regenerate"}
                      </Button>
                    </div>
                    {lesson.description && (
                      <p className="text-xs text-[#5e5d59] mb-2">{lesson.description}</p>
                    )}
                    {content.instructions && (
                      <p className="text-xs text-[#87867f] whitespace-pre-wrap line-clamp-3">{content.instructions}</p>
                    )}
                    {content.quiz && content.quiz.length > 0 && (
                      <p className="text-[10px] text-[#87867f] mt-1">📝 {content.quiz.length} quiz question{content.quiz.length > 1 ? "s" : ""}</p>
                    )}
                    {content.exercises && content.exercises.length > 0 && (
                      <p className="text-[10px] text-[#87867f] mt-0.5">🎮 {content.exercises.length} exercise{content.exercises.length > 1 ? "s" : ""}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentDashboard;
