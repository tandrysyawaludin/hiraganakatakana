"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KanaTracePad, type KanaTracePadHandle } from "@/components/KanaTracePad";
import { SpeakButton } from "@/components/SpeakButton";
import {
  puzzlesByCategory,
  type WordCategory,
  type WordPuzzle,
} from "@/data/words";
import { speakJapanese } from "@/lib/speech";
import { strings } from "@/lib/strings";

const initialList = puzzlesByCategory("kata");
const initialPuzzle = initialList[0]!;

/** Same input → same order (SSR + client must match; no Math.random). */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleDeterministic<T>(arr: T[], seedKey: string): T[] {
  const a = [...arr];
  const rnd = mulberry32(hashSeed(seedKey));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type PlayMode = "click" | "write";

function emptySlots(p: WordPuzzle): (string | null)[] {
  return p.answer.map(() => null);
}

const categoryTabs: {
  id: WordCategory;
  labelKey: "arrangeCatLearnWords" | "arrangeCatLearnSentences";
}[] = [
  { id: "kata", labelKey: "arrangeCatLearnWords" },
  { id: "kalimat", labelKey: "arrangeCatLearnSentences" },
];

export function ArrangeGame() {
  const [category, setCategory] = useState<WordCategory>("kata");
  const [playMode, setPlayMode] = useState<PlayMode>("click");
  const puzzles = useMemo(() => puzzlesByCategory(category), [category]);
  const [idx, setIdx] = useState(0);
  const puzzle = puzzles[idx % puzzles.length];
  const [slots, setSlots] = useState<(string | null)[]>(() =>
    emptySlots(initialPuzzle),
  );
  const [bankLeft, setBankLeft] = useState<string[]>(() =>
    shuffleDeterministic(initialPuzzle.answer, `kata-${initialPuzzle.id}-0`),
  );
  const [writeStep, setWriteStep] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "ok" | "bad" | "shape">("idle");
  const traceRef = useRef<KanaTracePadHandle>(null);

  const syncClickForPuzzle = (p: WordPuzzle, bankSeed: string) => {
    setSlots(emptySlots(p));
    setBankLeft(shuffleDeterministic(p.answer, bankSeed));
    setWriteStep(0);
    setFeedback("idle");
  };

  const syncWriteForPuzzle = (p: WordPuzzle) => {
    setSlots(emptySlots(p));
    setWriteStep(0);
    setBankLeft([]);
    setFeedback("idle");
  };

  const applyModeForPuzzle = (p: WordPuzzle, mode: PlayMode, bankSeed: string) => {
    if (mode === "click") syncClickForPuzzle(p, bankSeed);
    else syncWriteForPuzzle(p);
  };

  const setCategoryAndReset = (c: WordCategory) => {
    const list = puzzlesByCategory(c);
    const first = list[0]!;
    setCategory(c);
    setIdx(0);
    applyModeForPuzzle(first, playMode, `${c}-${first.id}-0`);
  };

  const setPlayModeAndReset = (mode: PlayMode) => {
    setPlayMode(mode);
    applyModeForPuzzle(
      puzzle,
      mode,
      `${category}-${puzzle.id}-${idx}`,
    );
  };

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
    const n = (idx + 1) % puzzles.length;
    const p = puzzles[n]!;
    setIdx(n);
    applyModeForPuzzle(p, playMode, `${category}-${p.id}-${n}`);
  };

  const finishWriteLetter = () => {
    if (writeStep >= puzzle.answer.length) return;
    const current = puzzle.answer[writeStep];
    if (!current) return;
    if (!traceRef.current?.validateTrace()) {
      setFeedback("shape");
      return;
    }
    const nextSlots = [...slots];
    nextSlots[writeStep] = current;
    setSlots(nextSlots);
    const nextStep = writeStep + 1;
    setWriteStep(nextStep);
    if (nextStep >= puzzle.answer.length) {
      setFeedback("ok");
      speakJapanese(puzzle.answer.join(""));
    } else {
      setFeedback("idle");
    }
  };

  const topHint =
    playMode === "click" ? strings.arrangeHint : strings.arrangeHintWrite;

  const writeProgress = strings.arrangeWriteProgress
    .replace("{n}", String(writeStep + 1))
    .replace("{total}", String(puzzle.answer.length));

  useEffect(() => {
    if (feedback !== "shape" && feedback !== "bad") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFeedback("idle");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [feedback]);

  const showErrorModal = feedback === "shape" || feedback === "bad";
  const errorModalTitle =
    feedback === "shape" ? strings.arrangeShapeErrorTitle : strings.arrangeClickErrorTitle;
  const errorModalBody =
    feedback === "shape" ? strings.arrangeWriteWrong : strings.arrangeTryAgain;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {strings.arrangePickType}
        </p>
        <div className="flex flex-wrap gap-2">
          {categoryTabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setCategoryAndReset(tab.id)}
              className={`rounded-full px-4 py-2 text-base font-bold shadow transition sm:px-5 sm:py-3 sm:text-lg ${
                category === tab.id
                  ? "bg-lime-600 text-white ring-2 ring-lime-800"
                  : "bg-lime-100 text-lime-900 hover:bg-lime-200"
              }`}
            >
              {strings[tab.labelKey]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {strings.arrangePickHow}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPlayModeAndReset("click")}
            className={`rounded-full px-4 py-2 text-base font-bold shadow sm:px-5 sm:py-3 sm:text-lg ${
              playMode === "click"
                ? "bg-violet-600 text-white ring-2 ring-violet-900"
                : "bg-violet-100 text-violet-900 hover:bg-violet-200"
            }`}
          >
            {strings.arrangeModeClick}
          </button>
          <button
            type="button"
            onClick={() => setPlayModeAndReset("write")}
            className={`rounded-full px-4 py-2 text-base font-bold shadow sm:px-5 sm:py-3 sm:text-lg ${
              playMode === "write"
                ? "bg-emerald-600 text-white ring-2 ring-emerald-900"
                : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
            }`}
          >
            {strings.arrangeModeWrite}
          </button>
        </div>
      </div>

      <p className="text-lg text-slate-700">{topHint}</p>

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

      {playMode === "write" && feedback !== "ok" && (
        <p className="text-center text-xl font-bold text-emerald-800">{writeProgress}</p>
      )}

      <div className="flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-3xl bg-lime-50 p-4 ring-2 ring-lime-200">
        {slots.map((s, i) => {
          const highlightWrite =
            playMode === "write" && feedback !== "ok" && i === writeStep && !s;
          const commonBox =
            "flex h-20 w-14 min-w-14 items-center justify-center rounded-2xl border-4 text-3xl font-bold text-slate-800 shadow-inner sm:h-20 sm:w-16 sm:text-4xl";
          if (playMode === "click") {
            return (
              <button
                type="button"
                key={`slot-${i}-${puzzle.id}`}
                onClick={() => returnToBank(i)}
                className={`${commonBox} border-dashed border-lime-300 bg-white ${
                  highlightWrite ? "" : ""
                }`}
              >
                {s ?? ""}
              </button>
            );
          }
          return (
            <div
              key={`slot-${i}-${puzzle.id}`}
              className={`${commonBox} border-lime-300 bg-white ${
                highlightWrite ? "ring-4 ring-emerald-400 ring-offset-2" : ""
              }`}
            >
              {s ?? ""}
            </div>
          );
        })}
      </div>

      {playMode === "click" && (
        <div className="flex flex-wrap justify-center gap-2">
          {bankLeft.map((ch, i) => (
            <button
              type="button"
              key={`${puzzle.id}-${ch}-${i}`}
              onClick={() => pickFromBank(ch, i)}
              className="min-h-16 min-w-14 rounded-2xl bg-lime-400 px-1 text-2xl font-bold text-lime-950 shadow-md transition hover:bg-lime-300 active:scale-95 sm:min-w-16 sm:text-3xl"
            >
              {ch}
            </button>
          ))}
        </div>
      )}

      {playMode === "write" && feedback !== "ok" && (
        <div className="flex flex-col gap-4 rounded-3xl bg-emerald-50/80 p-4 ring-2 ring-emerald-100">
          <KanaTracePad
            ref={traceRef}
            key={`${puzzle.id}-trace-${writeStep}`}
            char={puzzle.answer[writeStep] ?? ""}
            onClear={() => setFeedback((f) => (f === "shape" ? "idle" : f))}
            onStrokeStart={() => setFeedback((f) => (f === "shape" ? "idle" : f))}
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <SpeakButton text={puzzle.answer[writeStep] ?? ""} />
            <button
              type="button"
              onClick={finishWriteLetter}
              className="rounded-full bg-emerald-600 px-6 py-3 text-lg font-bold text-white shadow hover:bg-emerald-500"
            >
              {strings.arrangeDoneLetter}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <SpeakButton text={puzzle.answer.join("")} />
        {playMode === "click" && (
          <button
            type="button"
            onClick={check}
            className="rounded-full bg-emerald-500 px-6 py-3 text-lg font-bold text-white shadow hover:bg-emerald-400"
          >
            {strings.arrangeCheck}
          </button>
        )}
        {feedback === "ok" && (
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-violet-500 px-6 py-3 text-lg font-bold text-white shadow hover:bg-violet-400"
          >
            {strings.arrangeNext}
          </button>
        )}
      </div>

      {feedback === "ok" && (
        <p className="text-center text-2xl font-bold text-emerald-600">
          {strings.arrangeCorrect}
        </p>
      )}

      {showErrorModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="arrange-error-title"
          aria-describedby="arrange-error-desc"
          onClick={() => setFeedback("idle")}
        >
          <div
            className="max-h-[min(90vh,32rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-4 ring-rose-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="arrange-error-title"
              className="text-center text-2xl font-extrabold text-rose-700"
            >
              {errorModalTitle}
            </h2>
            <p
              id="arrange-error-desc"
              className="mt-4 text-center text-lg leading-relaxed text-slate-700"
            >
              {errorModalBody}
            </p>
            <button
              type="button"
              className="mt-8 w-full rounded-full bg-rose-600 py-4 text-lg font-bold text-white shadow-md transition hover:bg-rose-500 active:scale-[0.99]"
              onClick={() => setFeedback("idle")}
            >
              {strings.arrangeShapeErrorOk}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
