"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { validateKanaTrace } from "@/lib/validateKanaTrace";
import { strings } from "@/lib/strings";

function useDrawing(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  color: string,
) {
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const down = (e: PointerEvent) => {
      drawing.current = true;
      canvas.setPointerCapture(e.pointerId);
      const { x, y } = pos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const move = (e: PointerEvent) => {
      if (!drawing.current) return;
      const { x, y } = pos(e);
      ctx.strokeStyle = color;
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const up = () => {
      drawing.current = false;
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [canvasRef, color]);
}

export type KanaTracePadHandle = {
  validateTrace: () => boolean;
};

type KanaTracePadProps = {
  char: string;
  strokeColor?: string;
  onClear?: () => void;
  onStrokeStart?: () => void;
};

export const KanaTracePad = forwardRef<KanaTracePadHandle, KanaTracePadProps>(
  function KanaTracePad(
    { char, strokeColor = "#059669", onClear, onStrokeStart },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ghostRef = useRef<HTMLCanvasElement>(null);

    useDrawing(canvasRef, strokeColor);

    const clearInk = useCallback(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      onClear?.();
    }, [onClear]);

    useImperativeHandle(
      ref,
      () => ({
        validateTrace: () => {
          const c = canvasRef.current;
          if (!c) return false;
          return validateKanaTrace(c, char);
        },
      }),
      [char],
    );

    useEffect(() => {
      const g = ghostRef.current;
      if (!g) return;
      const ctx = g.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, g.width, g.height);
      ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const fontSize = Math.floor(g.height * 0.72);
      ctx.font = `${fontSize}px "Noto Sans JP", system-ui, sans-serif`;
      ctx.fillText(char, g.width / 2, g.height / 2);
    }, [char]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !onStrokeStart) return;
      const handler = () => onStrokeStart();
      canvas.addEventListener("pointerdown", handler);
      return () => canvas.removeEventListener("pointerdown", handler);
    }, [onStrokeStart]);

    return (
      <div className="flex flex-col gap-3">
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-inner ring-2 ring-emerald-200">
          <canvas
            ref={ghostRef}
            width={600}
            height={420}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
          <canvas
            ref={canvasRef}
            width={600}
            height={420}
            className="relative z-10 h-auto w-full touch-none"
          />
        </div>
        <button
          type="button"
          onClick={clearInk}
          className="self-center rounded-full bg-amber-400 px-5 py-3 text-lg font-bold text-amber-950 shadow hover:bg-amber-300"
        >
          {strings.clear}
        </button>
      </div>
    );
  },
);
