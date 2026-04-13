import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Microscope, Calculator, Landmark, Palette, Music, Leaf, Rocket,
  Dog, Code, Globe, Dumbbell, CookingPot, BookOpen, Wrench, Camera,
  Bot, Bone, Fish, Wand2, Crown, Drama, PenTool, Shirt, CloudSun, TreePine,
} from "lucide-react";

const SUBJECTS = [
  { id: "science", label: "Science", icon: Microscope, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  { id: "math", label: "Math", icon: Calculator, bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  { id: "history", label: "History", icon: Landmark, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  { id: "art", label: "Art", icon: Palette, bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
  { id: "music", label: "Music", icon: Music, bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200" },
  { id: "nature", label: "Nature", icon: Leaf, bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  { id: "space", label: "Space", icon: Rocket, bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  { id: "animals", label: "Animals", icon: Dog, bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  { id: "coding", label: "Coding", icon: Code, bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
  { id: "geography", label: "Geography", icon: Globe, bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
  { id: "sports", label: "Sports", icon: Dumbbell, bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  { id: "cooking", label: "Cooking", icon: CookingPot, bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200" },
  { id: "reading", label: "Reading", icon: BookOpen, bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200" },
  { id: "engineering", label: "Engineering", icon: Wrench, bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  { id: "photography", label: "Photography", icon: Camera, bg: "bg-fuchsia-50", text: "text-fuchsia-600", border: "border-fuchsia-200" },
  { id: "robotics", label: "Robotics", icon: Bot, bg: "bg-zinc-50", text: "text-zinc-600", border: "border-zinc-200" },
  { id: "dinosaurs", label: "Dinosaurs", icon: Bone, bg: "bg-lime-50", text: "text-lime-600", border: "border-lime-200" },
  { id: "ocean", label: "Ocean Life", icon: Fish, bg: "bg-blue-50", text: "text-blue-500", border: "border-blue-200" },
  { id: "magic", label: "Magic", icon: Wand2, bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  { id: "chess", label: "Chess", icon: Crown, bg: "bg-stone-50", text: "text-stone-600", border: "border-stone-200" },
  { id: "dance", label: "Dance", icon: Drama, bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
  { id: "writing", label: "Writing", icon: PenTool, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { id: "fashion", label: "Fashion", icon: Shirt, bg: "bg-pink-50", text: "text-pink-500", border: "border-pink-200" },
  { id: "weather", label: "Weather", icon: CloudSun, bg: "bg-sky-50", text: "text-sky-500", border: "border-sky-200" },
  { id: "environment", label: "Environment", icon: TreePine, bg: "bg-emerald-50", text: "text-emerald-500", border: "border-emerald-200" },
];

// Double the array for seamless loop
const TICKER_ITEMS = [...SUBJECTS, ...SUBJECTS];

const Hero = () => {
  return (
    <section className="py-24 md:py-32 overflow-hidden">
      <div className="container text-center">
        <h1 className="mx-auto max-w-3xl text-4xl leading-tight md:text-6xl md:leading-tight text-foreground">
          Your kid's personalized school. Built in 60 seconds.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Pick their age. Pick their interests. AI creates a 30-day curriculum with daily lessons they'll actually enjoy.
        </p>

        {/* Subject ticker */}
        <div className="mt-12 relative">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

          <div className="flex animate-ticker gap-3 w-max">
            {TICKER_ITEMS.map((subject, i) => (
              <Link
                key={`${subject.id}-${i}`}
                to="/setup"
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all hover:scale-105 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${subject.bg} ${subject.border}`}
              >
                <subject.icon className={`h-4 w-4 ${subject.text}`} />
                <span className={`text-sm font-medium whitespace-nowrap ${subject.text}`}>{subject.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <Button size="lg" className="h-14 px-8 text-base rounded-xl" asChild>
            <Link to="/setup">
              Create a Curriculum — Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
