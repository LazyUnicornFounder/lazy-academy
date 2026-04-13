import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Flame, Lock, Eye, BookOpen, Wrench, Headphones,
  Gamepad2, HelpCircle, Check, LogOut, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const LESSON_ICONS: Record<string, any> = {
  video: Eye,
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
}

interface ProgressData {
  total_lessons_completed: number;
  current_streak: number;
  longest_streak: number;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [children, setChildren] = useState<Child[]>([]);
  const [activeChildIdx, setActiveChildIdx] = useState(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const activeChild = children[activeChildIdx];

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
    setDataLoading(true);
    const [modsRes, lessonsRes, progRes] = await Promise.all([
      supabase.from("curriculum_modules").select("*").eq("child_id", childId).order("week_number"),
      supabase.from("lessons").select("*").eq("child_id", childId).order("day_number"),
      supabase.from("child_progress").select("*").eq("child_id", childId).single(),
    ]);
    setModules(modsRes.data || []);
    setLessons(lessonsRes.data || []);
    setProgress(progRes.data || null);
    setDataLoading(false);
  };

  const toggleLesson = async (lesson: Lesson) => {
    const newCompleted = !lesson.completed;
    await supabase
      .from("lessons")
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq("id", lesson.id);

    // Update local state
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lesson.id
          ? { ...l, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : l
      )
    );

    // Update progress
    if (progress && activeChild) {
      const newTotal = newCompleted
        ? progress.total_lessons_completed + 1
        : Math.max(0, progress.total_lessons_completed - 1);
      const newStreak = newCompleted ? progress.current_streak + 1 : progress.current_streak;
      const newLongest = Math.max(progress.longest_streak, newStreak);

      await supabase
        .from("child_progress")
        .update({
          total_lessons_completed: newTotal,
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_at: new Date().toISOString(),
        })
        .eq("child_id", activeChild.id);

      setProgress({ ...progress, total_lessons_completed: newTotal, current_streak: newStreak, longest_streak: newLongest });
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

  // Weekly progress for bar chart (last 7 day_numbers)
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      {/* Top bar */}
      <header className="border-b border-[#e5e4de] bg-[#faf9f5]">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-[#c96442]" />
            <span className="font-serif text-lg text-[#141413]">LazyAcademy</span>
          </div>
          <div className="flex items-center gap-4">
            {progress && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-[#c96442]">
                <Flame className="h-4 w-4" />
                <span>{progress.current_streak}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => { await signOut(); navigate("/"); }}
              className="text-[#87867f] hover:text-[#141413]"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf9f5] border border-[#e5e4de] text-2xl">
              {AVATARS[activeChild.avatar_url || "owl"] || "🦉"}
            </div>
            <div>
              <h1 className="font-serif text-2xl text-[#141413]">{activeChild.name}'s Dashboard</h1>
              <p className="text-sm text-[#87867f]">Age {activeChild.age} • {progress?.total_lessons_completed || 0} lessons completed</p>
            </div>
          </div>
        )}

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
                  </div>
                </div>
                {activeModule.description && (
                  <p className="text-sm text-[#5e5d59] mb-5">{activeModule.description}</p>
                )}

                {/* Lesson cards */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {activeModuleLessons.map((lesson, i) => {
                    const Icon = LESSON_ICONS[lesson.type] || BookOpen;
                    return (
                      <motion.button
                        key={lesson.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`flex-shrink-0 w-44 rounded-xl border p-4 text-left transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${
                          lesson.completed
                            ? "bg-[#c96442]/5 border-[#c96442]/20"
                            : "bg-white border-[#e5e4de]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`h-4 w-4 ${lesson.completed ? "text-[#c96442]" : "text-[#87867f]"}`} />
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
                    <span className="text-sm font-medium text-[#141413]">{progress?.current_streak || 0} day streak</span>
                  </div>
                  <span className="text-xs text-[#87867f]">Best: {progress?.longest_streak || 0} days</span>
                </div>
              </div>
            )}

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

      {/* Lesson detail modal */}
      <AnimatePresence>
        {selectedLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedLesson(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6 shadow-xl max-h-[80vh] overflow-y-auto"
            >
              {(() => {
                const Icon = LESSON_ICONS[selectedLesson.type] || BookOpen;
                const content = selectedLesson.content_json || {};
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c96442]/10">
                        <Icon className="h-5 w-5 text-[#c96442]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#87867f] capitalize">{selectedLesson.type.replace("_", " ")} • {selectedLesson.duration_minutes} min</p>
                        <h3 className="font-serif text-lg text-[#141413]">{selectedLesson.title}</h3>
                      </div>
                    </div>

                    {selectedLesson.description && (
                      <p className="text-sm text-[#5e5d59] mb-4">{selectedLesson.description}</p>
                    )}

                    {content.instructions && (
                      <div className="rounded-xl bg-white border border-[#e5e4de] p-4 mb-4">
                        <p className="text-xs font-medium text-[#87867f] uppercase mb-2">Instructions</p>
                        <p className="text-sm text-[#141413] whitespace-pre-wrap">{content.instructions}</p>
                      </div>
                    )}

                    {content.materials && content.materials.length > 0 && (
                      <div className="rounded-xl bg-white border border-[#e5e4de] p-4 mb-4">
                        <p className="text-xs font-medium text-[#87867f] uppercase mb-2">Materials Needed</p>
                        <ul className="text-sm text-[#141413] space-y-1">
                          {content.materials.map((m: string, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                              <ChevronRight className="h-3 w-3 text-[#c96442]" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        toggleLesson(selectedLesson);
                        setSelectedLesson(null);
                      }}
                      className={`w-full h-12 rounded-xl ${
                        selectedLesson.completed
                          ? "bg-[#e5e4de] text-[#5e5d59] hover:bg-[#dddcd6]"
                          : "bg-[#c96442] hover:bg-[#b5593a] text-white"
                      }`}
                    >
                      {selectedLesson.completed ? "Mark as Incomplete" : "Mark as Complete ✓"}
                    </Button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
