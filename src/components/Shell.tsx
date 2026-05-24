import Link from "next/link";
import { strings } from "@/lib/strings";

const nav = [
  { href: "/", label: strings.navHome },
  { href: "/baca", label: strings.navRead },
  { href: "/tulis", label: strings.navWrite },
  { href: "/susun", label: strings.navArrange },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-4 py-6">
      <header className="flex flex-col gap-3 rounded-3xl bg-white/90 p-4 shadow-md ring-2 ring-pink-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/" className="text-xl font-bold text-pink-600">
            {strings.siteTitle}
          </Link>
        </div>
        <nav className="flex flex-wrap gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full bg-pink-100 px-4 py-2 text-sm font-semibold text-pink-800 transition hover:bg-pink-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="rounded-2xl bg-amber-50 p-3 text-center text-sm text-amber-900">
        {strings.footerNote}
      </footer>
    </div>
  );
}
