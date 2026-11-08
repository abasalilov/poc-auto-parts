import { extractPartNumberCandidates } from "@/lib/categorySearch";
import type { EngineCategoryCount } from "@/lib/partSearchQueries";

export interface CategoryBrowserItem {
  title: string;
  count: number;
}

export interface CategoryBrowserGroup {
  title: string;
  count: number;
  items: CategoryBrowserItem[];
}

/** Part types hidden from search results are hidden from the browser too. */
const HIDDEN_PART_TYPES = new Set(["battery"]);

const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title);

/** Visible part types keyed by lowercase title, with counts merged across categories. */
const partTypeCounts = (counts: EngineCategoryCount[]) => {
  const inStock = new Map<string, CategoryBrowserItem>();
  counts.forEach((row) => {
    const key = row.title.toLowerCase();
    if (row.count <= 0 || HIDDEN_PART_TYPES.has(key)) return;
    const item = inStock.get(key) ?? { title: row.title, count: 0 };
    item.count += row.count;
    inStock.set(key, item);
  });
  return inStock;
};

/** Common repairs, most popular first, using the catalog's part type titles. */
const COMMON_PART_TYPES = [
  "Brake Pad",
  "Rotor",
  "Oil Filter",
  "Air Filter",
  "Cabin Air Filter",
  "Spark Plug",
  "Ignition Coil",
  "Battery Terminal",
  "Wiper Blade",
  "Caliper",
  "Control Arm",
  "Wheel Bearing & Hub",
  "Strut",
  "Shock Absorber",
  "Belt",
  "Alternator / Generator",
  "Starter Motor",
  "Radiator",
  "Oxygen (O2) Sensor",
  "Tie Rod End",
  "CV Axle",
  "Fuel Pump",
  "Catalytic Converter",
  "Valve Cover Gasket",
  "Stabilizer Bar Link",
];

/** Common repairs that have in-stock parts for the engine. */
export const commonPartTypes = (
  counts: EngineCategoryCount[],
  limit = 10,
): CategoryBrowserItem[] => {
  const inStock = partTypeCounts(counts);
  return COMMON_PART_TYPES.flatMap((title) => inStock.get(title.toLowerCase()) ?? []).slice(
    0,
    limit,
  );
};

/**
 * In-stock part types for the engine in `ranked` order (fuzzy matches for a search),
 * skipping the part types already shown.
 */
export const similarPartTypes = (
  ranked: { title: string }[],
  counts: EngineCategoryCount[],
  exclude: string[],
  limit = 8,
): CategoryBrowserItem[] => {
  const inStock = partTypeCounts(counts);
  const skip = new Set(exclude.map((title) => title.toLowerCase()));
  const result: CategoryBrowserItem[] = [];
  for (const { title } of ranked) {
    const key = title.toLowerCase();
    const item = inStock.get(key);
    if (!item || skip.has(key)) continue;
    skip.add(key);
    result.push(item);
    if (result.length === limit) break;
  }
  return result;
};

/** Stored part type titles for in-stock parts with this title, across top-level categories. */
export const partTypesForTitle = (counts: EngineCategoryCount[], title: string): string[] => {
  const key = title.trim().toLowerCase();
  return Array.from(
    new Set(
      counts
        .filter((row) => row.count > 0 && row.title.toLowerCase() === key)
        .map((row) => row.partType),
    ),
  );
};

/**
 * What to fetch for a search term. An exact in-stock part type title (e.g. a category click)
 * returns exactly the parts counted for it; anything else is fuzzy-matched and may be a part number.
 */
export const partSearchTarget = (
  term: string,
  counts: EngineCategoryCount[],
  resolve: (term: string) => { title: string; ids: number[] } | null,
): { categoryIds: number[]; partNumbers: string[]; partTypes: string[] } => {
  const exact = partTypesForTitle(counts, term);
  if (exact.length > 0) return { categoryIds: [], partNumbers: [], partTypes: exact };

  const category = resolve(term);
  return {
    categoryIds: category?.ids ?? [],
    partNumbers: extractPartNumberCandidates(term),
    partTypes: category ? partTypesForTitle(counts, category.title) : [],
  };
};

/**
 * Groups per-engine part type counts under their top-level category. Item counts are totals
 * for the title across categories, since selecting a part type shows all of them.
 */
export const groupCategoryCounts = (rows: EngineCategoryCount[]): CategoryBrowserGroup[] => {
  const totals = partTypeCounts(rows);
  const groups = new Map<string, { count: number; items: Map<string, CategoryBrowserItem> }>();
  rows.forEach((row) => {
    const key = row.title.toLowerCase();
    const item = totals.get(key);
    if (!item) return;
    const group = groups.get(row.category_1) ?? { count: 0, items: new Map() };
    groups.set(row.category_1, group);
    group.count += row.count;
    group.items.set(key, item);
  });

  return Array.from(groups, ([title, group]) => ({
    title,
    count: group.count,
    items: Array.from(group.items.values()).sort(byTitle),
  })).sort(byTitle);
};

/**
 * Deals groups into a fixed number of columns, each to the currently shortest one (by `height`).
 * Fixed columns keep a group in place when it expands, unlike CSS multi-column layout.
 */
export const splitIntoColumns = <T>(items: T[], columnCount: number, height: (item: T) => number): T[][] => {
  const columns: T[][] = Array.from({ length: Math.max(1, columnCount) }, () => []);
  const heights = columns.map(() => 0);
  items.forEach((item) => {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(item);
    heights[shortest] += height(item);
  });
  return columns;
};
