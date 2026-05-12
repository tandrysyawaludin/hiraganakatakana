import { ReadGame } from "@/components/ReadGame";
import { strings } from "@/lib/strings";

export default function BacaPage() {
  return (
    <section className="rounded-3xl bg-white/95 p-6 shadow-xl ring-2 ring-pink-100">
      <h1 className="text-3xl font-extrabold text-pink-600">{strings.readTitle}</h1>
      <div className="jp mt-6">
        <ReadGame />
      </div>
    </section>
  );
}
