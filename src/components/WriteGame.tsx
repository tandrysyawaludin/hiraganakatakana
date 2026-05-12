"use client";

import { useEffect, useRef, useState } from "react";
import type { KanaItem, Script } from "@/data/kana";
import { hiraganaTable, hintForRomaji, katakanaTable } from "@/data/kana";
import { SpeakButton } from "@/components/SpeakButton";
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

export function WriteGame() {
  const [script, setScript] = useState<Script>("hiragana");
  const table = script === "hiragana" ? hiraganaTable : katakanaTable;
  const [active, setActive] = useState<KanaItem>(table[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ghostRef = useRef<HTMLCanvasElement>(null);

  useDrawing(canvasRef, "#0ea5e9");

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
    ctx.fillText(active.char, g.width / 2, g.height / 2);
  }, [active]);

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setScript("hiragana");
            setActive(hiraganaTable[0]);
            clear();
          }}
          className={`rounded-full px-5 py-3 text-lg font-bold shadow ${
            script === "hiragana"
              ? "bg-pink-500 text-white"
              : "bg-pink-100 text-pink-800"
          }`}
        >
          {strings.hiragana}
        </button>
        <button
          type="button"
          onClick={() => {
            setScript("katakana");
            setActive(katakanaTable[0]);
            clear();
          }}
          className={`rounded-full px-5 py-3 text-lg font-bold shadow ${
            script === "katakana"
              ? "bg-indigo-500 text-white"
              : "bg-indigo-100 text-indigo-800"
          }`}
        >
          {strings.katakana}
        </button>
      </div>
      <p className="text-lg text-slate-700">{strings.writeHint}</p>
      <div className="flex flex-wrap gap-2">
        {table.map((k) => (
          <button
            type="button"
            key={`pick-${script}-${k.char}`}
            onClick={() => {
              setActive(k);
              clear();
            }}
            className={`flex min-h-16 min-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-4 text-xl font-bold ${
              active.char === k.char
                ? "border-yellow-400 bg-yellow-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <span>{k.char}</span>
            <span className="font-mono text-[9px] font-semibold text-slate-500">{k.romaji}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SpeakButton text={active.char} />
        <button
          type="button"
          onClick={clear}
          className="rounded-full bg-amber-400 px-5 py-3 text-lg font-bold text-amber-950 shadow hover:bg-amber-300"
        >
          {strings.clear}
        </button>
      </div>
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-inner ring-2 ring-slate-200">
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
      <div className="rounded-2xl bg-sky-50 p-4 ring-2 ring-sky-100">
        <p className="text-base font-bold text-slate-800">{strings.howToReadLatin}</p>
        <p className="mt-1 font-mono text-3xl font-extrabold text-sky-800">{active.romaji}</p>
        <p className="mt-3 text-lg text-slate-700">{hintForRomaji(active.romaji)}</p>
      </div>
    </div>
  );
}
