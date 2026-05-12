export type Script = "hiragana" | "katakana";

export type KanaItem = {
  char: string;
  romaji: string;
  hintId: string;
};

const romajiRows: string[][] = [
  ["a", "i", "u", "e", "o"],
  ["ka", "ki", "ku", "ke", "ko"],
  ["sa", "shi", "su", "se", "so"],
  ["ta", "chi", "tsu", "te", "to"],
  ["na", "ni", "nu", "ne", "no"],
  ["ha", "hi", "fu", "he", "ho"],
  ["ma", "mi", "mu", "me", "mo"],
  ["ya", "yu", "yo"],
  ["ra", "ri", "ru", "re", "ro"],
  ["wa", "wo", "n"],
];

const hiraganaChars = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", "ゆ", "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "を", "ん"],
];

const katakanaChars = [
  ["ア", "イ", "ウ", "エ", "オ"],
  ["カ", "キ", "ク", "ケ", "コ"],
  ["サ", "シ", "ス", "セ", "ソ"],
  ["タ", "チ", "ツ", "テ", "ト"],
  ["ナ", "ニ", "ヌ", "ネ", "ノ"],
  ["ハ", "ヒ", "フ", "ヘ", "ホ"],
  ["マ", "ミ", "ム", "メ", "モ"],
  ["ヤ", "ユ", "ヨ"],
  ["ラ", "リ", "ル", "レ", "ロ"],
  ["ワ", "ヲ", "ン"],
];

const soundHints: Record<string, string> = {
  a: "Bunyi pendek seperti kata 'apa' tanpa p.",
  i: "Mirip 'i' di kata 'itu', pendek.",
  u: "Mirip 'u' di kata 'ibu', pendek.",
  e: "Mirip 'e' di kata 'enak', pendek.",
  o: "Mirip 'o' di kata 'obat', pendek.",
  ka: "Gabungan k + a, seperti 'ka' di 'kakak'.",
  ki: "Gabungan k + i.",
  ku: "Gabungan k + u.",
  ke: "Gabungan k + e.",
  ko: "Gabungan k + o.",
  sa: "Gabungan s + a.",
  shi: "Khusus: bunyi seperti 'si' pelan.",
  su: "Gabungan s + u.",
  se: "Gabungan s + e.",
  so: "Gabungan s + o.",
  ta: "Gabungan t + a.",
  chi: "Khusus: bunyi seperti 'ci' pelan.",
  tsu: "Khusus: bunyi pendek seperti 'cu' tipis.",
  te: "Gabungan t + e.",
  to: "Gabungan t + o.",
  na: "Gabungan n + a.",
  ni: "Gabungan n + i.",
  nu: "Gabungan n + u.",
  ne: "Gabungan n + e.",
  no: "Gabungan n + o.",
  ha: "Gabungan h + a.",
  hi: "Gabungan h + i.",
  fu: "Khusus: seperti meniup pelan, bukan 'f' keras.",
  he: "Gabungan h + e.",
  ho: "Gabungan h + o.",
  ma: "Gabungan m + a.",
  mi: "Gabungan m + i.",
  mu: "Gabungan m + u.",
  me: "Gabungan m + e.",
  mo: "Gabungan m + o.",
  ya: "Gabungan y + a.",
  yu: "Gabungan y + u.",
  yo: "Gabungan y + o.",
  ra: "Lidah dekat langit-langit, bunyi r lembut Jepang.",
  ri: "R lembut + i.",
  ru: "R lembut + u.",
  re: "R lembut + e.",
  ro: "R lembut + o.",
  wa: "Gabungan w + a.",
  wo: "Mirip 'o' lembut, jarang dipakai.",
  n: "Huruf 'n' nasal di akhir suku kata.",
};

function buildTable(chars: string[][]): KanaItem[] {
  const out: KanaItem[] = [];
  for (let r = 0; r < chars.length; r++) {
    for (let c = 0; c < chars[r].length; c++) {
      const romaji = romajiRows[r][c];
      out.push({
        char: chars[r][c],
        romaji,
        hintId: romaji,
      });
    }
  }
  return out;
}

export const hiraganaTable = buildTable(hiraganaChars);
export const katakanaTable = buildTable(katakanaChars);

export function hintForRomaji(romaji: string): string {
  return soundHints[romaji] ?? "Dengarkan tombol speaker untuk contoh.";
}
