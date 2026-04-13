import { Baby, Sparkles, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: Baby,
    title: "Tell us about your child",
    desc: "Age, interests, and learning goals — it takes 2 minutes.",
  },
  {
    icon: Sparkles,
    title: "AI builds a 30-day curriculum",
    desc: "Personalized lessons that blend their interests with real learning.",
  },
  {
    icon: CalendarCheck,
    title: "One lesson per day",
    desc: "Track progress, earn streaks, and see them grow.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-card">
      <div className="container">
        <h2 className="text-center text-2xl md:text-3xl text-foreground mb-16">
          How it works
        </h2>
        <div className="grid gap-12 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="mb-2 text-sm font-medium text-primary">Step {i + 1}</div>
              <h3 className="font-serif text-lg text-foreground mb-2">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
