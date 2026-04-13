import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  GraduationCap, Flame, Lock, BookOpen, Wrench, Headphones,
  Gamepad2, HelpCircle, Check, ChevronRight, Crown, Sparkles,
  MoreHorizontal, RefreshCw, Star, Trophy, TrendingUp,
  RotateCcw, Rocket,
} from "lucide-react";
import AppNav from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { xpForNextLevel } from "@/lib/engagement";

const LESSON_ICONS: Record<string, any> = {
  read: BookOpen,
  hands_on: Wrench,
  audio: Headphones,
  game: Gamepad2,
  quiz: HelpCircle,
};

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

interface Module {
  id: string;
  title: string;
  description: string | null;
  theme_emoji: string | null;
  week_number: number;
  status: string;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  type: string;
  duration_minutes: number;
  day_number: number;
  completed: boolean;
  completed_at: string | null;
  content_json: any;
  is_daily_challenge: boolean;
  review_due_at: string | null;
  review_count: number;
  image_url: string | null;
}

interface ProgressData {
  total_lessons_completed: number;
  current_streak: number;
  longest_streak: number;
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["1 child", "1 module per week", "Daily lessons & exercises", "Progress tracking", "Streaks & badges"],
    polarProductId: "",
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    period: "/month",
    features: ["Unlimited children", "All modules", "Weekly email reports", "Printable worksheets", "Spaced repetition reviews", "Module capstone projects"],
    polarProductId: "4a532488-c7c1-417b-add9-7e7258c28cd1",
    featured: true,
  },
];

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [children, setChildren] = useState<Child[]>([]);
  const [activeChildIdx, setActiveChildIdx] = useState(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [rewards, setRewards] = useState<{ xp_total: number; level: number } | null>(null);
  const [reviewLessons, setReviewLessons] = useState<Lesson[]>([]);
  const [moduleProjects, setModuleProjects] = useState<any[]>([]);
  const [generatingProject, setGeneratingProject] = useState<string | null>(null);

  const activeChild = children[activeChildIdx];

  useEffect(() => {
    if (!user) return;
    // Check onboarding status first
    supabase
      .from("profiles")
      .select("onboarding_complete, plan")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data && !data.onboarding_complete) {
          navigate("/setup", { replace: true });
          return;
        }
        if (data?.plan) setCurrentPlan(data.plan);
      });
    loadChildren();
  }, [user]);


  const handleUpgrade = async (polarProductId: string, planId: string) => {
    if (!user) return;
    setCheckoutLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke("polar-checkout", {
        body: {
          product_id: polarProductId,
          user_id: user.id,
          success_url: `${window.location.origin}/app?checkout_id={CHECKOUT_ID}`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to start checkout", variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

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
    setDataLoading(true);
    const [modsRes, lessonsRes, progRes, rewardsRes, projectsRes] = await Promise.all([
      supabase.from("curriculum_modules").select("*").eq("child_id", childId).order("week_number"),
      supabase.from("lessons").select("*").eq("child_id", childId).order("day_number"),
      supabase.from("child_progress").select("*").eq("child_id", childId).single(),
      supabase.from("child_rewards").select("*").eq("child_id", childId).single(),
      supabase.from("module_projects").select("*").eq("child_id", childId),
    ]);
    setModules(modsRes.data || []);
    const allLessons = lessonsRes.data || [];
    setLessons(allLessons);
    setProgress(progRes.data || null);
    setRewards(rewardsRes.data || null);
    setModuleProjects(projectsRes.data || []);

    // Find lessons due for review
    const now = new Date().toISOString();
    const reviews = allLessons.filter(
      (l: any) => l.completed && l.review_due_at && l.review_due_at <= now
    );
    setReviewLessons(reviews);

    setDataLoading(false);
  };

  const handleRegenerate = async (moduleId: string) => {
    if (!activeChild || regenerating) return;
    setRegenerating(moduleId);
    try {
      // Delete existing lessons for this module
      await supabase.from("lessons").delete().eq("module_id", moduleId);
      // Delete the module
      await supabase.from("curriculum_modules").delete().eq("id", moduleId);

      // Re-generate
      const { error } = await supabase.functions.invoke("generate-curriculum", {
        body: { child_id: activeChild.id, single_week: true },
      });
      if (error) throw error;
      toast({ title: "Regenerated!", description: "Module has been refreshed with new content." });
      await loadChildData(activeChild.id);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to regenerate", variant: "destructive" });
    } finally {
      setRegenerating(null);
    }
  };

  const handleGenerateProject = async (moduleId: string) => {
    if (!activeChild || generatingProject) return;
    setGeneratingProject(moduleId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-project", {
        body: { child_id: activeChild.id, module_id: moduleId },
      });
      if (error) throw error;
      toast({ title: "Project created!", description: data.project?.title || "Check it out below." });
      await loadChildData(activeChild.id);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate project", variant: "destructive" });
    } finally {
      setGeneratingProject(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f4ed]">
        <p className="text-[#87867f]">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const activeModule = modules.find((m) => m.status === "active");
  const activeModuleLessons = lessons.filter((l) => l.module_id === activeModule?.id);
  const completedInModule = activeModuleLessons.filter((l) => l.completed).length;
  const moduleProgress = activeModuleLessons.length > 0 ? (completedInModule / activeModuleLessons.length) * 100 : 0;
  const lockedModules = modules.filter((m) => m.status === "locked");
  const dailyChallenge = lessons.find((l) => l.is_daily_challenge && !l.completed);

  // Weekly progress for bar chart (last 7 day_numbers)
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      {/* Top bar */}
      <AppNav />

      <div className="container py-8 max-w-4xl">
        {/* Child tabs */}
        {children.length > 1 && (
          <div className="flex gap-2 mb-8">
            {children.map((child, i) => (
              <button
                key={child.id}
                onClick={() => setActiveChildIdx(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  i === activeChildIdx
                    ? "bg-[#c96442] text-white"
                    : "bg-[#faf9f5] text-[#5e5d59] hover:bg-[#e5e4de]"
                }`}
              >
                <span>{AVATARS[child.avatar_url || "owl"] || "🦉"}</span>
                <span>{child.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Child header */}
        {activeChild && (
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf9f5] border border-[#e5e4de] text-2xl">
                {AVATARS[activeChild.avatar_url || "owl"] || "🦉"}
              </div>
              {rewards && (
                <div className="absolute -bottom-1 -right-1 bg-[#c96442] text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                  {rewards.level}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-2xl text-[#141413]">{activeChild.name}'s Dashboard</h1>
              <p className="text-sm text-[#87867f]">Age {activeChild.age} • {progress?.total_lessons_completed || 0} lessons completed</p>
              {rewards && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-[#e5e4de] overflow-hidden">
                    <div
                      className="h-full bg-[#c96442] rounded-full transition-all"
                      style={{ width: `${Math.min((xpForNextLevel(rewards.xp_total).current / xpForNextLevel(rewards.xp_total).needed) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#87867f]">{xpForNextLevel(rewards.xp_total).current}/{xpForNextLevel(rewards.xp_total).needed} XP</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/app/my-stuff")}
              className="border-[#e5e4de] text-[#5e5d59] rounded-xl text-xs"
            >
              <Trophy className="h-3.5 w-3.5 mr-1" />
              My Stuff
            </Button>
          </div>
        )}

        {/* Plan section */}
        <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#c96442]" />
              <h3 className="font-serif text-lg text-[#141413]">Your Plan</h3>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#c96442]/10 text-[#c96442] capitalize">
              {currentPlan}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 max-w-xl">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isCurrent
                      ? "border-[#c96442] bg-[#c96442]/5"
                      : plan.featured
                      ? "border-[#c96442]/30 bg-white"
                      : "border-[#e5e4de] bg-white"
                  }`}
                >
                  {plan.featured && !isCurrent && (
                    <div className="flex items-center gap-1 text-[10px] font-medium text-[#c96442] mb-2">
                      <Sparkles className="h-3 w-3" />
                      Most popular
                    </div>
                  )}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-serif text-xl text-[#141413]">{plan.price}</span>
                    <span className="text-xs text-[#87867f]">{plan.period}</span>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-[#5e5d59]">
                        <Check className="h-3 w-3 text-[#c96442] mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button
                      disabled
                      variant="outline"
                      size="sm"
                      className="w-full rounded-lg text-xs h-8 border-[#c96442]/30 text-[#c96442]"
                    >
                      Current Plan
                    </Button>
                  ) : plan.polarProductId ? (
                    <Button
                      size="sm"
                      className="w-full rounded-lg text-xs h-8 bg-[#c96442] hover:bg-[#b5593a] text-white"
                      disabled={checkoutLoading === plan.id}
                      onClick={() => handleUpgrade(plan.polarProductId, plan.id)}
                    >
                      {checkoutLoading === plan.id ? "Loading..." : `Upgrade to ${plan.name}`}
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {dataLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#87867f] text-lg">No curriculum yet. Complete onboarding to generate one!</p>
            <Button onClick={() => navigate("/setup")} className="mt-4 bg-[#c96442] hover:bg-[#b5593a]">
              Start Onboarding
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Daily Challenge */}
            {dailyChallenge && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/app/lesson/${dailyChallenge.id}`)}
                className="w-full rounded-2xl bg-[#c96442]/5 border border-[#c96442]/20 p-5 flex items-center gap-4 text-left transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c96442]/10">
                  <Star className="h-6 w-6 text-[#c96442]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-medium text-[#c96442] uppercase tracking-wide">Daily Challenge</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c96442]/10 text-[#c96442] font-medium">30 XP</span>
                  </div>
                  <p className="text-sm font-medium text-[#141413]">{dailyChallenge.title}</p>
                  <p className="text-xs text-[#87867f] mt-0.5">{dailyChallenge.duration_minutes} min</p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#c96442]" />
              </motion.button>
            )}

            {/* Active module featured card */}
            {activeModule && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{activeModule.theme_emoji || "📚"}</span>
                    <div>
                      <p className="text-xs font-medium text-[#c96442] uppercase tracking-wide">Week {activeModule.week_number} • Active</p>
                      <h2 className="font-serif text-xl text-[#141413] mt-0.5">{activeModule.title}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#87867f]">{completedInModule}/{activeModuleLessons.length}</span>
                    <div className="w-16">
                      <Progress value={moduleProgress} className="h-2" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-[#87867f] hover:text-[#141413] transition-colors p-1">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#faf9f5] border-[#e5e4de]">
                        <DropdownMenuItem
                          onClick={() => handleRegenerate(activeModule.id)}
                          disabled={!!regenerating}
                          className="text-sm text-[#5e5d59]"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${regenerating === activeModule.id ? "animate-spin" : ""}`} />
                          {regenerating === activeModule.id ? "Regenerating..." : "Regenerate Module"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {activeModule.description && (
                  <p className="text-sm text-[#5e5d59] mb-5">{activeModule.description}</p>
                )}

                {/* Lesson cards */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {activeModuleLessons.map((lesson, i) => {
                    const Icon = LESSON_ICONS[lesson.type] || BookOpen;
                    // Sequential lock: can only access if all previous lessons are completed
                    const isLocked = i > 0 && !activeModuleLessons.slice(0, i).every((l) => l.completed);
                    return (
                      <motion.button
                        key={lesson.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => !isLocked && navigate(`/app/lesson/${lesson.id}`)}
                        disabled={isLocked}
                        className={`flex-shrink-0 w-44 rounded-xl border p-4 text-left transition-all ${
                          lesson.completed
                            ? "bg-[#c96442]/5 border-[#c96442]/20"
                            : isLocked
                            ? "bg-[#faf9f5] border-[#e5e4de] opacity-50 cursor-not-allowed"
                            : "bg-white border-[#e5e4de] hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          {isLocked ? (
                            <Lock className="h-4 w-4 text-[#87867f]" />
                          ) : (
                            <Icon className={`h-4 w-4 ${lesson.completed ? "text-[#c96442]" : "text-[#87867f]"}`} />
                          )}
                          {lesson.completed && <Check className="h-4 w-4 text-[#c96442]" />}
                        </div>
                        <p className="text-sm font-medium text-[#141413] line-clamp-2">{lesson.title}</p>
                        <p className="text-xs text-[#87867f] mt-1">{lesson.duration_minutes} min • Day {lesson.day_number}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Weekly progress */}
            {activeModule && (
              <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
                <h3 className="font-serif text-lg text-[#141413] mb-4">This Week's Progress</h3>
                <div className="flex items-end gap-2 h-24">
                  {activeModuleLessons.slice(0, 7).map((lesson, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-md transition-all ${
                          lesson.completed ? "bg-[#c96442]" : "bg-[#e5e4de]"
                        }`}
                        style={{ height: lesson.completed ? "60px" : "20px" }}
                      />
                      <span className="text-[10px] text-[#87867f]">D{lesson.day_number}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#e5e4de]">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-[#c96442]" />
                    <span className="text-sm font-medium text-[#141413]">
                      {(progress?.current_streak || 0) > 0
                        ? `${progress?.current_streak} day streak`
                        : "Start your streak today!"}
                    </span>
                  </div>
                  {(progress?.longest_streak || 0) > 0 && (
                    <span className="text-xs text-[#87867f]">Best: {progress?.longest_streak} days</span>
                  )}
                </div>
              </div>
            )}

            {/* Review section */}
            {reviewLessons.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <RotateCcw className="h-4 w-4 text-[#c96442]" />
                  <h3 className="font-serif text-lg text-[#141413]">Review</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#c96442]/10 text-[#c96442] font-medium">
                    {reviewLessons.length} due
                  </span>
                </div>
                <p className="text-xs text-[#87867f] mb-3">Revisit these lessons to strengthen your memory. 5 XP each!</p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {reviewLessons.slice(0, 5).map((lesson) => {
                    const Icon = LESSON_ICONS[lesson.type] || BookOpen;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => navigate(`/app/lesson/${lesson.id}`)}
                        className="flex-shrink-0 w-40 rounded-xl border border-[#c96442]/20 bg-[#c96442]/5 p-4 text-left transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <RotateCcw className="h-3.5 w-3.5 text-[#c96442]" />
                          <span className="text-[10px] font-medium text-[#c96442]">Review</span>
                        </div>
                        <p className="text-sm font-medium text-[#141413] line-clamp-2">{lesson.title}</p>
                        <p className="text-xs text-[#87867f] mt-1">5 XP</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Module projects */}
            {modules.filter((m) => m.status === "completed").map((mod) => {
              const project = moduleProjects.find((p: any) => p.module_id === mod.id);
              if (project) {
                return (
                  <motion.div
                    key={`project-${mod.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket className="h-4 w-4 text-[#c96442]" />
                      <h3 className="font-serif text-base text-[#141413]">Module Project</h3>
                      {project.completed && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Done</span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-[#141413] mb-1">{project.title}</h4>
                    <p className="text-xs text-[#5e5d59] mb-3">{project.description}</p>
                    {project.instructions && (
                      <div className="text-xs text-[#5e5d59] whitespace-pre-wrap bg-white rounded-xl border border-[#e5e4de] p-4 mb-3">
                        {project.instructions}
                      </div>
                    )}
                    {project.photo_url && (
                      <img src={project.photo_url} alt={project.title} className="w-full h-40 object-cover rounded-xl border border-[#e5e4de] mb-3" />
                    )}
                    {!project.completed && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-[#c96442] hover:bg-[#b5593a] text-white rounded-lg text-xs"
                          onClick={async () => {
                            await supabase
                              .from("module_projects")
                              .update({ completed: true, completed_at: new Date().toISOString() })
                              .eq("id", project.id);
                            if (activeChild) await loadChildData(activeChild.id);
                          }}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Mark Done
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              }
              // No project yet for this completed module
              return (
                <motion.button
                  key={`gen-project-${mod.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleGenerateProject(mod.id)}
                  disabled={!!generatingProject}
                  className="w-full rounded-2xl bg-[#faf9f5] border border-dashed border-[#c96442]/30 p-5 flex items-center gap-4 text-left transition-all hover:bg-[#c96442]/5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c96442]/10">
                    <Rocket className="h-5 w-5 text-[#c96442]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-[#c96442] uppercase tracking-wide">
                      {generatingProject === mod.id ? "Generating..." : "Module Project"}
                    </p>
                    <p className="text-sm text-[#5e5d59]">
                      {mod.theme_emoji} {mod.title} — Create a capstone project!
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#c96442]" />
                </motion.button>
              );
            })}

            {/* Locked modules */}
            {lockedModules.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-serif text-lg text-[#141413]">Coming Up</h3>
                {lockedModules.map((mod) => (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-5 flex items-center gap-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5e4de]">
                      <Lock className="h-4 w-4 text-[#87867f]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#87867f] uppercase tracking-wide">Week {mod.week_number}</p>
                      <p className="text-sm font-medium text-[#5e5d59]">{mod.theme_emoji} {mod.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
