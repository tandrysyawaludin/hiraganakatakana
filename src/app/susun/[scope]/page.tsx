import { notFound } from "next/navigation";
import { SusunLevelStudio, type SusunStudioScope } from "@/components/SusunLevelStudio";

const SCOPES = ["n5", "n4", "n3", "n2", "n1", "kalimat", "pilihan"] as const satisfies readonly SusunStudioScope[];

function isScope(s: string): s is SusunStudioScope {
  return (SCOPES as readonly string[]).includes(s);
}

export function generateStaticParams() {
  return SCOPES.map((scope) => ({ scope }));
}

export default async function SusunScopePage({
  params,
}: {
  params: Promise<{ scope: string }>;
}) {
  const { scope } = await params;
  if (!isScope(scope)) notFound();

  return (
    <section className="rounded-3xl bg-white/95 p-4 shadow-xl ring-2 ring-lime-100 sm:p-6">
      <SusunLevelStudio key={scope} scope={scope} />
    </section>
  );
}
