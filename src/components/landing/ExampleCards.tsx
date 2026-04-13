import { Card, CardContent } from "@/components/ui/card";
import { Rocket, Bone, Code } from "lucide-react";

const examples = [
  {
    icon: Rocket,
    title: "Space + Math",
    age: "Age 8",
    sample: "Calculate the distance to Mars using multiplication",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Bone,
    title: "Dinosaurs + Reading",
    age: "Age 6",
    sample: "Read about T-Rex and write your own dino story",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Code,
    title: "Coding + Logic",
    age: "Age 12",
    sample: "Build a simple game with loops and conditionals",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
];

const ExampleCards = () => {
  return (
    <section className="py-16">
      <div className="container">
        <h2 className="text-center text-2xl md:text-3xl text-foreground mb-12">
          Sample lessons kids actually love
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {examples.map((ex) => (
            <Card key={ex.title} className="rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
              <CardContent className="p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${ex.bg} mb-4`}>
                  <ex.icon className={`h-6 w-6 ${ex.color}`} />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="font-serif text-lg text-foreground">{ex.title}</h3>
                  <span className="text-xs text-muted-foreground">{ex.age}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{ex.sample}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExampleCards;
