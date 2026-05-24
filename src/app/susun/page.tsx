import Link from "next/link";
import {
  puzzlesByJlptLevel,
  puzzlesCuratedKata,
  puzzlesKalimatAll,
} from "@/data/words";
import { strings } from "@/lib/strings";

const JLPT = ["n5", "n4", "n3", "n2", "n1"] as const;

export default function SusunHubPage() {
  const kalimatCount = puzzlesKalimatAll().length;
  const pilihanCount = puzzlesCuratedKata().length;

  return (
    <section className="rounded-3xl bg-white/95 p-6 shadow-xl ring-2 ring-lime-100">
      <h1 className="text-3xl font-extrabold text-lime-700">{strings.arrangeTitle}</h1>
      <p className="mt-3 max-w-2xl text-lg text-slate-700">{strings.susunHubIntro}</p>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">
        JLPT
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {JLPT.map((lv) => {
          const n = puzzlesByJlptLevel(lv).length;
          return (
            <Link
              key={lv}
              href={`/susun/${lv}`}
              className="flex flex-col rounded-2xl border-2 border-lime-200 bg-gradient-to-br from-lime-50 to-emerald-50 p-4 shadow-md transition hover:border-lime-400 hover:shadow-lg active:scale-[0.99]"
            >
              <span className="text-2xl font-extrabold text-lime-800">
                {lv.toUpperCase()}
              </span>
              <span className="mt-1 text-sm font-semibold text-slate-600">
                {strings.susunCardCount.replace("{n}", String(n))}
              </span>
            </Link>
          );
        })}
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">
        {strings.susunMoreTitle}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Link
          href="/susun/kalimat"
          className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-4 font-bold text-violet-900 shadow-md transition hover:border-violet-400 hover:shadow-lg"
        >
          {strings.susunScopeKalimat}
          <span className="mt-1 block text-sm font-semibold text-violet-800/90">
            {strings.susunCardCount.replace("{n}", String(kalimatCount))}
          </span>
        </Link>
        <Link
          href="/susun/pilihan"
          className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4 font-bold text-sky-900 shadow-md transition hover:border-sky-400 hover:shadow-lg"
        >
          {strings.susunScopePilihan}
          <span className="mt-1 block text-sm font-semibold text-sky-800/90">
            {strings.susunCardCount.replace("{n}", String(pilihanCount))}
          </span>
        </Link>
        <Link
          href="/susun/campuran"
          className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 font-bold text-amber-900 shadow-md transition hover:border-amber-400 hover:shadow-lg sm:col-span-2"
        >
          {strings.susunCampuranTitle}
          <span className="mt-1 block text-sm font-semibold text-amber-800/90">
            {strings.susunCampuranDesc}
          </span>
        </Link>
      </div>
    </section>
  );
}
