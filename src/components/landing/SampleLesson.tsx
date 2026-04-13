import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Puzzle, Headphones, Paintbrush } from "lucide-react";

const sections = [
  {
    icon: BookOpen,
    label: "Read",
    title: "How Far is Mars?",
    desc: "Learn about the red planet and why its distance from Earth changes throughout the year.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Puzzle,
    label: "Activity",
    title: "Calculate the Distance",
    desc: "If light travels 186,000 miles per second, how long does it take to reach Mars?",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Headphones,
    label: "Listen",
    title: "Mars in 5 Minutes",
    desc: "A kid-friendly audio tour of the Martian surface and its biggest volcano.",
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    icon: Paintbrush,
    label: "Create",
    title: "Design a Mars Base",
    desc: "Draw or build your dream Mars colony. What would you need to survive?",
    color: "text-green-600",
    bg: "bg-green-50",
  },
];

const SampleLesson = () => {
  return (
    <section className="py-24">
      <div className="container">
        <h2 className="text-center text-2xl md:text-3xl text-foreground mb-4">
          What a lesson looks like
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Every lesson has four parts — read, do, listen, and create. Here's Day 7: Space + Math.
        </p>
        <Card className="mx-auto max-w-2xl rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <CardContent className="p-0">
            <div className="border-b px-6 py-4">
              <div className="text-xs text-muted-foreground mb-1">Day 7 · 30 minutes · ●●●○○</div>
              <h3 className="font-serif text-lg text-foreground">Space + Math: Calculate Distance to Mars</h3>
            </div>
            <div className="divide-y">
              {sections.map((s) => (
                <div key={s.label} className="flex gap-4 px-6 py-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{s.label}</div>
                    <div className="text-sm font-medium text-foreground">{s.title}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SampleLesson;
