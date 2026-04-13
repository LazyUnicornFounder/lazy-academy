import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { OnboardingData, ChildData } from "@/pages/Setup";

const AVATARS = [
  { id: "owl", emoji: "🦉" },
  { id: "fox", emoji: "🦊" },
  { id: "panda", emoji: "🐼" },
  { id: "rabbit", emoji: "🐰" },
  { id: "dolphin", emoji: "🐬" },
  { id: "lion", emoji: "🦁" },
];

interface Props {
  data: OnboardingData;
  onChange: (d: OnboardingData) => void;
  onNext: () => void;
  onBack: () => void;
}

const StepChildren = ({ data, onChange, onNext, onBack }: Props) => {
  const updateChild = (index: number, updates: Partial<ChildData>) => {
    const children = [...data.children];
    children[index] = { ...children[index], ...updates };
    onChange({ ...data, children });
  };

  const addChild = () => {
    onChange({
      ...data,
      children: [...data.children, { name: "", age: 6, avatar: "owl" }],
    });
  };

  const removeChild = (index: number) => {
    if (data.children.length <= 1) return;
    const children = data.children.filter((_, i) => i !== index);
    onChange({ ...data, children });
  };

  const canContinue = data.children.every((c) => c.name.trim().length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-foreground">Who are we teaching?</h2>
        <p className="text-sm text-muted-foreground mt-1">Add your child or children below.</p>
      </div>

      <div className="space-y-6">
        {data.children.map((child, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Child {i + 1}</span>
              {data.children.length > 1 && (
                <button onClick={() => removeChild(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Child's name"
                value={child.name}
                onChange={(e) => updateChild(i, { name: e.target.value })}
                className="h-11 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label>Age</Label>
              <Select
                value={String(child.age)}
                onValueChange={(v) => updateChild(i, { age: parseInt(v) })}
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 14 }, (_, j) => j + 3).map((age) => (
                    <SelectItem key={age} value={String(age)}>
                      {age} years old
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => updateChild(i, { avatar: a.id })}
                    className={`h-12 w-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                      child.avatar === a.id
                        ? "ring-2 ring-primary bg-primary/10"
                        : "bg-muted hover:bg-accent"
                    }`}
                  >
                    {a.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="ghost" onClick={addChild} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add another child
      </Button>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-lg">
          Back
        </Button>
        <Button onClick={onNext} disabled={!canContinue} className="flex-1 h-12 rounded-lg">
          Continue
        </Button>
      </div>
    </div>
  );
};

export default StepChildren;
