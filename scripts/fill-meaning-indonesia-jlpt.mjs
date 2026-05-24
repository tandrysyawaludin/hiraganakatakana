/**
 * Fills `meaning_indonesia` on dictionary/n[1-5].csv using machine translation (EN→ID).
 * Uses Google’s public gtx translate endpoint + a local cache so reruns are fast / resumable.
 *
 * Run: node scripts/fill-meaning-indonesia-jlpt.mjs
 *
 * Afterward: npm run gen:dictionary
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dictDir = path.join(root, "dictionary");
const cachePath = path.join(dictDir, ".meaning-id-cache.json");
const DELAY_MS = 120;
const MAX_Q = 1800;

const FILES = ["n5.csv", "n4.csv", "n3.csv", "n2.csv", "n1.csv"];

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadCache() {
  try {
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, "utf8"));
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 0), "utf8");
}

async function translateGtx(en) {
  const q = en.length > MAX_Q ? `${en.slice(0, MAX_Q)}…` : en;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate ${res.status}`);
  const data = await res.json();
  const out = data?.[0]?.[0]?.[0];
  if (typeof out !== "string" || !out.trim()) throw new Error("empty translation");
  return out.trim();
}

function normalizeMeaning(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const cache = loadCache();
  const toTranslate = new Set();

  for (const name of FILES) {
    const fp = path.join(dictDir, name);
    if (!fs.existsSync(fp)) throw new Error(`Missing ${fp}`);
    const rows = parse(fs.readFileSync(fp, "utf8"), {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
    });
    for (const row of rows) {
      const m = normalizeMeaning(row.meaning);
      if (!m) continue;
      const id = normalizeMeaning(row.meaning_indonesia || "");
      if (id) continue;
      if (!cache[m]) toTranslate.add(m);
    }
  }

  const list = [...toTranslate];
  console.log(`Cached EN→ID strings: ${Object.keys(cache).length}`);
  console.log(`To translate (new): ${list.length} unique English strings`);

  let done = 0;
  for (const text of list) {
    try {
      cache[text] = await translateGtx(text);
    } catch (e) {
      console.error(`FAIL: "${text.slice(0, 60)}…"`, e.message);
      cache[text] = text;
    }
    done += 1;
    if (done % 25 === 0) {
      saveCache(cache);
      console.log(`  …${done}/${list.length}`);
    }
    await delay(DELAY_MS);
  }
  saveCache(cache);

  const columns = [
    "expression",
    "reading",
    "meaning",
    "meaning_indonesia",
    "tags",
    "guid",
  ];

  for (const name of FILES) {
    const fp = path.join(dictDir, name);
    const rows = parse(fs.readFileSync(fp, "utf8"), {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
    });
    const outRows = rows.map((row) => {
      const m = normalizeMeaning(row.meaning);
      const existing = normalizeMeaning(row.meaning_indonesia || "");
      const id =
        existing ||
        (m ? cache[m] || "" : "") ||
        "";
      return {
        expression: row.expression ?? "",
        reading: row.reading ?? "",
        meaning: row.meaning ?? "",
        meaning_indonesia: id,
        tags: row.tags ?? "",
        guid: row.guid ?? "",
      };
    });
    const csv = stringify(outRows, { header: true, columns });
    fs.writeFileSync(fp, csv, "utf8");
    console.log(`Wrote ${name} (${outRows.length} rows)`);
  }

  console.log("Done. Run: npm run gen:dictionary");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
