import Link from "next/link";
import { strings } from "@/lib/strings";

const cards = [
  {
    href: "/baca",
    title: strings.navRead,
    desc: strings.readHint,
    color: "from-pink-400 to-rose-400",
  },
  {
    href: "/tulis",
    title: strings.navWrite,
    desc: strings.writeHint,
    color: "from-sky-400 to-indigo-400",
  },
  {
    href: "/susun",
    title: strings.navArrange,
    desc: strings.arrangeCardDesc,
    color: "from-lime-400 to-emerald-400",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl bg-white/90 p-6 shadow-lg ring-2 ring-pink-100">
        <h1 className="text-3xl font-extrabold text-pink-600 sm:text-4xl">
          {strings.siteTitle}
        </h1>
        <p className="mt-2 text-xl font-semibold text-slate-700">
          {strings.siteSubtitle}
        </p>
        <p className="mt-4 text-lg text-slate-600">{strings.homeIntro}</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`flex flex-col justify-between rounded-3xl bg-gradient-to-br p-5 text-white shadow-lg ring-2 ring-white/40 transition hover:scale-[1.02] active:scale-95 ${c.color}`}
          >
            <h2 className="text-2xl font-extrabold">{c.title}</h2>
            <p className="mt-3 text-base font-semibold leading-snug text-white/95">
              {c.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
