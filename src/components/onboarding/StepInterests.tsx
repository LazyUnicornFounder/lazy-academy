import { Button } from "@/components/ui/button";
import { OnboardingData } from "@/pages/Setup";
import {
  Microscope, Calculator, Landmark, Palette, Music, Leaf, Rocket,
  Dog, Code, Languages, Globe, Dumbbell, CookingPot, BookOpen, Wrench,
  Drama, PenTool, Camera, Shirt, Bot, Bone, TreePine,
  Fish, CloudSun, Wand2, Crown,
} from "lucide-react";

const INTERESTS = [
  { id: "science", label: "Science", icon: Microscope },
  { id: "math", label: "Math", icon: Calculator },
  { id: "history", label: "History", icon: Landmark },
  { id: "art", label: "Art", icon: Palette },
  { id: "music", label: "Music", icon: Music },
  { id: "nature", label: "Nature", icon: Leaf },
  { id: "space", label: "Space", icon: Rocket },
  { id: "animals", label: "Animals", icon: Dog },
  { id: "coding", label: "Coding", icon: Code },
  { id: "languages", label: "Languages", icon: Languages },
  { id: "geography", label: "Geography", icon: Globe },
  { id: "sports", label: "Sports", icon: Dumbbell },
  { id: "cooking", label: "Cooking", icon: CookingPot },
  { id: "reading", label: "Reading", icon: BookOpen },
  { id: "engineering", label: "Engineering", icon: Wrench },
  { id: "dance", label: "Dance", icon: Drama },
  { id: "writing", label: "Writing", icon: PenTool },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "fashion", label: "Fashion", icon: Shirt },
  { id: "robotics", label: "Robotics", icon: Bot },
  { id: "dinosaurs", label: "Dinosaurs", icon: Bone },
  { id: "environment", label: "Environment", icon: TreePine },
  { id: "ocean-life", label: "Ocean Life", icon: Fish },
  { id: "weather", label: "Weather", icon: CloudSun },
  { id: "magic-tricks", label: "Magic Tricks", icon: Wand2 },
  { id: "chess", label: "Chess", icon: Crown },
];

interface Props {
  data: OnboardingData;
  childIndex: number;
  onChange: (d: OnboardingData) => void;
  onNext: () => void;
  onBack: () => void;
}

const StepInterests = ({ data, childIndex, onChange, onNext, onBack }: Props) => {
  const child = data.children[childIndex];
  const selected = data.interests[childIndex] || [];

  const toggle = (id: string) => {
    const current = [...selected];
    const idx = current.indexOf(id);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(id);
    onChange({ ...data, interests: { ...data.interests, [childIndex]: current } });
  };

  const canContinue = selected.length >= 3;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-foreground">{child.name} loves...</h2>
        <p className="text-sm text-muted-foreground mt-1">Pick at least 3 interests. We'll weave these into lessons.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest.id);
          return (
            <button
              key={interest.id}
              onClick={() => toggle(interest.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <interest.icon className={`h-6 w-6 ${isSelected ? "text-primary" : ""}`} />
              <span className="text-xs font-medium">{interest.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {selected.length} selected {selected.length < 3 && `(${3 - selected.length} more needed)`}
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-lg">Back</Button>
        <Button onClick={onNext} disabled={!canContinue} className="flex-1 h-12 rounded-lg">Continue</Button>
      </div>
    </div>
  );
};

export default StepInterests;
