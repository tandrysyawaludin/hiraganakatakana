"use client";

function pickJaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const ja =
    voices.find((v) => v.lang.startsWith("ja") && v.localService) ||
    voices.find((v) => v.lang.startsWith("ja")) ||
    null;
  return ja;
}

export function speakJapanese(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  const voice = pickJaVoice();
  if (voice) u.voice = voice;
  u.rate = 0.85;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

export function primeJapaneseVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
}
