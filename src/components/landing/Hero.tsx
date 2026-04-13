import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import scienceImg from "@/assets/subjects/science.png";
import mathImg from "@/assets/subjects/math.png";
import historyImg from "@/assets/subjects/history.png";
import artImg from "@/assets/subjects/art.png";
import musicImg from "@/assets/subjects/music.png";
import natureImg from "@/assets/subjects/nature.png";
import spaceImg from "@/assets/subjects/space.png";
import animalsImg from "@/assets/subjects/animals.png";
import codingImg from "@/assets/subjects/coding.png";
import geographyImg from "@/assets/subjects/geography.png";
import sportsImg from "@/assets/subjects/sports.png";
import cookingImg from "@/assets/subjects/cooking.png";
import readingImg from "@/assets/subjects/reading.png";
import engineeringImg from "@/assets/subjects/engineering.png";
import photographyImg from "@/assets/subjects/photography.png";
import roboticsImg from "@/assets/subjects/robotics.png";
import dinosaursImg from "@/assets/subjects/dinosaurs.png";
import oceanImg from "@/assets/subjects/ocean.png";
import magicImg from "@/assets/subjects/magic.png";
import chessImg from "@/assets/subjects/chess.png";
import danceImg from "@/assets/subjects/dance.png";
import writingImg from "@/assets/subjects/writing.png";
import fashionImg from "@/assets/subjects/fashion.png";
import weatherImg from "@/assets/subjects/weather.png";
import environmentImg from "@/assets/subjects/environment.png";

const SUBJECTS = [
  { id: "science", label: "Science", img: scienceImg, bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  { id: "math", label: "Math", img: mathImg, bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  { id: "history", label: "History", img: historyImg, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  { id: "art", label: "Art", img: artImg, bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
  { id: "music", label: "Music", img: musicImg, bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200" },
  { id: "nature", label: "Nature", img: natureImg, bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  { id: "space", label: "Space", img: spaceImg, bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  { id: "animals", label: "Animals", img: animalsImg, bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  { id: "coding", label: "Coding", img: codingImg, bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
  { id: "geography", label: "Geography", img: geographyImg, bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
  { id: "sports", label: "Sports", img: sportsImg, bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  { id: "cooking", label: "Cooking", img: cookingImg, bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200" },
  { id: "reading", label: "Reading", img: readingImg, bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200" },
  { id: "engineering", label: "Engineering", img: engineeringImg, bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  { id: "photography", label: "Photography", img: photographyImg, bg: "bg-fuchsia-50", text: "text-fuchsia-600", border: "border-fuchsia-200" },
  { id: "robotics", label: "Robotics", img: roboticsImg, bg: "bg-zinc-50", text: "text-zinc-600", border: "border-zinc-200" },
  { id: "dinosaurs", label: "Dinosaurs", img: dinosaursImg, bg: "bg-lime-50", text: "text-lime-600", border: "border-lime-200" },
  { id: "ocean", label: "Ocean Life", img: oceanImg, bg: "bg-blue-50", text: "text-blue-500", border: "border-blue-200" },
  { id: "magic", label: "Magic", img: magicImg, bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  { id: "chess", label: "Chess", img: chessImg, bg: "bg-stone-50", text: "text-stone-600", border: "border-stone-200" },
  { id: "dance", label: "Dance", img: danceImg, bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
  { id: "writing", label: "Writing", img: writingImg, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { id: "fashion", label: "Fashion", img: fashionImg, bg: "bg-pink-50", text: "text-pink-500", border: "border-pink-200" },
  { id: "weather", label: "Weather", img: weatherImg, bg: "bg-sky-50", text: "text-sky-500", border: "border-sky-200" },
  { id: "environment", label: "Environment", img: environmentImg, bg: "bg-emerald-50", text: "text-emerald-500", border: "border-emerald-200" },
];

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
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

          <div className="flex animate-ticker gap-3 w-max">
            {TICKER_ITEMS.map((subject, i) => (
              <Link
                key={`${subject.id}-${i}`}
                to="/setup"
                className={`flex flex-col items-center rounded-xl border overflow-hidden transition-all hover:scale-105 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${subject.bg} ${subject.border} w-28 shrink-0`}
              >
                <img
                  src={subject.img}
                  alt={subject.label}
                  width={112}
                  height={112}
                  loading="lazy"
                  className="w-28 h-28 object-cover"
                />
                <span className={`text-xs font-medium whitespace-nowrap py-2 ${subject.text}`}>{subject.label}</span>
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
