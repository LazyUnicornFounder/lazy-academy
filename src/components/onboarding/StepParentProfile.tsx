import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { OnboardingData } from "@/pages/Setup";

interface Props {
  data: OnboardingData;
  email: string;
  onChange: (d: OnboardingData) => void;
  onNext: () => void;
}

const StepParentProfile = ({ data, email, onChange, onNext }: Props) => {
  const canContinue = data.parentName.trim().length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-foreground">What should we call you?</h2>
        <p className="text-sm text-muted-foreground mt-1">We'll use this to personalize the experience.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="parentName">Your name</Label>
          <Input
            id="parentName"
            placeholder="e.g. Sarah"
            value={data.parentName}
            onChange={(e) => onChange({ ...data, parentName: e.target.value })}
            className="h-12 rounded-lg"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={email}
            disabled
            className="h-12 rounded-lg bg-muted"
          />
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!canContinue}
        className="w-full h-12 rounded-lg"
      >
        Continue
      </Button>
    </div>
  );
};

export default StepParentProfile;
