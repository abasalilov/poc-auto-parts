export const slugify = (value: unknown) =>
  String(value ?? "")
    .replace(/&amp;/gi, "&")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const brandSlug = slugify;
export const partTypeSlug = slugify;

export const normalizePartNumber = (partNumber: unknown) =>
  String(partNumber ?? "").trim().toUpperCase();

export const productPath = (part: { manufacturer?: unknown; partNumber?: unknown; part_number?: unknown }) => {
  const brand = brandSlug(part.manufacturer);
  const partNumber = normalizePartNumber(part.partNumber ?? part.part_number);
  if (!brand || !partNumber) return null;
  return `/parts/${brand}/${encodeURIComponent(partNumber)}`;
};

/** A sellable item: one line code and part number, like a product page. */
export interface ItemKey {
  lineCode: string;
  partNumber: string;
}

export const itemKey = ({ lineCode, partNumber }: ItemKey) =>
  `${String(lineCode).trim()}:${String(partNumber).trim()}`.toUpperCase();

const listPath = (base: string, page: number) => (page > 1 ? `${base}/${page}` : base);

export const brandListPath = (slug: string, page = 1) => listPath(`/brands/${slug}`, page);

/** A part type list, optionally narrowed to one brand (`/categories/brake-pad/brand/bosch`). */
export const partTypeListPath = (slug: string, page = 1, brand?: string) =>
  listPath(brand ? `/categories/${slug}/brand/${brand}` : `/categories/${slug}`, page);

export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "https://www.partspass.app").replace(/\/+$/, "");

export const productUrl = (part: Parameters<typeof productPath>[0]) => {
  const path = productPath(part);
  return path ? `${siteUrl()}${path}` : null;
};
