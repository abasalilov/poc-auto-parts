export type PartSort = "price-asc" | "price-desc" | "brand-asc";

export const PART_SORT_OPTIONS: { value: PartSort; label: string }[] = [
  { value: "price-asc", label: "Lowest price" },
  { value: "price-desc", label: "Highest price" },
  { value: "brand-asc", label: "Brand A–Z" },
];

interface SortablePart {
  price?: unknown;
  manufacturer?: unknown;
  partNumber?: unknown;
  part_number?: unknown;
}

const normalizePartNumber = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const priceOf = (part: SortablePart) => {
  const price = parseFloat(String(part.price ?? ""));
  return Number.isFinite(price) ? price : null;
};

/** Unpriced parts sort last in either direction. */
const byPrice = (direction: 1 | -1) => (a: SortablePart, b: SortablePart) => {
  const priceA = priceOf(a);
  const priceB = priceOf(b);
  if (priceA === null || priceB === null) return Number(priceA === null) - Number(priceB === null);
  return direction * (priceA - priceB);
};

const compare: Record<PartSort, (a: SortablePart, b: SortablePart) => number> = {
  "price-asc": byPrice(1),
  "price-desc": byPrice(-1),
  "brand-asc": (a, b) => String(a.manufacturer ?? "").localeCompare(String(b.manufacturer ?? "")),
};

/** Sorts parts, keeping any whose part number appears in the search first. */
export const sortParts = <T extends SortablePart>(parts: T[], sort: PartSort, search: string): T[] => {
  const searchKey = normalizePartNumber(search);
  const matchesSearch = (part: T) => {
    const partNumber = normalizePartNumber(part.partNumber ?? part.part_number);
    return Boolean(searchKey && partNumber && searchKey.includes(partNumber));
  };
  return [...parts].sort(
    (a, b) => Number(matchesSearch(b)) - Number(matchesSearch(a)) || compare[sort](a, b),
  );
};
