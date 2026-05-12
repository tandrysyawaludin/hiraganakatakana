"use client";

import { useMemo, useState } from "react";
import type { KanaItem, Script } from "@/data/kana";
import { hiraganaTable, hintForRomaji, katakanaTable } from "@/data/kana";
import { SpeakButton } from "@/components/SpeakButton";
import { strings } from "@/lib/strings";

export function ReadGame() {
  const [script, setScript] = useState<Script>("hiragana");
  const table: KanaItem[] = useMemo(
    () => (script === "hiragana" ? hiraganaTable : katakanaTable),
    [script],
  );
  const [active, setActive] = useState<KanaItem | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setScript("hiragana");
            setActive(null);
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
            setActive(null);
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
      <p className="text-lg text-slate-700">{strings.readHint}</p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
        {table.map((k) => (
          <button
            type="button"
            key={`${script}-${k.char}`}
            onClick={() => setActive(k)}
            className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl border-4 text-2xl font-bold shadow-inner transition sm:text-3xl ${
              active?.char === k.char
                ? "border-yellow-400 bg-yellow-50"
                : "border-white bg-white hover:border-pink-200"
            }`}
          >
            <span>{k.char}</span>
            <span className="font-mono text-[10px] font-semibold leading-none text-slate-500 sm:text-xs">
              {k.romaji}
            </span>
          </button>
        ))}
      </div>
      {active && (
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-lg ring-2 ring-sky-100">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-6xl font-bold">{active.char}</span>
            <SpeakButton text={active.char} />
          </div>
          <div className="rounded-2xl bg-sky-50 p-4 ring-2 ring-sky-100">
            <p className="text-base font-bold text-slate-800">{strings.howToReadLatin}</p>
            <p className="mt-2 font-mono text-4xl font-extrabold tracking-wide text-sky-800 sm:text-5xl">
              {active.romaji}
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-800">{strings.soundHint}</p>
            <p className="text-lg text-slate-700">{hintForRomaji(active.romaji)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
