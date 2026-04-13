import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface Props {
  sentence: string;
  options: string[];
  answer: string;
  onComplete?: (correct: boolean) => void;
}

export const FillBlankExercise = ({ sentence, options, answer, onComplete }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (opt: string) => {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    onComplete?.(opt === answer);
  };

  const isCorrect = selected === answer;

  // Replace ___ with the selected answer or a blank
  const displaySentence = selected
    ? sentence.replace(/_{2,}/, selected)
    : sentence;

  return (
    <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
      <p className="text-xs font-medium text-[#87867f] uppercase tracking-wide mb-4">
        Fill in the blank
      </p>
      <p className="font-serif text-lg text-[#141413] mb-5 leading-relaxed">
        {displaySentence}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {options.map((opt) => {
          let cls = "border-[#e5e4de] bg-white hover:border-[#c96442]/40 text-[#141413]";
          if (revealed && opt === answer) cls = "border-green-500 bg-green-50 text-green-700";
          else if (revealed && opt === selected && !isCorrect)
            cls = "border-red-500 bg-red-50 text-red-700";

          return (
            <motion.button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${cls}`}
              animate={
                revealed && opt === selected && !isCorrect
                  ? { x: [0, -6, 6, -6, 6, 0] }
                  : {}
              }
              transition={{ duration: 0.4 }}
            >
              <span className="flex items-center gap-1.5">
                {opt}
                {revealed && opt === answer && <Check className="h-3.5 w-3.5" />}
                {revealed && opt === selected && !isCorrect && <X className="h-3.5 w-3.5" />}
              </span>
            </motion.button>
          );
        })}
      </div>
      {revealed && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 text-sm font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}
        >
          {isCorrect ? "Correct! ✨" : `The answer is: ${answer}`}
        </motion.p>
      )}
    </div>
  );
};
