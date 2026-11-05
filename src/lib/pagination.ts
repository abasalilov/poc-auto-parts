/** Page numbers around the current one, plus the first and last, with gaps as null. */
export const pageWindow = (page: number, pages: number, radius = 2): (number | null)[] => {
  const shown = new Set([1, pages]);
  for (let p = page - radius; p <= page + radius; p += 1) if (p >= 1 && p <= pages) shown.add(p);
  const sorted = Array.from(shown).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
};

/**
 * The page from an optional `[[...page]]` segment: none is page 1, and `/1`, leading zeros or
 * extra segments are rejected so every page has exactly one URL.
 */
export const parsePageSegment = (segments: string[] | undefined): number | null => {
  if (!segments || segments.length === 0) return 1;
  if (segments.length > 1 || !/^[1-9]\d{0,4}$/.test(segments[0])) return null;
  const page = Number(segments[0]);
  return page > 1 ? page : null;
};

/** Segments after `/categories/<type>`: an optional `brand/<slug>`, then an optional page. */
export const parseCategorySegments = (
  segments: string[] | undefined,
): { brand: string | undefined; page: number } | null => {
  if (segments?.[0] !== "brand") {
    const page = parsePageSegment(segments);
    return page === null ? null : { brand: undefined, page };
  }
  const brand = segments[1];
  const page = parsePageSegment(segments.slice(2));
  return brand && page !== null ? { brand, page } : null;
};
