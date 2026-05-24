# Dictionary CSVs

Place any number of `.csv` files here. Run **`npm run gen:dictionary`** to regenerate `src/data/dictionaryGenerated.ts` (then commit that file for Vercel builds without running the generator).

The Susun game shows **English** and **Bahasa Indonesia** for each item (`meaningEn` + `meaningId` in code).

## Bundled JLPT decks

Files **`n5.csv` … `n1.csv`** are the vocabulary CSVs from [open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks/tree/main/src) (MIT). The `meaning` column is treated as **English**.

### Indonesian (`meaning_indonesia`)

- Add a column **`meaning_indonesia`** (or `meaning_id`) on each row for the Bahasa gloss shown in the app.
- **Bulk fill (EN→ID):** run **`npm run fill:meaning-id`** (uses Google’s public translate endpoint + `dictionary/.meaning-id-cache.json` so reruns are fast). Then **`npm run gen:dictionary`** and commit the CSVs + `src/data/dictionaryGenerated.ts`.
- Machine translation is a starting point: loanwords often match English (`hotel`, `data`); review critical or ambiguous glosses by hand.

If `meaning_indonesia` is empty for a row, the app shows a short hint until you fill it.

Merge order: **N5 → N4 → N3 → N2 → N1**, then any other `.csv` files (alphabetically).

## Your own CSV files

UTF-8 CSV with a header row.

| Column               | Required | Description |
| -------------------- | -------- | ----------- |
| `reading`            | yes      | Kana only, max 14 graphemes |
| `meaning` or `meaning_en` | yes* | **English** gloss (`meaning_en` wins if both set) |
| `meaning_indonesia` or `meaning_id` | no | **Indonesian** gloss |
| `expression`         | no       | Kanji / headword hint |
| `guid`               | no       | Stable id fragment |
| `category`           | no       | `kata` or `kalimat` (overrides filename rule) |

\*At least one of `meaning` / `meaning_en` must be non-empty after trim.

Filename rule when `category` is omitted:

- **`kalimat-*.csv`**, or names containing **`sentence`** / **`sentences`** → **kalimat**
- Otherwise → **kata**

### Examples

`dictionary/my-fruit.csv` (both languages):

```csv
reading,meaning_en,meaning_indonesia,expression
りんご,apple,apel,林檎
```

Same using legacy `meaning` for English only (Indonesian line will show the “add column” hint until you add it):

```csv
reading,meaning,expression
りんご,apple,林檎
```

`dictionary/kalimat-greeting.csv`:

```csv
reading,meaning_en,meaning_indonesia,expression
おはよう,Good morning,Selamat pagi,
```

After edits:

```bash
npm run gen:dictionary
```
