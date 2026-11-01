import type { CategoryRow } from "./categorySearch";
import type { EngineCategoryCount, PartSearchHit } from "./partSearchQueries";

export const getJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} failed (${res.status})`);
  return res.json();
};

export const fetchEngineCategories = (engineId: number) =>
  getJson<CategoryRow[]>(`/api/engines/${encodeURIComponent(engineId)}/categories`);

export const fetchEngineParts = ({
  engineId,
  categoryIds,
  partNumbers,
  partTypes = [],
}: {
  engineId: number;
  categoryIds: number[];
  partNumbers: string[];
  partTypes?: string[];
}) => {
  if (categoryIds.length === 0 && partNumbers.length === 0 && partTypes.length === 0) {
    return Promise.resolve<PartSearchHit[]>([]);
  }
  const params = new URLSearchParams({ engineId: String(engineId) });
  if (categoryIds.length > 0) params.set("categoryIds", categoryIds.join(","));
  if (partNumbers.length > 0) params.set("partNumbers", partNumbers.join(","));
  partTypes.forEach((partType) => params.append("partTypes", partType));
  return getJson<PartSearchHit[]>(`/api/part-search?${params.toString()}`);
};

export const fetchEngineCategoryCounts = (engineId: string | number) =>
  getJson<EngineCategoryCount[]>(`/api/engines/${encodeURIComponent(engineId)}/category-counts`);
