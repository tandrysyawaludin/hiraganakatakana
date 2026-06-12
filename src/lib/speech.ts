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

const TRANSLATE_TTS_BASE = "https://translate.google.com/translate_tts";
const MAX_CHUNK_LEN = 180;

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

function chunkJapanese(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_CHUNK_LEN) return [trimmed];
  const chunks: string[] = [];
  let buffer = "";
  const parts = trimmed.split(/(?<=[。！？、…,.\s])/);
  for (const part of parts) {
    if (!part) continue;
    if ((buffer + part).length > MAX_CHUNK_LEN && buffer) {
      chunks.push(buffer);
      buffer = "";
    }
    if (part.length > MAX_CHUNK_LEN) {
      for (let i = 0; i < part.length; i += MAX_CHUNK_LEN) {
        chunks.push(part.slice(i, i + MAX_CHUNK_LEN));
      }
      continue;
    }
    buffer += part;
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}

function translateTtsUrl(chunk: string, index: number, total: number): string {
  const params = new URLSearchParams({
    ie: "UTF-8",
    q: chunk,
    tl: "ja",
    total: String(total),
    idx: String(index),
    textlen: String(chunk.length),
    client: "tw-ob",
  });
  return `${TRANSLATE_TTS_BASE}?${params.toString()}`;
}

let activePlayback: { audio: HTMLAudioElement; cancelled: boolean } | null =
  null;

function stopActivePlayback(): void {
  if (activePlayback) {
    activePlayback.cancelled = true;
    try {
      activePlayback.audio.pause();
      activePlayback.audio.removeAttribute("src");
      activePlayback.audio.load();
    } catch {
      // ignore
    }
    activePlayback = null;
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
  // Slightly slower than natural so each mora is distinct, without breaking prosody.
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

function playChunkSequence(chunks: string[], onError: () => void): void {
  const audio = new Audio();
  audio.preload = "auto";
  const session = { audio, cancelled: false };
  activePlayback = session;

  let index = 0;
  let fellBack = false;

  const fail = () => {
    if (fellBack || session.cancelled) return;
    fellBack = true;
    if (activePlayback === session) activePlayback = null;
    onError();
  };

  const playNext = () => {
    if (session.cancelled) return;
    if (index >= chunks.length) {
      if (activePlayback === session) activePlayback = null;
      return;
    }
    audio.src = translateTtsUrl(chunks[index], index, chunks.length);
    index += 1;
    const result = audio.play();
    if (result && typeof result.then === "function") {
      result.catch(fail);
    }
  };

  audio.addEventListener("ended", playNext);
  audio.addEventListener("error", fail);

  playNext();
}

export function speakJapanese(text: string): void {
  if (!text || typeof window === "undefined") return;
  stopActivePlayback();

  const chunks = chunkJapanese(text);
  playChunkSequence(chunks, () => speakWithSynthesis(text));
}

export function primeJapaneseVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
}
