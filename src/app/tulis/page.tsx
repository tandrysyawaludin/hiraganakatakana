import { WriteGame } from "@/components/WriteGame";
import { strings } from "@/lib/strings";

export default function TulisPage() {
  return (
    <section className="rounded-3xl bg-white/95 p-6 shadow-xl ring-2 ring-sky-100">
      <h1 className="text-3xl font-extrabold text-sky-600">{strings.writeTitle}</h1>
      <div className="jp mt-6">
        <WriteGame />
      </div>
    </section>
  );
}
