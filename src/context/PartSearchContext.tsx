"use client";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { fetchEngineCategories, fetchEngineParts } from "@/lib/partSearchClient";
import type { PartSearchHit } from "@/lib/partSearchQueries";
import { partSearchTarget } from "@/lib/categoryBrowser";
import type { CategorySearcher, RankedCategory } from "@/lib/categorySearch";
import { createEngineCategoryStore } from "@/lib/engineCategoryStore";
import { loadEngineCategoryCounts } from "@/lib/useEngineCategoryCounts";
import { useVehicle } from "./VehicleContext";

const MIN_SEARCH_LENGTH = 3;
const EMPTY_HITS: PartSearchHit[] = [];

type SearchStatus = "idle" | "loading" | "error";

interface PartSearchContext {
  /** Active part search term (without the engine id). */
  query: string;
  refine: (term: string) => void;
  clear: () => void;
  hits: PartSearchHit[];
  status: SearchStatus;
  categoriesLoading: boolean;
  /** Fuzzy-matches the selected engine's categories locally; no network request. */
  searchCategories: (term: string, limit?: number) => RankedCategory[];
}

export const PartSearchContext = createContext<PartSearchContext>(
  {} as PartSearchContext,
);

const searchKey = (engine: string | null, query: string) =>
  `${engine ?? ""}|${query.trim().toLowerCase()}`;

export default function PartSearchContextProvider(props: PropsWithChildren) {
  const { engine } = useVehicle();
  const storeRef = useRef(createEngineCategoryStore(fetchEngineCategories));
  const [query, setQuery] = useState("");
  const [loadedCategories, setLoadedCategories] = useState<{
    engine: string;
    searcher: CategorySearcher;
  } | null>(null);
  const [results, setResults] = useState<{
    key: string;
    hits: PartSearchHit[];
    failed: boolean;
  }>({ key: "", hits: [], failed: false });

  useEffect(() => {
    if (!engine) return;
    let cancelled = false;
    storeRef.current
      .load(engine)
      .then((searcher) => {
        if (!cancelled) setLoadedCategories({ engine, searcher });
      })
      .catch((error) => console.error("getEngineCategories failed", error));
    return () => {
      cancelled = true;
    };
  }, [engine]);

  const currentKey = searchKey(engine, query);
  // Parts are only shown once fit can be checked against a selected engine.
  const shouldSearch = Boolean(engine) && query.trim().length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    if (!shouldSearch || !engine) return;
    let cancelled = false;
    const term = query.trim();
    const run = async () => {
      const [searcher, counts] = await Promise.all([
        storeRef.current.load(engine),
        loadEngineCategoryCounts(engine).catch(() => []),
      ]);
      return fetchEngineParts({
        engineId: Number(engine),
        ...partSearchTarget(term, counts, searcher.resolve),
      });
    };
    run()
      .then((hits) => {
        if (!cancelled) setResults({ key: currentKey, hits, failed: false });
      })
      .catch((error) => {
        console.error("part search failed", error);
        if (!cancelled) setResults({ key: currentKey, hits: [], failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [engine, query, currentKey, shouldSearch]);

  const isCurrent = shouldSearch && results.key === currentKey;
  const hits = isCurrent ? results.hits : EMPTY_HITS;
  let status: SearchStatus = "idle";
  if (shouldSearch && !isCurrent) status = "loading";
  else if (isCurrent && results.failed) status = "error";

  const activeSearcher =
    engine && loadedCategories?.engine === engine ? loadedCategories.searcher : null;

  const searchCategories = useCallback(
    (term: string, limit?: number) => activeSearcher?.search(term, limit) ?? [],
    [activeSearcher],
  );
  const refine = useCallback((term: string) => setQuery(term.trim()), []);
  const clear = useCallback(() => setQuery(""), []);

  const value = useMemo(
    () => ({
      query,
      refine,
      clear,
      hits,
      status,
      categoriesLoading: Boolean(engine) && !activeSearcher,
      searchCategories,
    }),
    [query, refine, clear, hits, status, engine, activeSearcher, searchCategories],
  );

  return (
    <PartSearchContext.Provider value={value}>{props.children}</PartSearchContext.Provider>
  );
}

export const usePartSearch = () => useContext(PartSearchContext);
