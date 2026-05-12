import { ArrangeGame } from "@/components/ArrangeGame";
import { strings } from "@/lib/strings";

export default function SusunPage() {
  return (
    <section className="rounded-3xl bg-white/95 p-6 shadow-xl ring-2 ring-lime-100">
      <h1 className="text-3xl font-extrabold text-lime-700">{strings.arrangeTitle}</h1>
      <div className="jp mt-6">
        <ArrangeGame />
      </div>
    </section>
  );
}
