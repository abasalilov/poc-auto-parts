import type { RowDataPacket } from "mysql2/promise";
import { unstable_cache } from "next/cache";

import { query } from "@/lib/db";
import { buildPartImageUrl, listImageFolders } from "@/lib/partImages";
import { sellPriceCents } from "@/lib/pricing";

/**
 * Brand and part type lists, read from `catalog_listing` (migrations/2026-10-13-catalog-listing.sql).
 * scripts/generate-seo-files.ts refills it on every build with the sitemap's products; stock and
 * prices come from `partsauthority` at request time.
 */
export const LIST_PAGE_SIZE = 48;
const LINK_LIMIT = 24;
const CACHE = { revalidate: 86400, tags: ["catalog"] };

export const pageCount = (count: number) => Math.max(1, Math.ceil(count / LIST_PAGE_SIZE));

export interface CatalogLink {
  slug: string;
  name: string;
  count: number;
}

export interface CatalogPartType extends CatalogLink {
  category1: string;
}

/** Either or both of a brand and part type slug. */
export interface ListFilter {
  brand?: string;
  partType?: string;
}

export interface ListSummary {
  count: number;
  brandName: string;
  partType: string;
  category1: string;
}

export interface ListedPart {
  path: string;
  title: string;
  manufacturer: string;
  lineCode: string;
  partNumber: string;
  partType: string;
  image: string;
  priceCents: number;
  /** Lowest part id, when known, so the cart matches the product page. */
  id?: string;
}

const SLUG = /^[a-z0-9-]{1,120}$/;

const IN_STOCK = `catalog_listing cl
  STRAIGHT_JOIN partsauthority pa
    ON pa.Line_Code = cl.line_code AND pa.MPN = cl.part_number AND pa.Quantity_Total > 0`;

/** WHERE clause and values for a filter, or null when a slug can't exist. */
const filterSql = ({ brand, partType }: ListFilter) => {
  if ((brand !== undefined && !SLUG.test(brand)) || (partType !== undefined && !SLUG.test(partType))) {
    return null;
  }
  const clauses: string[] = [];
  const values: string[] = [];
  if (partType !== undefined) {
    clauses.push("cl.part_type_slug = ?");
    values.push(partType);
  }
  if (brand !== undefined) {
    clauses.push("cl.brand_slug = ?");
    values.push(brand);
  }
  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", values };
};

type LinkRow = RowDataPacket & { slug: string; name: string; category1: string; count: number };

const toLink = (row: LinkRow): CatalogLink => ({ slug: row.slug, name: row.name, count: Number(row.count) });

/** Every brand with in-stock listed parts, by name. */
export const getBrands = unstable_cache(
  async (): Promise<CatalogLink[]> =>
    (
      await query<LinkRow>(
        `SELECT cl.brand_slug AS slug, MIN(cl.brand_name) AS name, COUNT(*) AS count
           FROM ${IN_STOCK}
          GROUP BY cl.brand_slug
          ORDER BY name`,
      )
    ).map(toLink),
  ["catalog-brands"],
  CACHE,
);

/** Every part type with in-stock listed parts, by name. */
export const getPartTypes = unstable_cache(
  async (): Promise<CatalogPartType[]> =>
    (
      await query<LinkRow>(
        `SELECT cl.part_type_slug AS slug, MIN(cl.part_type) AS name, MIN(cl.category_1) AS category1,
                COUNT(*) AS count
           FROM ${IN_STOCK}
          WHERE cl.part_type_slug <> ''
          GROUP BY cl.part_type_slug
          ORDER BY name`,
      )
    ).map((row) => ({ ...toLink(row), category1: row.category1 })),
  ["catalog-part-types"],
  CACHE,
);

type SummaryRow = RowDataPacket & { count: number; brandName: string | null; partType: string | null; category1: string | null };

/** In-stock count and names for a list, or null when it has no parts. */
export const getListSummary = unstable_cache(
  async (filter: ListFilter): Promise<ListSummary | null> => {
    const sql = filterSql(filter);
    if (!sql || !sql.where) return null;
    const [row] = await query<SummaryRow>(
      `SELECT COUNT(*) AS count, MIN(cl.brand_name) AS brandName, MIN(cl.part_type) AS partType,
              MIN(cl.category_1) AS category1
         FROM ${IN_STOCK}
         ${sql.where}`,
      sql.values,
    );
    const count = Number(row?.count ?? 0);
    if (count === 0) return null;
    return { count, brandName: row.brandName ?? "", partType: row.partType ?? "", category1: row.category1 ?? "" };
  },
  ["catalog-list-summary"],
  CACHE,
);

/** The biggest part types for a brand, or the biggest brands for a part type. */
export const getTopLinks = unstable_cache(
  async (filter: ListFilter, by: "brand" | "partType"): Promise<CatalogLink[]> => {
    const sql = filterSql(filter);
    if (!sql || !sql.where) return [];
    const [slug, name] = by === "brand" ? ["brand_slug", "brand_name"] : ["part_type_slug", "part_type"];
    return (
      await query<LinkRow>(
        `SELECT cl.${slug} AS slug, MIN(cl.${name}) AS name, COUNT(*) AS count
           FROM ${IN_STOCK}
           ${sql.where} AND cl.${slug} <> ''
          GROUP BY cl.${slug}
          ORDER BY count DESC, name
          LIMIT ${LINK_LIMIT}`,
        sql.values,
      )
    ).map(toLink);
  },
  ["catalog-top-links"],
  CACHE,
);

type ListRow = RowDataPacket & {
  path: string;
  brand_name: string;
  part_type: string;
  line_code: string;
  part_number: string;
  image: string;
  Cost: string | null;
  Core_Charge: string | null;
};

/** Brand lists go by part type, part type lists by brand, then part number. */
const listOrder = ({ brand, partType }: ListFilter) =>
  brand !== undefined && partType === undefined
    ? "cl.brand_slug, cl.part_type_slug, cl.part_number"
    : "cl.part_type_slug, cl.brand_slug, cl.part_number";

/** One page of in-stock parts with current prices. */
export const getListPage = async (filter: ListFilter, page: number): Promise<ListedPart[]> => {
  const sql = filterSql(filter);
  if (!sql || !sql.where || page < 1) return [];
  const rows = await query<ListRow>(
    `SELECT cl.path, cl.brand_name, cl.part_type, cl.line_code, cl.part_number, cl.image,
            pa.Cost, pa.Core_Charge
       FROM ${IN_STOCK}
       ${sql.where}
      ORDER BY ${listOrder(filter)}
      LIMIT ${LIST_PAGE_SIZE} OFFSET ${(page - 1) * LIST_PAGE_SIZE}`,
    sql.values,
  );
  return rows.flatMap((row) => {
    const priceCents = sellPriceCents(row.Cost, row.Core_Charge);
    if (priceCents <= 0) return [];
    return [
      {
        path: row.path,
        title: [row.brand_name, row.part_type, row.part_number].filter(Boolean).join(" "),
        manufacturer: row.brand_name,
        lineCode: row.line_code,
        partNumber: row.part_number,
        partType: row.part_type,
        image: buildPartImageUrl(row.line_code, row.image),
        priceCents,
      },
    ];
  });
};

/** Whether a line code's images are uploaded; assumes they are when that isn't known. */
export const imageFolderCheck = (folders: string[] | null | undefined) => {
  if (!folders?.length) return () => true;
  const known = new Set(folders);
  return (lineCode: string) => known.has(String(lineCode ?? "").trim());
};

const getImageFolders = unstable_cache(
  async () => {
    const folders = await listImageFolders();
    if (!folders) throw new Error("image bucket listing failed");
    return folders;
  },
  ["image-folders"],
  { revalidate: 86400 },
);

export const hasImageFolder = async (lineCode: string) =>
  imageFolderCheck(await getImageFolders().catch(() => null))(lineCode);
