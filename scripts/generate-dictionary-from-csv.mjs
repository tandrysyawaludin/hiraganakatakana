/**
 * Reads every *.csv under ./dictionary/ and writes src/data/dictionaryGenerated.ts
 *
 * Output puzzles have meaningEn (English) and meaningId (Indonesian).
 * JLPT n5…n1.csv: `meaning` column → English; optional `meaning_indonesia` / `meaning_id` → Indonesian.
 * Custom CSV: `meaning_en` or `meaning` (English); optional `meaning_indonesia` / `meaning_id`.
 * Optional `category`: kata | kalimat (else inferred from filename).
 *
 * Run: npm run gen:dictionary   (alias: npm run gen:jlpt)
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { toRomaji } from "wanakana";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dictDir = path.join(root, "dictionary");
const outFile = path.join(root, "src/data/dictionaryGenerated.ts");

/** Only pure kana readings (hiragana, katakana, long vowel marks). */
const KANA_RE = /^[\u3041-\u3096\u30A1-\u30FA\u30FCー]+$/u;
const MAX_READING_LEN = 14;

const JLPT_ORDER = ["n5.csv", "n4.csv", "n3.csv", "n2.csv", "n1.csv"];

/** @type {Record<string, { idPrefix: string, levelNum: string, includeRow: (tags: string) => boolean }>} */
const JLPT_BY_LEVEL = {
  "5": {
    idPrefix: "n5",
    levelNum: "5",
    includeRow: (tags) => tags.includes("JLPT_N5"),
  },
  "4": {
    idPrefix: "n4",
    levelNum: "4",
    includeRow: (tags) => tags.includes("JLPT_N4"),
  },
  "3": {
    idPrefix: "n3",
    levelNum: "3",
    includeRow: (tags) => /\bJLPT_3\b/.test(tags),
  },
  "2": {
    idPrefix: "n2",
    levelNum: "2",
    includeRow: (tags) =>
      /\bJLPT_2\b/.test(tags) && !/\bJLPT_3\b/.test(tags),
  },
  "1": {
    idPrefix: "n1",
    levelNum: "1",
    includeRow: (tags) => /\bJLPT_1\b/.test(tags),
  },
};

function sortCsvFiles(names) {
  return [...names].sort((a, b) => {
    const la = a.toLowerCase();
    const lb = b.toLowerCase();
    const ia = JLPT_ORDER.indexOf(la);
    const ib = JLPT_ORDER.indexOf(lb);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, "en");
  });
}

function jlptSpecForFilename(filename) {
  const m = filename.toLowerCase().match(/^n([1-5])\.csv$/);
  if (!m) return null;
  return JLPT_BY_LEVEL[m[1]];
}

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

function shortId(parts) {
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 14);
}

function puzzleLine({ id, category, answer, romaji, meaningEn, meaningId }) {
  const answerJson = JSON.stringify(answer);
  return `  {\n    id: "${escapeTs(id)}",\n    category: "${category}",\n    answer: ${answerJson},\n    romaji: "${escapeTs(romaji)}",\n    meaningEn: "${escapeTs(meaningEn)}",\n    meaningId: "${escapeTs(meaningId)}",\n  },`;
}

/**
 * @param {Record<string, string>[]} rows
 * @param {{ idPrefix: string, levelNum: string, includeRow: (tags: string) => boolean }} spec
 */
function buildJlptFile(rows, spec) {
  const seenReading = new Set();
  const lines = [];
  for (const row of rows) {
    const tags = String(row.tags || "");
    if (!spec.includeRow(tags)) continue;
    const reading = String(row.reading || "").trim();
    const meaning = cleanMeaning(row.meaning);
    if (!reading || !meaning) continue;
    if (!KANA_RE.test(reading)) continue;
    if (reading.length > MAX_READING_LEN) continue;
    if (seenReading.has(reading)) continue;
    seenReading.add(reading);

    const guid = String(row.guid || "").replace(/\W/g, "").slice(0, 18) || "x";
    const id = `jlpt-${spec.idPrefix}-${guid}`;
    const answer = [...reading];
    const romaji = romajiFromReading(reading) || reading;
    const indo = cleanMeaning(
      row.meaning_indonesia || row.meaning_id || row.meaningId || "",
    );
    const meaningEn = meaning;
    const meaningId = indo;
    lines.push(
      puzzleLine({
        id,
        category: "kata",
        answer,
        romaji,
        meaningEn,
        meaningId,
      }),
    );
  }
  return lines;
}

function inferCategoryFromFilename(stemLower) {
  if (
    stemLower.startsWith("kalimat") ||
    stemLower.includes("sentence") ||
    stemLower.includes("sentences")
  ) {
    return "kalimat";
  }
  return "kata";
}

function rowCategory(row, fileDefault) {
  const raw = String(row.category || row.type || "").trim().toLowerCase();
  if (raw === "kalimat" || raw === "sentence" || raw === "sentences")
    return "kalimat";
  if (raw === "kata" || raw === "word" || raw === "words") return "kata";
  return fileDefault;
}

/**
 * Custom CSV: `reading` + English (`meaning_en` or `meaning`). Optional Indonesian, expression, guid, category.
 * @param {Record<string, string>[]} rows
 * @param {string} filename
 */
function buildCustomFile(rows, filename) {
  const stem = path.basename(filename, path.extname(filename));
  const stemLower = stem.toLowerCase().replace(/[^\w-]+/g, "-");
  const fileDefault = inferCategoryFromFilename(stemLower);
  const seenReading = new Set();
  const lines = [];
  let rowIdx = 0;

  for (const row of rows) {
    rowIdx += 1;
    const reading = String(row.reading || "").trim();
    const meaningEnRaw = cleanMeaning(
      row.meaning_en || row.meaning || "",
    );
    const meaningIdRaw = cleanMeaning(
      row.meaning_indonesia || row.meaning_id || row.meaningId || "",
    );
    if (!reading || !meaningEnRaw) continue;
    if (!KANA_RE.test(reading)) continue;
    if (reading.length > MAX_READING_LEN) continue;
    const category = rowCategory(row, fileDefault);
    const key = `${category}:${reading}`;
    if (seenReading.has(key)) continue;
    seenReading.add(key);

    const guidRaw = String(row.guid || "").trim();
    const guid =
      guidRaw.replace(/\W/g, "").slice(0, 12) ||
      shortId([stemLower, reading, meaningEnRaw, String(rowIdx)]);
    const id = `dict-${stemLower}-${guid}`.slice(0, 72);
    const answer = [...reading];
    const romaji = romajiFromReading(reading) || reading;

    const meaningEn = meaningEnRaw;
    const meaningId = meaningIdRaw;

    lines.push(
      puzzleLine({
        id,
        category,
        answer,
        romaji,
        meaningEn,
        meaningId,
      }),
    );
  }
  return lines;
}

function main() {
  if (!fs.existsSync(dictDir)) {
    throw new Error(`Missing folder: ${dictDir}`);
  }
  const names = fs
    .readdirSync(dictDir)
    .filter((f) => f.toLowerCase().endsWith(".csv"));
  if (names.length === 0) {
    throw new Error(`No .csv files in ${dictDir}`);
  }

  const sorted = sortCsvFiles(names);
  const allLines = [];
  const counts = [];

  for (const name of sorted) {
    const full = path.join(dictDir, name);
    const text = fs.readFileSync(full, "utf8");
    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
    });
    const jlpt = jlptSpecForFilename(name);
    const lines = jlpt ? buildJlptFile(rows, jlpt) : buildCustomFile(rows, name);
    allLines.push(...lines);
    counts.push(`${name}: ${lines.length}`);
  }

  const header = `/**
 * AUTO-GENERATED — run: npm run gen:dictionary
 * Source files: dictionary/*.csv (see dictionary/README.md)
 */
import type { WordPuzzle } from "./wordTypes";

export const dictionaryFromCsv: WordPuzzle[] = [
`;

  const footer = `];
`;

  const body = `${header}${allLines.join("\n")}\n${footer}`;
  fs.writeFileSync(outFile, body, "utf8");
  console.log(`Wrote ${outFile}`);
  console.log(counts.join("\n"));
}

main();
