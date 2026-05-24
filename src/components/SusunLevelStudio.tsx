"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrangeGame } from "@/components/ArrangeGame";
import {
  puzzlesByJlptLevel,
  puzzlesCuratedKata,
  puzzlesKalimatAll,
  type JlptDeckLevel,
  type WordPuzzle,
} from "@/data/words";
import { loadPassedPuzzleIds } from "@/lib/susunProgress";
import { strings } from "@/lib/strings";

const JLPT: JlptDeckLevel[] = ["n5", "n4", "n3", "n2", "n1"];

export type SusunStudioScope = JlptDeckLevel | "kalimat" | "pilihan";

function puzzlesForScope(scope: SusunStudioScope): WordPuzzle[] {
  if (scope === "kalimat") return puzzlesKalimatAll();
  if (scope === "pilihan") return puzzlesCuratedKata();
  if (JLPT.includes(scope as JlptDeckLevel)) return puzzlesByJlptLevel(scope as JlptDeckLevel);
  return [];
}

function titleForScope(scope: SusunStudioScope): string {
  if (scope === "kalimat") return strings.susunScopeKalimat;
  if (scope === "pilihan") return strings.susunScopePilihan;
  return strings.susunScopeJlpt.replace("{level}", scope.toUpperCase());
}

function truncate(s: string, max: number) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function SusunLevelStudio({ scope }: { scope: SusunStudioScope }) {
  const puzzles = useMemo(() => puzzlesForScope(scope), [scope]);
  const [idx, setIdx] = useState(0);
  // Initialize empty to match SSR; hydrate from localStorage after mount to
  // avoid a hydration mismatch (server has no window/localStorage).
  const [passed, setPassed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setPassed(loadPassedPuzzleIds());
  }, []);

  const onPuzzlePassed = useCallback((id: string) => {
    setPassed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const list = puzzles;

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
        <p className="font-semibold">{strings.susunEmptyList}</p>
        <Link
          href="/susun"
          className="mt-4 inline-block rounded-full bg-amber-600 px-5 py-2 text-sm font-bold text-white hover:bg-amber-500"
        >
          {strings.susunBackHub}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href="/susun"
            className="text-sm font-bold text-lime-700 underline-offset-2 hover:underline"
          >
            ← {strings.susunBackHub}
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-lime-800 sm:text-3xl">
            {titleForScope(scope)}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {strings.susunStudioHint.replace("{n}", String(list.length))}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside
          className="order-2 flex max-h-[min(50vh,28rem)] flex-col rounded-2xl border border-lime-200 bg-white/95 shadow-inner lg:order-1 lg:max-h-[calc(100vh-12rem)] lg:sticky lg:top-4"
          aria-label={strings.susunListTitle}
        >
          <div className="shrink-0 border-b border-lime-100 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {strings.susunListTitle}
            </p>
            <p className="text-xs text-slate-500">{strings.susunListProgressHint}</p>
          </div>
          <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
            {list.map((p, i) => {
              const done = passed.has(p.id);
              const active = i === idx;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setIdx(i)}
                    className={`flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left text-sm transition ${
                      active
                        ? "bg-lime-200 ring-2 ring-lime-600"
                        : "bg-lime-50/80 hover:bg-lime-100"
                    }`}
                    aria-current={active ? "true" : undefined}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                        done
                          ? "border-emerald-500 bg-emerald-500 font-bold text-white"
                          : "border-lime-300 bg-white text-lime-700"
                      }`}
                      aria-label={done ? strings.susunDoneAria : strings.susunTodoAria}
                    >
                      {done ? "✓" : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug text-slate-900">
                        {truncate(p.meaningEn, 80)}
                      </span>
                      {p.meaningId ? (
                        <span className="mt-0.5 block text-xs leading-snug text-slate-600">
                          {truncate(p.meaningId, 80)}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="order-1 min-w-0 rounded-2xl border border-lime-100 bg-white/90 p-4 shadow-md lg:order-2 lg:p-5">
          <ArrangeGame
            fixedPuzzles={list}
            puzzleIndex={idx}
            onPuzzleIndexChange={setIdx}
            onPuzzlePassed={onPuzzlePassed}
          />
        </section>
      </div>
    </div>
  );
}
