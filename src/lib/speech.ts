"use client";

// Voice names ranked best-first. The first match wins, so list highest-quality
// neural / enhanced voices first and fall back to the basic OS voices.
const HIGH_QUALITY_VOICE_PATTERNS: RegExp[] = [
  /Google\s+日本語/i,
  /Google.*\bja(-|_|$)/i,
  /Microsoft\s+(Nanami|Keita|Aoi|Daichi|Mayu|Naoki|Shiori).*Online.*Natural/i,
  /Microsoft\s+(Nanami|Keita|Aoi|Daichi|Mayu|Naoki|Shiori).*Natural/i,
  /Microsoft\s+(Nanami|Keita|Aoi|Daichi|Mayu|Naoki|Shiori|Ayumi|Haruka|Ichiro|Sayaka)/i,
  /Kyoko.*(Premium|Enhanced)/i,
  /Otoya.*(Premium|Enhanced)/i,
  /Hattori.*(Premium|Enhanced)/i,
  /Kyoko/i,
  /Otoya/i,
  /Hattori/i,
];

function isJapaneseLang(lang: string): boolean {
  return /^ja(-|_|$)/i.test(lang);
}

function pickJaVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis
    .getVoices()
    .filter((v) => isJapaneseLang(v.lang));
  if (voices.length === 0) return null;
  for (const pattern of HIGH_QUALITY_VOICE_PATTERNS) {
    const match = voices.find((v) => pattern.test(v.name));
    if (match) return match;
  }
  // Prefer non-localService entries (often higher-quality network voices) before falling back.
  const remote = voices.find((v) => !v.localService);
  return remote ?? voices[0];
}

let activeAudio: HTMLAudioElement | null = null;

function stopActiveAudio(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.removeAttribute("src");
      activeAudio.load();
    } catch {
      // ignore — element may already be detached
    }
    activeAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

function speakWithSynthesis(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  const voice = pickJaVoice();
  if (voice) utterance.voice = voice;
  // Slightly slower than natural to help learners distinguish each mora,
  // but not so slow that prosody breaks down.
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

export function speakJapanese(text: string): void {
  if (!text || typeof window === "undefined") return;
  stopActiveAudio();

  const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
  audio.preload = "auto";
  activeAudio = audio;

  let fellBack = false;
  const fallback = () => {
    if (fellBack) return;
    fellBack = true;
    if (activeAudio === audio) activeAudio = null;
    speakWithSynthesis(text);
  };

  audio.addEventListener("error", fallback, { once: true });
  audio.addEventListener(
    "ended",
    () => {
      if (activeAudio === audio) activeAudio = null;
    },
    { once: true },
  );

  const playResult = audio.play();
  if (playResult && typeof playResult.then === "function") {
    playResult.catch(fallback);
  }
}

export function primeJapaneseVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
}
