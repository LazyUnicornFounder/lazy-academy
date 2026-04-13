import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { OnboardingData } from "@/pages/Setup";

const funFacts = [
  "Kids who follow their interests learn 3x faster! 🚀",
  "Short daily lessons beat long weekly sessions 📚",
  "Mixing subjects improves memory retention 🧠",
  "Creativity boosts problem-solving skills 🎨",
];

interface Props {
  data: OnboardingData;
  onNavigate: () => void;
}

const StepDone = ({ data, onNavigate }: Props) => {
  const [factIndex, setFactIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const firstName = data.children[0]?.name || "your child";

  useEffect(() => {
    const factTimer = setInterval(() => {
      setFactIndex((i) => (i + 1) % funFacts.length);
    }, 2000);

    const readyTimer = setTimeout(() => setReady(true), 3000);

    return () => {
      clearInterval(factTimer);
      clearTimeout(readyTimer);
    };
  }, []);

  return (
    <div className="text-center space-y-8 py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
      >
        <Sparkles className="h-10 w-10 text-primary" />
      </motion.div>

      <div>
        <h2 className="font-serif text-2xl text-foreground">
          We're building {firstName}'s curriculum!
        </h2>
        <p className="text-sm text-muted-foreground mt-2">This will just take a moment...</p>
      </div>

      <motion.div
        key={factIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-xl bg-card border p-4"
      >
        <p className="text-sm text-muted-foreground">{funFacts[factIndex]}</p>
      </motion.div>

      {!ready && (
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      )}

      {ready && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button onClick={onNavigate} className="h-12 px-8 rounded-lg">
            Go to Dashboard 🎉
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default StepDone;
