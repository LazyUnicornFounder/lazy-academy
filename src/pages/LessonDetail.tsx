import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Eye, BookOpen, Wrench, Headphones, Gamepad2, HelpCircle,
  Check, X, ChevronRight, Clock, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  video: { icon: Eye, color: "text-blue-700", bg: "bg-blue-100", label: "Video" },
  read: { icon: BookOpen, color: "text-green-700", bg: "bg-green-100", label: "Read" },
  hands_on: { icon: Wrench, color: "text-[#c96442]", bg: "bg-[#c96442]/10", label: "Hands-on" },
  audio: { icon: Headphones, color: "text-purple-700", bg: "bg-purple-100", label: "Audio" },
  game: { icon: Gamepad2, color: "text-red-700", bg: "bg-red-100", label: "Game" },
  quiz: { icon: HelpCircle, color: "text-yellow-700", bg: "bg-yellow-100", label: "Quiz" },
};

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

const QuizComponent = ({ questions, onComplete }: { questions: QuizQuestion[]; onComplete: () => void }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const q = questions[currentIdx];
  if (!q) return null;
  const isCorrect = selected === q.answer;
  const isLast = currentIdx === questions.length - 1;

  const handleSelect = (opt: string) => {
    if (showResult) return;
    setSelected(opt);
    setShowResult(true);
    if (opt === q.answer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (isLast) {
      onComplete();
      return;
    }
    setSelected(null);
    setShowResult(false);
    setCurrentIdx((i) => i + 1);
  };

  return (
    <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-[#87867f] uppercase tracking-wide">
          Question {currentIdx + 1} of {questions.length}
        </p>
        <p className="text-xs text-[#87867f]">{score}/{questions.length} correct</p>
      </div>
      <h3 className="font-serif text-lg text-[#141413] mb-5">{q.question}</h3>
      <div className="grid gap-3">
        {q.options.map((opt) => {
          let cls = "border-[#e5e4de] bg-white hover:border-[#c96442]/40";
          if (showResult && opt === q.answer) cls = "border-green-500 bg-green-50";
          else if (showResult && opt === selected && !isCorrect) cls = "border-red-500 bg-red-50";
          else if (selected === opt && !showResult) cls = "border-[#c96442] bg-[#c96442]/5";

          return (
            <motion.button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`rounded-xl border p-4 text-left text-sm text-[#141413] transition-all ${cls}`}
              animate={showResult && opt === selected && !isCorrect ? { x: [0, -8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                {showResult && opt === q.answer && <Check className="h-4 w-4 text-green-600" />}
                {showResult && opt === selected && !isCorrect && <X className="h-4 w-4 text-red-600" />}
              </div>
            </motion.button>
          );
        })}
      </div>
      {showResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <Button
            onClick={handleNext}
            className="w-full h-11 rounded-xl bg-[#c96442] hover:bg-[#b5593a] text-white"
          >
            {isLast ? "Finish Quiz" : "Next Question"}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

const ConfettiPiece = ({ delay }: { delay: number }) => {
  const colors = ["#c96442", "#e5a84b", "#5b9e6f", "#5b7bbf", "#c75b8e"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const size = 6 + Math.random() * 8;

  return (
    <motion.div
      className="fixed z-[100] rounded-sm"
      style={{ backgroundColor: color, width: size, height: size, left: `${left}%`, top: -20 }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ y: "100vh", opacity: 0, rotate: 360 + Math.random() * 360 }}
      transition={{ duration: 2 + Math.random(), delay, ease: "easeIn" }}
    />
  );
};

const LessonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lesson, setLesson] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<any>(null);

  useEffect(() => {
    if (!user || !id) return;
    loadLesson();
  }, [user, id]);

  const loadLesson = async () => {
    setLoading(true);
    const { data: lessonData } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", id!)
      .single();

    if (lessonData) {
      setLesson(lessonData);
      const { data: modData } = await supabase
        .from("curriculum_modules")
        .select("*")
        .eq("id", lessonData.module_id)
        .single();
      setModule(modData);
    }
    setLoading(false);
  };

  const handleMarkComplete = useCallback(async () => {
    if (!lesson || !user || completing) return;
    setCompleting(true);

    try {
      // Mark lesson complete
      await supabase
        .from("lessons")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", lesson.id);

      // Get progress
      const { data: prog } = await supabase
        .from("child_progress")
        .select("*")
        .eq("child_id", lesson.child_id)
        .single();

      if (prog) {
        const lastActivity = prog.last_activity_at ? new Date(prog.last_activity_at) : null;
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        let newStreak = 1;
        if (lastActivity) {
          const lastDay = lastActivity.toDateString();
          const yesterdayStr = yesterday.toDateString();
          const todayStr = now.toDateString();
          if (lastDay === todayStr) newStreak = prog.current_streak;
          else if (lastDay === yesterdayStr) newStreak = prog.current_streak + 1;
        }

        const newLongest = Math.max(prog.longest_streak, newStreak);
        await supabase
          .from("child_progress")
          .update({
            total_lessons_completed: prog.total_lessons_completed + 1,
            current_streak: newStreak,
            longest_streak: newLongest,
            last_activity_at: now.toISOString(),
          })
          .eq("child_id", lesson.child_id);
      }

      // Check if all lessons in module are complete
      const { data: moduleLessons } = await supabase
        .from("lessons")
        .select("id, completed")
        .eq("module_id", lesson.module_id);

      const allComplete = moduleLessons?.every((l) => l.id === lesson.id || l.completed);

      if (allComplete && module) {
        // Mark module completed
        await supabase
          .from("curriculum_modules")
          .update({ status: "completed" })
          .eq("id", module.id);

        // Unlock next module
        const { data: nextMod } = await supabase
          .from("curriculum_modules")
          .select("id")
          .eq("child_id", lesson.child_id)
          .eq("week_number", module.week_number + 1)
          .single();

        if (nextMod) {
          await supabase
            .from("curriculum_modules")
            .update({ status: "active" })
            .eq("id", nextMod.id);
        }

        // Show celebration
        setCelebrationData({
          weekNumber: module.week_number,
          lessonsCount: moduleLessons?.length || 0,
          streak: prog?.current_streak || 1,
        });

        setShowConfetti(true);
        setShowCelebration(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        // Just confetti + navigate back
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          navigate("/app");
        }, 1500);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCompleting(false);
    }
  }, [lesson, module, user, completing, navigate, toast]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f4ed]">
        <p className="text-[#87867f]">Loading...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f4ed]">
        <div className="container max-w-2xl py-8 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#f5f4ed] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#87867f] text-lg">Lesson not found</p>
          <Button onClick={() => navigate("/app")} variant="ghost" className="mt-4 text-[#c96442]">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[lesson.type] || TYPE_CONFIG.read;
  const Icon = typeConf.icon;
  const content = lesson.content_json || {};

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <>
            {Array.from({ length: 40 }).map((_, i) => (
              <ConfettiPiece key={i} delay={Math.random() * 0.5} />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-[#e5e4de] bg-[#faf9f5]">
        <div className="container max-w-2xl flex items-center gap-3 h-14">
          <button onClick={() => navigate("/app")} className="text-[#87867f] hover:text-[#141413] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          {module && (
            <div className="flex items-center gap-1.5 text-xs text-[#87867f]">
              <span>{module.theme_emoji}</span>
              <span>Week {module.week_number}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#5e5d59]">Day {lesson.day_number}</span>
            </div>
          )}
        </div>
      </header>

      <div className="container max-w-2xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Title area */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge className={`${typeConf.bg} ${typeConf.color} border-0 text-xs font-medium`}>
                <Icon className="h-3 w-3 mr-1" />
                {typeConf.label}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-[#87867f]">
                <Clock className="h-3 w-3" />
                {lesson.duration_minutes} min
              </span>
              {lesson.completed && (
                <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                  <Check className="h-3 w-3 mr-1" /> Completed
                </Badge>
              )}
            </div>
            <h1 className="font-serif text-2xl font-medium text-[#141413]">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-[#5e5d59] mt-2 leading-relaxed">{lesson.description}</p>
            )}
          </div>

          {/* Instructions */}
          {content.instructions && (
            <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
              <p className="text-xs font-medium text-[#87867f] uppercase tracking-wide mb-3">Instructions</p>
              <div className="text-[#5e5d59] leading-relaxed whitespace-pre-wrap text-sm">
                {content.instructions}
              </div>
            </div>
          )}

          {/* Materials */}
          {content.materials && content.materials.length > 0 && (
            <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
              <p className="text-xs font-medium text-[#87867f] uppercase tracking-wide mb-3">You'll need:</p>
              <ul className="space-y-2.5">
                {content.materials.map((m: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#141413]">
                    <div className="mt-0.5 h-5 w-5 rounded-md border border-[#e5e4de] bg-white flex-shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quiz */}
          {content.quiz && content.quiz.length > 0 && (
            <QuizComponent questions={content.quiz} onComplete={() => {}} />
          )}

          {/* Mark Complete */}
          {!lesson.completed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <Button
                onClick={handleMarkComplete}
                disabled={completing}
                className="w-full h-14 rounded-2xl bg-[#c96442] hover:bg-[#b5593a] text-white text-base font-medium"
              >
                {completing ? "Saving..." : "Mark Complete ✓"}
              </Button>
            </motion.div>
          )}

          {lesson.completed && (
            <Button
              onClick={() => navigate("/app")}
              variant="outline"
              className="w-full h-12 rounded-2xl border-[#e5e4de] text-[#5e5d59]"
            >
              Back to Dashboard
            </Button>
          )}
        </motion.div>
      </div>

      {/* Celebration modal */}
      <Dialog open={showCelebration} onOpenChange={(open) => {
        if (!open) {
          setShowCelebration(false);
          navigate("/app");
        }
      }}>
        <DialogContent className="bg-[#faf9f5] border-[#e5e4de] rounded-2xl max-w-sm text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="py-4"
          >
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-serif text-2xl font-medium text-[#141413] mb-2">
              Week {celebrationData?.weekNumber} Complete!
            </h2>
            <p className="text-[#5e5d59] text-sm mb-6">
              You finished {celebrationData?.lessonsCount} lessons with a {celebrationData?.streak}-day streak!
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="h-4 w-4 text-[#c96442]" />
              <span className="text-sm font-medium text-[#c96442]">Next week unlocked</span>
              <Sparkles className="h-4 w-4 text-[#c96442]" />
            </div>
            <Button
              onClick={() => { setShowCelebration(false); navigate("/app"); }}
              className="w-full h-12 rounded-xl bg-[#c96442] hover:bg-[#b5593a] text-white"
            >
              Continue Learning
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonDetail;
