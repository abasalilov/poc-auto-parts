import Fuse from "fuse.js";

export interface CategoryRow {
  id: number;
  title: string;
  category_1?: string | null;
}

export interface Category {
  /** Lowest `category_2.id` sharing this title. */
  id: number;
  /** Every `category_2.id` sharing this title; the catalog has duplicate titles under different ids. */
  ids: number[];
  /** Display-ready title with HTML entities decoded. */
  title: string;
  category1: string[];
}

export interface RankedCategory extends Category {
  score: number;
}

export interface CategorySearcher {
  categories: Category[];
  search: (query: string, limit?: number) => RankedCategory[];
  resolve: (query: string) => RankedCategory | null;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
};

export const decodeHtmlEntities = (value: unknown) =>
  String(value ?? "").replace(/&(#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#")) return String.fromCharCode(Number(entity.slice(1)));
    return ENTITIES[entity.toLowerCase()] ?? match;
  });

const STOP_WORDS = new Set(["and", "or", "w", "with", "of", "the", "for"]);

const stem = (word: string) =>
  word.length > 3 && word.endsWith("s") && !/(ss|us|is)$/.test(word)
    ? word.slice(0, -1)
    : word;

export const tokenize = (value: unknown): string[] =>
  decodeHtmlEntities(value)
    .toLowerCase()
    .replace(/\b([a-z0-9])\/([a-z0-9])\b/g, "$1$2")
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !STOP_WORDS.has(word))
    .map(stem);

const cleanTitle = (value: unknown) =>
  decodeHtmlEntities(value).replace(/\s+/g, " ").trim();

export const groupCategories = (rows: CategoryRow[]): Category[] => {
  const byTitle = new Map<string, Category>();
  rows.forEach((row) => {
    const title = cleanTitle(row.title);
    if (!title) return;
    const id = Number(row.id);
    const category1 = cleanTitle(row.category_1);
    const existing = byTitle.get(title);
    if (existing) {
      if (!existing.ids.includes(id)) existing.ids.push(id);
      if (category1 && !existing.category1.includes(category1)) {
        existing.category1.push(category1);
      }
      return;
    }
    byTitle.set(title, { id, ids: [id], title, category1: category1 ? [category1] : [] });
  });
  return Array.from(byTitle.values())
    .map((category) => {
      const ids = [...category.ids].sort((a, b) => a - b);
      return { ...category, id: ids[0], ids };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
};

const EXACT_SIMILARITY = 1;
const PREFIX_SIMILARITY = 0.9;
const MAX_FUZZY_SIMILARITY = 0.85;
const CATEGORY_1_WEIGHT = 0.75;
const QUERY_COVERAGE_WEIGHT = 0.6;
const TITLE_COVERAGE_WEIGHT = 0.4;
const MIN_RELEVANCE = 0.55;

interface IndexedCategory {
  category: Category;
  rawTitle: string;
  normalizedTitle: string;
  titleWords: string[];
  category1Words: string[];
}

export function createCategorySearcher(rows: CategoryRow[]): CategorySearcher {
  const categories = groupCategories(rows);
  const indexed: IndexedCategory[] = categories.map((category) => {
    const titleWords = tokenize(category.title);
    return {
      category,
      rawTitle: category.title,
      normalizedTitle: titleWords.join(" "),
      titleWords: Array.from(new Set(titleWords)),
      category1Words: Array.from(new Set(category.category1.flatMap(tokenize))),
    };
  });

  const vocabulary = Array.from(
    new Set(indexed.flatMap((entry) => [...entry.titleWords, ...entry.category1Words])),
  );
  const wordFuse = new Fuse(vocabulary, {
    threshold: 0.45,
    ignoreLocation: true,
    includeScore: true,
  });

  const wordSimilarities = (token: string, allowShortPrefix: boolean) => {
    const similarities = new Map<string, number>();
    const allowPrefix = allowShortPrefix || token.length >= 3;
    vocabulary.forEach((word) => {
      if (word === token) similarities.set(word, EXACT_SIMILARITY);
      else if (allowPrefix && word.startsWith(token)) similarities.set(word, PREFIX_SIMILARITY);
    });
    // Fuzzy-matching digits produces noise (part numbers, sizes); only spell-correct words.
    if (token.length >= 3 && !/\d/.test(token)) {
      wordFuse.search(token).forEach(({ item, score = 1 }) => {
        if (similarities.has(item) || item[0] !== token[0]) return;
        similarities.set(item, MAX_FUZZY_SIMILARITY * (1 - score));
      });
    }
    return similarities;
  };

  const search = (query: string, limit = Number.POSITIVE_INFINITY): RankedCategory[] => {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const trimmedQuery = cleanTitle(query);
    const normalizedQuery = queryTokens.join(" ");
    const isTypingLastWord = !/\s$/.test(query);
    const tokenSimilarities = queryTokens.map((token, idx) =>
      wordSimilarities(token, isTypingLastWord && idx === queryTokens.length - 1),
    );
    const bestFor = (similarities: Map<string, number>, words: string[]) =>
      words.reduce((best, word) => Math.max(best, similarities.get(word) ?? 0), 0);

    const ranked: RankedCategory[] = [];
    indexed.forEach((entry) => {
      const titleMatches = tokenSimilarities.map((sims) => bestFor(sims, entry.titleWords));
      if (titleMatches.every((match) => match === 0)) return;

      const tokenScores = tokenSimilarities.map((sims, idx) =>
        Math.max(titleMatches[idx], CATEGORY_1_WEIGHT * bestFor(sims, entry.category1Words)),
      );
      const queryCoverage =
        tokenScores.reduce((sum, value) => sum + value, 0) / tokenScores.length;
      const titleCoverage =
        entry.titleWords.reduce(
          (sum, word) =>
            sum + Math.max(...tokenSimilarities.map((sims) => sims.get(word) ?? 0)),
          0,
        ) / Math.max(entry.titleWords.length, 1);
      const relevance =
        QUERY_COVERAGE_WEIGHT * queryCoverage + TITLE_COVERAGE_WEIGHT * titleCoverage;

      let boost = 0;
      if (entry.rawTitle === trimmedQuery) boost = 3;
      else if (entry.normalizedTitle === normalizedQuery) boost = 2;
      else if (
        isTypingLastWord &&
        entry.normalizedTitle.startsWith(normalizedQuery) &&
        entry.normalizedTitle[normalizedQuery.length] !== " "
      ) {
        // Completing a partially typed word ("brake p" -> "Brake Pad"); whole-word
        // prefixes ("brake rotor" -> "Brake Rotor Shim") compete on relevance instead.
        boost = 1;
      }

      if (boost === 0 && relevance < MIN_RELEVANCE) return;
      ranked.push({ ...entry.category, score: boost + relevance });
    });

    return ranked
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.title.length - b.title.length ||
          a.title.localeCompare(b.title),
      )
      .slice(0, limit);
  };

  return {
    categories,
    search,
    resolve: (query: string) => search(query, 1)[0] ?? null,
  };
}

/** Tokens that look like part numbers (contain a digit), e.g. "AD0868" or "14D1285CHF1". */
export const extractPartNumberCandidates = (query: string): string[] =>
  Array.from(
    new Set(
      query
        .split(/\s+/)
        .map((token) => token.replace(/[^a-z0-9-]/gi, "").toUpperCase())
        .filter((token) => /\d/.test(token) && token.length >= 3 && token.length <= 40),
    ),
  ).slice(0, 5);
