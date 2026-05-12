"use client";

import { useEffect } from "react";
import { primeJapaneseVoices, speakJapanese } from "@/lib/speech";
import { strings } from "@/lib/strings";

export function SpeakButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  useEffect(() => {
    primeJapaneseVoices();
    const onVoices = () => primeJapaneseVoices();
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
  }, []);

  return (
    <button
      type="button"
      aria-label={strings.speak}
      title={strings.speak}
      onClick={() => speakJapanese(text)}
      className={
        className ??
        "inline-flex min-h-12 items-center justify-center rounded-full bg-sky-400 px-4 text-base font-bold text-white shadow-md transition hover:bg-sky-500 active:scale-95"
      }
    >
      {strings.speak}
    </button>
  );
}
