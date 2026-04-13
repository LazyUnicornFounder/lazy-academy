import { Button } from "@/components/ui/button";
import { OnboardingData } from "@/pages/Setup";
import { Monitor, BookOpen, Hammer, Headphones, Gamepad2 } from "lucide-react";

const PREFS = [
  { id: "visual", label: "Visual", desc: "Videos, diagrams", icon: Monitor },
  { id: "reading", label: "Reading", desc: "Articles, books", icon: BookOpen },
  { id: "hands-on", label: "Hands-on", desc: "Projects, experiments", icon: Hammer },
  { id: "audio", label: "Audio", desc: "Podcasts, stories", icon: Headphones },
  { id: "games", label: "Games", desc: "Quizzes, challenges", icon: Gamepad2 },
];

interface Props {
  data: OnboardingData;
  childIndex: number;
  onChange: (d: OnboardingData) => void;
  onNext: () => void;
  onBack: () => void;
}

const StepPreferences = ({ data, childIndex, onChange, onNext, onBack }: Props) => {
  const child = data.children[childIndex];
  const selected = data.preferences[childIndex] || [];

  const toggle = (id: string) => {
    const current = [...selected];
    const idx = current.indexOf(id);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(id);
    onChange({ ...data, preferences: { ...data.preferences, [childIndex]: current } });
  };

  const canContinue = selected.length >= 1;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-foreground">How does {child.name} learn best?</h2>
        <p className="text-sm text-muted-foreground mt-1">Pick at least 1. This shapes how lessons are delivered.</p>
      </div>

      <div className="space-y-3">
        {PREFS.map((pref) => {
          const isSelected = selected.includes(pref.id);
          return (
            <button
              key={pref.id}
              onClick={() => toggle(pref.id)}
              className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                isSelected ? "bg-primary/10" : "bg-muted"
              }`}>
                <pref.icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{pref.label}</div>
                <div className="text-xs text-muted-foreground">{pref.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-lg">Back</Button>
        <Button onClick={onNext} disabled={!canContinue} className="flex-1 h-12 rounded-lg">Continue</Button>
      </div>
    </div>
  );
};

export default StepPreferences;
