/**
 * Builds src/data/jlptCsvGenerated.ts from MIT-licensed JLPT CSVs:
 * https://github.com/jamsinclair/open-anki-jlpt-decks/tree/main/src
 *
 * Merge order in the app: N5 → N4 → N3 → N2 → N1 (see src/data/words.ts).
 *
 * Run: npm run gen:jlpt
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { toRomaji } from "wanakana";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outFile = path.join(root, "src/data/jlptCsvGenerated.ts");

const RAW =
  "https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/src";

/** N5/N4 use JLPT_N*; N3–N1 use JLPT_3 … JLPT_1 in tags (see repo CSVs). */
const LEVELS = [
  {
    exportName: "jlptCsvN5Puzzles",
    file: "n5.csv",
    idPrefix: "n5",
    levelNum: "5",
    includeRow: (tags) => tags.includes("JLPT_N5"),
  },
  {
    exportName: "jlptCsvN4Puzzles",
    file: "n4.csv",
    idPrefix: "n4",
    levelNum: "4",
    includeRow: (tags) => tags.includes("JLPT_N4"),
  },
  {
    exportName: "jlptCsvN3Puzzles",
    file: "n3.csv",
    idPrefix: "n3",
    levelNum: "3",
    includeRow: (tags) => /\bJLPT_3\b/.test(tags),
  },
  {
    exportName: "jlptCsvN2Puzzles",
    file: "n2.csv",
    idPrefix: "n2",
    levelNum: "2",
    includeRow: (tags) =>
      /\bJLPT_2\b/.test(tags) && !/\bJLPT_3\b/.test(tags),
  },
  {
    exportName: "jlptCsvN1Puzzles",
    file: "n1.csv",
    idPrefix: "n1",
    levelNum: "1",
    includeRow: (tags) => /\bJLPT_1\b/.test(tags),
  },
];

/** Only pure kana readings (hiragana, katakana, long vowel marks). */
const KANA_RE = /^[\u3041-\u3096\u30A1-\u30FA\u30FCー]+$/u;

const MAX_READING_LEN = 14;

function cleanMeaning(m) {
  return String(m || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function romajiFromReading(reading) {
  return toRomaji(reading)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zāīūēō\-']/gi, "")
    .replace(/'/g, "");
}

function escapeTs(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ");
}

function buildPuzzles(csvText, { idPrefix, levelNum, includeRow }) {
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });
  const seenReading = new Set();
  const lines = [];
  for (const row of rows) {
    const tags = String(row.tags || "");
    if (!includeRow(tags)) continue;
    const reading = String(row.reading || "").trim();
    const meaning = cleanMeaning(row.meaning);
    if (!reading || !meaning) continue;
    if (!KANA_RE.test(reading)) continue;
    if (reading.length > MAX_READING_LEN) continue;
    if (seenReading.has(reading)) continue;
    seenReading.add(reading);

    const expr = String(row.expression || "").trim().slice(0, 24);
    const guid = String(row.guid || "").replace(/\W/g, "").slice(0, 18) || "x";
    const id = `jlpt-${idPrefix}-${guid}`;
    const answer = [...reading];
    const romaji = romajiFromReading(reading) || reading;
    const meaningId = `${escapeTs(meaning)} (JLPT N${levelNum}; bentuk: ${escapeTs(expr)})`;

    const answerJson = JSON.stringify(answer);
    lines.push(
      `  {\n    id: "${escapeTs(id)}",\n    category: "kata",\n    answer: ${answerJson},\n    romaji: "${escapeTs(romaji)}",\n    meaningId: "${meaningId}",\n  },`,
    );
  }
  return lines;
}

async function main() {
  const texts = await Promise.all(
    LEVELS.map(({ file }) =>
      fetch(`${RAW}/${file}`).then((r) => {
        if (!r.ok) throw new Error(`${file} ${r.status}`);
        return r.text();
      }),
    ),
  );

  const parts = [];
  const counts = [];

  const header = `/**
 * AUTO-GENERATED — run: npm run gen:jlpt
 * Source: https://github.com/jamsinclair/open-anki-jlpt-decks (MIT License)
 *   - src/n5.csv … n1.csv → exports below (N5 first … N1 last)
 *
 * meaningId uses the English gloss from the CSV plus JLPT level and headword.
 */
import type { WordPuzzle } from "./wordTypes";

`;

  parts.push(header);

  for (let i = 0; i < LEVELS.length; i++) {
    const spec = LEVELS[i];
    const lines = buildPuzzles(texts[i], spec);
    counts.push(`${lines.length} N${spec.levelNum}`);
    if (i > 0) parts.push("\n");
    parts.push(`export const ${spec.exportName}: WordPuzzle[] = [\n`);
    parts.push(lines.join("\n"));
    parts.push("\n];");
  }

  parts.push("\n");
  fs.writeFileSync(outFile, parts.join(""), "utf8");
  console.log(`Wrote ${outFile} (${counts.join(" + ")})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
