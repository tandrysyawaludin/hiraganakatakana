import Link from "next/link";
import { ArrangeGame } from "@/components/ArrangeGame";
import { strings } from "@/lib/strings";

export default function SusunCampuranPage() {
  return (
    <section className="rounded-3xl bg-white/95 p-6 shadow-xl ring-2 ring-lime-100">
      <Link
        href="/susun"
        className="text-sm font-bold text-lime-700 underline-offset-2 hover:underline"
      >
        ← {strings.susunBackHub}
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-lime-800 sm:text-3xl">
        {strings.susunCampuranTitle}
      </h1>
      <p className="mt-2 text-slate-700">{strings.susunCampuranDesc}</p>
      <div className="jp mt-6">
        <ArrangeGame />
      </div>
    </section>
  );
}
