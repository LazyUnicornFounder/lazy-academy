import { useRef, useState } from "react";
import { Pencil, Eraser, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  prompt: string;
  onSave?: (dataUrl: string) => void;
}

export const DrawingExercise = ({ prompt, onSave }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#141413");
  const [brushSize, setBrushSize] = useState(3);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    lastPoint.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPoint.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPoint.current = pos;
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
  };

  const handleSave = () => {
    const dataUrl = canvasRef.current?.toDataURL("image/png");
    if (dataUrl) onSave?.(dataUrl);
  };

  const colors = ["#141413", "#c96442", "#5b9e6f", "#5b7bbf", "#c75b8e", "#e5a84b"];

  return (
    <div className="rounded-2xl bg-[#faf9f5] border border-[#e5e4de] p-6">
      <p className="text-xs font-medium text-[#87867f] uppercase tracking-wide mb-1">
        Drawing prompt
      </p>
      <p className="text-sm text-[#5e5d59] mb-4">{prompt}</p>

      <div className="rounded-xl border border-[#e5e4de] overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full cursor-crosshair touch-none"
          style={{ aspectRatio: "3/2" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 transition-all ${
                color === c ? "border-[#141413] scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            onClick={() => setColor("#ffffff")}
            className="h-6 w-6 rounded-full border border-[#e5e4de] bg-white flex items-center justify-center ml-1"
          >
            <Eraser className="h-3 w-3 text-[#87867f]" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-[#87867f] hover:text-[#141413] text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-[#c96442] hover:bg-[#b5593a] text-white text-xs rounded-lg"
          >
            Save Drawing
          </Button>
        </div>
      </div>
    </div>
  );
};
