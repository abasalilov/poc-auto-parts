"use client";
import { useEffect, useState } from "react";

import { fetchEngineCategoryCounts } from "@/lib/partSearchClient";
import type { EngineCategoryCount } from "@/lib/partSearchQueries";

const cache = new Map<string, Promise<EngineCategoryCount[]>>();

/** Fetches an engine's in-stock part type counts at most once per page load; failures are retried. */
export const loadEngineCategoryCounts = (engine: string) => {
  let counts = cache.get(engine);
  if (!counts) {
    counts = fetchEngineCategoryCounts(engine);
    counts.catch(() => cache.delete(engine));
    cache.set(engine, counts);
  }
  return counts;
};

export function useEngineCategoryCounts(engine: string | null) {
  const [state, setState] = useState<{
    engine: string;
    rows: EngineCategoryCount[] | null;
    failed: boolean;
  } | null>(null);

  useEffect(() => {
    if (!engine) return;
    let cancelled = false;
    loadEngineCategoryCounts(engine)
      .then((rows) => {
        if (!cancelled) setState({ engine, rows, failed: false });
      })
      .catch((error) => {
        console.error("category counts failed", error);
        if (!cancelled) setState({ engine, rows: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [engine]);

  const current = engine && state?.engine === engine ? state : null;
  return { rows: current?.rows ?? null, failed: Boolean(current?.failed) };
}
