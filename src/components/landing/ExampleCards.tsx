import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Calendar, Users, Trophy } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Personalized Curriculum",
    desc: "AI blends your child's interests into themed weekly modules with daily lessons they'll love.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Calendar,
    title: "Daily Challenges",
    desc: "Fresh challenges every day to keep learning exciting. Earn bonus XP for completing them.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Users,
    title: "Parent Dashboard",
    desc: "Track progress, review lesson content, and see your child's strengths at a glance.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Trophy,
    title: "Rewards & Badges",
    desc: "Earn XP, level up, unlock accessories, and collect badges to stay motivated.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
];

const ExampleCards = () => {
  return (
    <section className="py-24">
      <div className="container">
        <h2 className="text-center text-2xl md:text-3xl text-foreground mb-4">
          Everything your child needs to love learning
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Built for kids ages 3–16. No screens, no passive watching — just active, curious learning.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="rounded-2xl border shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
              <CardContent className="p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} mb-4`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="font-serif text-lg text-foreground mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExampleCards;
