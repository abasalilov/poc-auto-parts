import {
  createCategorySearcher,
  type CategoryRow,
  type CategorySearcher,
} from "./categorySearch";

export interface EngineCategoryStore {
  /** Fetches an engine's categories at most once; failed loads are retried on the next call. */
  load: (engineId: string) => Promise<CategorySearcher>;
}

export function createEngineCategoryStore(
  fetchCategories: (engineId: number) => Promise<CategoryRow[] | undefined>,
): EngineCategoryStore {
  const cache = new Map<string, Promise<CategorySearcher>>();
  return {
    load(engineId) {
      const key = String(engineId);
      let searcher = cache.get(key);
      if (!searcher) {
        searcher = fetchCategories(Number(key)).then((rows) =>
          createCategorySearcher(rows ?? []),
        );
        searcher.catch(() => cache.delete(key));
        cache.set(key, searcher);
      }
      return searcher;
    },
  };
}
