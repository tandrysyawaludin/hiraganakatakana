/** Shared types for word puzzles (avoid circular imports with generated CSV data). */

export type WordCategory = "kata" | "kalimat";

export type WordPuzzle = {
  id: string;
  category: WordCategory;
  answer: string[];
  romaji: string;
  meaningId: string;
};
