import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import StepParentProfile from "@/components/onboarding/StepParentProfile";
import StepChildren from "@/components/onboarding/StepChildren";
import StepInterests from "@/components/onboarding/StepInterests";
import StepPreferences from "@/components/onboarding/StepPreferences";
import StepSchedule from "@/components/onboarding/StepSchedule";
import StepDone from "@/components/onboarding/StepDone";

export interface ChildData {
  name: string;
  age: number;
  avatar: string;
}

export interface OnboardingData {
  parentName: string;
  children: ChildData[];
  // keyed by child index
  interests: Record<number, string[]>;
  preferences: Record<number, string[]>;
  schedules: Record<number, { minutesPerDay: number; days: string[] }>;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const TOTAL_STEPS = 6;

const Setup = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [insertedChildIds, setInsertedChildIds] = useState<string[]>([]);
  // Track which child index we're configuring for interests/preferences/schedule
  const [currentChildIdx, setCurrentChildIdx] = useState(0);

  const [data, setData] = useState<OnboardingData>({
    parentName: "",
    children: [{ name: "", age: 6, avatar: "owl" }],
    interests: {},
    preferences: {},
    schedules: {},
  });

  const handleClose = useCallback(() => {
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step < 6) handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step, handleClose]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const goNext = () => {
    setDirection(1);
    // For steps 3, 4, 5 — if multiple children, cycle through them
    if ((step === 3 || step === 4 || step === 5) && currentChildIdx < data.children.length - 1) {
      setCurrentChildIdx((i) => i + 1);
      return;
    }
    setCurrentChildIdx(0);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection(-1);
    if ((step === 3 || step === 4 || step === 5) && currentChildIdx > 0) {
      setCurrentChildIdx((i) => i - 1);
      return;
    }
    if (step === 4 || step === 5) {
      setCurrentChildIdx(data.children.length - 1);
    }
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Insert children
      const childInserts = data.children.map((c) => ({
        user_id: user.id,
        name: c.name,
        age: c.age,
        avatar_url: c.avatar,
      }));

      const { data: insertedChildren, error: childErr } = await supabase
        .from("children")
        .insert(childInserts)
        .select("id");

      if (childErr) throw childErr;
      if (!insertedChildren) throw new Error("No children returned");

      setInsertedChildIds(insertedChildren.map((c) => c.id));

      // Insert interests, preferences, schedules per child
      for (let i = 0; i < insertedChildren.length; i++) {
        const childId = insertedChildren[i].id;
        const interests = data.interests[i] || [];
        const prefs = data.preferences[i] || [];
        const sched = data.schedules[i] || { minutesPerDay: 30, days: ["Mon", "Tue", "Wed", "Thu", "Fri"] };

        if (interests.length > 0) {
          const { error } = await supabase
            .from("child_interests")
            .insert(interests.map((interest) => ({ child_id: childId, interest })));
          if (error) throw error;
        }

        if (prefs.length > 0) {
          const { error } = await supabase
            .from("child_preferences")
            .insert(prefs.map((preference) => ({ child_id: childId, preference })));
          if (error) throw error;
        }

        const { error: schedErr } = await supabase
          .from("learning_schedules")
          .insert({
            child_id: childId,
            minutes_per_day: sched.minutesPerDay,
            days: sched.days,
          });
        if (schedErr) throw schedErr;
      }

      // Mark onboarding complete
      await supabase
        .from("profiles")
        .update({ onboarding_complete: true })
        .eq("id", user.id);

      // Go to done step
      setDirection(1);
      setStep(6);
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const progressPercent = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepParentProfile
            data={data}
            email={user.email || ""}
            onChange={(d) => setData(d)}
            onNext={goNext}
          />
        );
      case 2:
        return (
          <StepChildren
            data={data}
            onChange={(d) => setData(d)}
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 3:
        return (
          <StepInterests
            data={data}
            childIndex={currentChildIdx}
            onChange={(d) => setData(d)}
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 4:
        return (
          <StepPreferences
            data={data}
            childIndex={currentChildIdx}
            onChange={(d) => setData(d)}
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 5:
        return (
          <StepSchedule
            data={data}
            childIndex={currentChildIdx}
            onChange={(d) => setData(d)}
            onNext={() => {
              // If last child on last per-child step, save
              if (currentChildIdx >= data.children.length - 1) {
                handleFinish();
              } else {
                goNext();
              }
            }}
            onBack={goBack}
            saving={saving}
          />
        );
      case 6:
        return <StepDone data={data} childIds={insertedChildIds} onNavigate={() => navigate("/app")} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg text-foreground">Lazy Academy</span>
          </div>
          {step < 6 && (
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close onboarding"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="container max-w-xl pt-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Step {step} of {TOTAL_STEPS}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center pt-8 pb-16 px-4">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${step}-${currentChildIdx}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Setup;
