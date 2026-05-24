const STORAGE_KEY = "hiraganakatakana-susun-passed-v1";

function parse(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return new Set();
    return new Set(v.filter((x) => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function loadPassedPuzzleIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  return parse(window.localStorage.getItem(STORAGE_KEY));
}

export function savePassedPuzzleIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function markPuzzlePassed(id: string): Set<string> {
  const next = loadPassedPuzzleIds();
  next.add(id);
  savePassedPuzzleIds(next);
  return next;
}
