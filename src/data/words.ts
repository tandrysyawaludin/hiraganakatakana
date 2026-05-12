export type WordPuzzle = {
  id: string;
  /** Full word in kana */
  answer: string[];
  /** Hepburn-style reading in Latin letters */
  romaji: string;
  /** Indonesian gloss for parents/kids */
  meaningId: string;
};

export const wordPuzzles: WordPuzzle[] = [
  {
    id: "sakura",
    answer: ["さ", "く", "ら"],
    romaji: "sa-ku-ra",
    meaningId: "Bunga sakura",
  },
  {
    id: "neko",
    answer: ["ね", "こ"],
    romaji: "ne-ko",
    meaningId: "Kucing",
  },
  {
    id: "inu",
    answer: ["い", "ぬ"],
    romaji: "i-nu",
    meaningId: "Anjing",
  },
  {
    id: "mizu",
    answer: ["み", "ず"],
    romaji: "mi-zu",
    meaningId: "Air",
  },
  {
    id: "pan",
    answer: ["パ", "ン"],
    romaji: "pan",
    meaningId: "Roti (dari bahasa Portugis)",
  },
  {
    id: "isu",
    answer: ["い", "す"],
    romaji: "i-su",
    meaningId: "Kursi",
  },
  {
    id: "ringo",
    answer: ["り", "ん", "ご"],
    romaji: "rin-go",
    meaningId: "Apel",
  },
  {
    id: "hana",
    answer: ["は", "な"],
    romaji: "ha-na",
    meaningId: "Bunga",
  },
];
