"use client";

import { useState } from "react";
import { wordPuzzles } from "@/data/words";
import { SpeakButton } from "@/components/SpeakButton";
import { speakJapanese } from "@/lib/speech";
import { strings } from "@/lib/strings";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ArrangeGame() {
  const [idx, setIdx] = useState(0);
  const puzzle = wordPuzzles[idx % wordPuzzles.length];
  const [slots, setSlots] = useState<(string | null)[]>(() =>
    wordPuzzles[0].answer.map(() => null),
  );
  const [bankLeft, setBankLeft] = useState<string[]>(() =>
    shuffle(wordPuzzles[0].answer),
  );
  const [feedback, setFeedback] = useState<"idle" | "ok" | "bad">("idle");

  const pickFromBank = (letter: string, bankIndex: number) => {
    const empty = slots.findIndex((s) => s === null);
    if (empty === -1) return;
    const nextSlots = [...slots];
    nextSlots[empty] = letter;
    setSlots(nextSlots);
    const nb = [...bankLeft];
    nb.splice(bankIndex, 1);
    setBankLeft(nb);
    setFeedback("idle");
  };

  const returnToBank = (slotIndex: number) => {
    const ch = slots[slotIndex];
    if (!ch) return;
    const nextSlots = [...slots];
    nextSlots[slotIndex] = null;
    setSlots(nextSlots);
    setBankLeft((b) => [...b, ch]);
    setFeedback("idle");
  };

  const check = () => {
    const ok = slots.every((s, i) => s === puzzle.answer[i]);
    setFeedback(ok ? "ok" : "bad");
    if (ok) speakJapanese(puzzle.answer.join(""));
  };

  const next = () => {
    const n = (idx + 1) % wordPuzzles.length;
    const p = wordPuzzles[n];
    setIdx(n);
    setSlots(p.answer.map(() => null));
    setBankLeft(shuffle(p.answer));
    setFeedback("idle");
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-lg text-slate-700">{strings.arrangeHint}</p>
      <div className="rounded-3xl bg-white p-5 shadow-lg ring-2 ring-lime-100">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {strings.meaning}
        </p>
        <p className="text-2xl font-bold text-slate-800">{puzzle.meaningId}</p>
        <p className="mt-4 text-sm font-bold text-slate-600">{strings.wordHowToRead}</p>
        <p className="mt-1 font-mono text-3xl font-extrabold tracking-wide text-violet-800 sm:text-4xl">
          {puzzle.romaji}
        </p>
      </div>
      <div className="flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-3xl bg-lime-50 p-4 ring-2 ring-lime-200">
        {slots.map((s, i) => (
          <button
            type="button"
            key={`slot-${i}-${puzzle.id}`}
            onClick={() => returnToBank(i)}
            className="flex h-20 w-16 items-center justify-center rounded-2xl border-4 border-dashed border-lime-300 bg-white text-4xl font-bold text-slate-800 shadow-inner"
          >
            {s ?? ""}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {bankLeft.map((ch, i) => (
          <button
            type="button"
            key={`${puzzle.id}-${ch}-${i}`}
            onClick={() => pickFromBank(ch, i)}
            className="min-h-16 min-w-16 rounded-2xl bg-lime-400 text-3xl font-bold text-lime-950 shadow-md transition hover:bg-lime-300 active:scale-95"
          >
            {ch}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SpeakButton text={puzzle.answer.join("")} />
        <button
          type="button"
          onClick={check}
          className="rounded-full bg-emerald-500 px-6 py-3 text-lg font-bold text-white shadow hover:bg-emerald-400"
        >
          {strings.arrangeCheck}
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-full bg-violet-500 px-6 py-3 text-lg font-bold text-white shadow hover:bg-violet-400"
        >
          {strings.arrangeNext}
        </button>
      </div>
      {feedback === "ok" && (
        <p className="text-center text-2xl font-bold text-emerald-600">
          {strings.arrangeCorrect}
        </p>
      )}
      {feedback === "bad" && (
        <p className="text-center text-2xl font-bold text-rose-600">
          {strings.arrangeTryAgain}
        </p>
      )}
    </div>
  );
}
