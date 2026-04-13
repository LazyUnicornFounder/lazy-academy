import { Button } from "@/components/ui/button";
import { OnboardingData } from "@/pages/Setup";
import { Loader2 } from "lucide-react";

const TIME_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  data: OnboardingData;
  childIndex: number;
  onChange: (d: OnboardingData) => void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}

const StepSchedule = ({ data, childIndex, onChange, onNext, onBack, saving }: Props) => {
  const child = data.children[childIndex];
  const schedule = data.schedules[childIndex] || {
    minutesPerDay: 30,
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  };

  const updateSchedule = (updates: Partial<typeof schedule>) => {
    onChange({
      ...data,
      schedules: {
        ...data.schedules,
        [childIndex]: { ...schedule, ...updates },
      },
    });
  };

  const toggleDay = (day: string) => {
    const days = [...schedule.days];
    const idx = days.indexOf(day);
    if (idx >= 0) days.splice(idx, 1);
    else days.push(day);
    updateSchedule({ days });
  };

  const canContinue = schedule.days.length > 0;
  const isLastChild = childIndex >= data.children.length - 1;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-foreground">
          {child.name}'s schedule
        </h2>
        <p className="text-sm text-muted-foreground mt-1">How much time per day, and which days?</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Time per day</label>
          <div className="grid grid-cols-4 gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSchedule({ minutesPerDay: opt.value })}
                className={`rounded-lg border px-3 py-3 text-sm font-medium transition-all ${
                  schedule.minutesPerDay === opt.value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Which days?</label>
          <div className="flex gap-2">
            {DAYS.map((day) => {
              const isSelected = schedule.days.includes(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`flex-1 rounded-lg border py-3 text-xs font-medium transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-lg">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canContinue || saving}
          className="flex-1 h-12 rounded-lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isLastChild ? (
            "Finish Setup"
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepSchedule;
