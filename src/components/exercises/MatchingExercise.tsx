import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface Pair {
  left: string;
  right: string;
}

interface Props {
  pairs: Pair[];
  onComplete?: (score: { correct: number; total: number }) => void;
}

export const MatchingExercise = ({ pairs, onComplete }: Props) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Shuffle right side once
  const [shuffledRight] = useState(() =>
    [...pairs].sort(() => Math.random() - 0.5).map((p) => p.right)
  );

  const handleRightClick = (rightItem: string) => {
    if (!selectedLeft || matched.has(rightItem)) return;

    const pair = pairs.find((p) => p.left === selectedLeft);
    setAttempts((a) => a + 1);

    if (pair && pair.right === rightItem) {
      const newMatched = new Set(matched);
      newMatched.add(selectedLeft);
      newMatched.add(rightItem);
      setMatched(newMatched);
      setScore((s) => s + 1);
      setSelectedLeft(null);

      if (newMatched.size === pairs.length * 2) {
        onComplete?.({ correct: score + 1, total: pairs.length });
      }
    } else {
      setWrong(rightItem);
      setTimeout(() => {
        setWrong(null);
        setSelectedLeft(null);
      }, 600);
    }
  };

  return (
    <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
      <p className="text-xs font-medium text-[#87867f] uppercase tracking-wide mb-4">
        Match the pairs
      </p>
      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-2.5">
          {pairs.map((p) => {
            const isMatched = matched.has(p.left);
            const isSelected = selectedLeft === p.left;
            return (
              <motion.button
                key={p.left}
                onClick={() => !isMatched && setSelectedLeft(p.left)}
                className={`w-full rounded-xl border p-3.5 text-sm text-left transition-all ${
                  isMatched
                    ? "border-green-400 bg-green-50 text-green-700"
                    : isSelected
                    ? "border-[#c96442] bg-[#c96442]/5 text-[#141413]"
                    : "border-[#e5e4de] bg-white text-[#141413] hover:border-[#c96442]/40"
                }`}
                animate={isMatched ? { scale: [1, 1.05, 1] } : {}}
              >
                <div className="flex items-center justify-between">
                  <span>{p.left}</span>
                  {isMatched && <Check className="h-4 w-4 text-green-600" />}
                </div>
              </motion.button>
            );
          })}
        </div>
        {/* Right column */}
        <div className="space-y-2.5">
          {shuffledRight.map((item) => {
            const isMatched = matched.has(item);
            const isWrong = wrong === item;
            return (
              <motion.button
                key={item}
                onClick={() => handleRightClick(item)}
                className={`w-full rounded-xl border p-3.5 text-sm text-left transition-all ${
                  isMatched
                    ? "border-green-400 bg-green-50 text-green-700"
                    : isWrong
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-[#e5e4de] bg-white text-[#141413] hover:border-[#c96442]/40"
                }`}
                animate={isWrong ? { x: [0, -6, 6, -6, 6, 0] } : isMatched ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-between">
                  <span>{item}</span>
                  {isMatched && <Check className="h-4 w-4 text-green-600" />}
                  {isWrong && <X className="h-4 w-4 text-red-600" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      {matched.size === pairs.length * 2 && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-sm font-medium text-green-600"
        >
          All matched! 🎉
        </motion.p>
      )}
    </div>
  );
};
