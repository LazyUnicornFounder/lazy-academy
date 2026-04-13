import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  items: string[];
  correctOrder: string[];
  instruction?: string;
  onComplete?: (correct: boolean) => void;
}

export const SortingExercise = ({ items, correctOrder, instruction, onComplete }: Props) => {
  const [order, setOrder] = useState(() => [...items]);
  const [checked, setChecked] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const swap = (from: number, to: number) => {
    const newOrder = [...order];
    [newOrder[from], newOrder[to]] = [newOrder[to], newOrder[from]];
    setOrder(newOrder);
  };

  const handleCheck = () => {
    setChecked(true);
    const isCorrect = order.every((item, i) => item === correctOrder[i]);
    onComplete?.(isCorrect);
  };

  const isCorrect = checked && order.every((item, i) => item === correctOrder[i]);

  return (
    <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
      <p className="text-xs font-medium text-[#87867f] uppercase tracking-wide mb-1">
        Put in order
      </p>
      {instruction && (
        <p className="text-sm text-[#5e5d59] mb-4">{instruction}</p>
      )}
      <div className="space-y-2">
        {order.map((item, idx) => {
          const correctPos = checked ? correctOrder[idx] === item : null;
          return (
            <motion.div
              key={`${item}-${idx}`}
              className={`flex items-center gap-3 rounded-xl border p-3.5 text-sm transition-all cursor-move ${
                checked
                  ? correctPos
                    ? "border-green-400 bg-green-50"
                    : "border-red-400 bg-red-50"
                  : dragIdx === idx
                  ? "border-[#c96442] bg-[#c96442]/5"
                  : "border-[#e5e4de] bg-white"
              }`}
              animate={checked && !correctPos ? { x: [0, -4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== idx && !checked) swap(dragIdx, idx);
                setDragIdx(null);
              }}
              onDragEnd={() => setDragIdx(null)}
            >
              <GripVertical className="h-4 w-4 text-[#87867f] shrink-0" />
              <span className="flex-1 text-[#141413]">{item}</span>
              <span className="text-xs text-[#87867f] w-5 text-center">{idx + 1}</span>
              {checked && correctPos && <Check className="h-4 w-4 text-green-600" />}
              {checked && !correctPos && <X className="h-4 w-4 text-red-600" />}
            </motion.div>
          );
        })}
      </div>
      {!checked ? (
        <Button
          onClick={handleCheck}
          className="w-full mt-4 h-11 rounded-xl bg-[#c96442] hover:bg-[#b5593a] text-white"
        >
          Check Order
        </Button>
      ) : (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 text-sm font-medium text-center ${isCorrect ? "text-green-600" : "text-red-600"}`}
        >
          {isCorrect ? "Perfect order! 🎉" : "Not quite — try again next time!"}
        </motion.p>
      )}
    </div>
  );
};
