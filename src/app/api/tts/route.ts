import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_TTS_URL = "https://translate.google.com/translate_tts";
const MAX_CHUNK_LEN = 180;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

function chunkJapanese(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_CHUNK_LEN) return [trimmed];
  const chunks: string[] = [];
  let buffer = "";
  // Split on Japanese and ASCII sentence/clause boundaries to keep prosody natural.
  const parts = trimmed.split(/(?<=[。！？、…,.\s])/);
  for (const part of parts) {
    if (!part) continue;
    if ((buffer + part).length > MAX_CHUNK_LEN && buffer) {
      chunks.push(buffer);
      buffer = "";
    }
    if (part.length > MAX_CHUNK_LEN) {
      // Hard split on long unbroken runs.
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

async function fetchChunk(
  text: string,
  index: number,
  total: number,
): Promise<ArrayBuffer> {
  const url = new URL(GOOGLE_TTS_URL);
  url.searchParams.set("ie", "UTF-8");
  url.searchParams.set("q", text);
  url.searchParams.set("tl", "ja");
  url.searchParams.set("total", String(total));
  url.searchParams.set("idx", String(index));
  url.searchParams.set("textlen", String(text.length));
  url.searchParams.set("client", "tw-ob");

  const upstream = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "*/*",
      "Accept-Language": "ja,en;q=0.8",
      Referer: "https://translate.google.com/",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    throw new Error(`tts upstream ${upstream.status}`);
  }
  return upstream.arrayBuffer();
}

export async function GET(request: NextRequest): Promise<Response> {
  const text = request.nextUrl.searchParams.get("text")?.trim() ?? "";
  if (!text) {
    return new Response("missing text", { status: 400 });
  }
  if (text.length > 500) {
    return new Response("text too long", { status: 413 });
  }

  const chunks = chunkJapanese(text);

  try {
    const buffers = await Promise.all(
      chunks.map((chunk, i) => fetchChunk(chunk, i, chunks.length)),
    );
    const total = buffers.reduce((acc, b) => acc + b.byteLength, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const b of buffers) {
      merged.set(new Uint8Array(b), offset);
      offset += b.byteLength;
    }

    return new Response(merged, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(total),
        // Audio per text never changes — cache aggressively to avoid re-hitting the upstream.
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "tts failed";
    return new Response(message, { status: 502 });
  }
}
