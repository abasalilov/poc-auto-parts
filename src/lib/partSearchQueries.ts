import type { RowDataPacket } from "mysql2/promise";

import { query } from "@/lib/db";
import { decodeHtmlEntities, type CategoryRow } from "@/lib/categorySearch";

const MAX_CATEGORY_IDS = 20;
const MAX_PART_NUMBERS = 5;
const MAX_PART_TYPES = 10;
const MAX_ENGINE_PARTS = 200;

export interface PartSearchHit {
  id: string;
  manufacturer: string;
  part_number: string;
  partkey: string;
  tagline: string | null;
  description: string | null;
  category_1: string;
  category_2: string;
  category_2_id: string;
  engine_id: string;
  pa_line_code: string;
  "Product Line": string;
  "Part Number": string;
  Price: string;
  "Core Price": string;
  "Quantity On Hand": string;
  url: string | null;
  pies_images: string | null;
  pies_description: string | null;
}

const toPositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

const toIdList = (values: unknown): number[] =>
  Array.isArray(values)
    ? Array.from(
        new Set(values.map(toPositiveInt).filter((id): id is number => id !== null)),
      ).slice(0, MAX_CATEGORY_IDS)
    : [];

const toPartNumberList = (values: unknown): string[] =>
  Array.isArray(values)
    ? Array.from(
        new Set(
          values
            .map((value) => String(value ?? "").trim().toUpperCase())
            .filter((value) => /^[A-Z0-9-]{3,40}$/.test(value)),
        ),
      ).slice(0, MAX_PART_NUMBERS)
    : [];

const PART_COLUMNS = `
  vp.id, vp.manufacturer, vp.part_number, vp.partkey, vp.tagline, vp.description,
  vp.category_1, vp.category_2, vp.category_2_id, vp.engine_id, vp.pa_line_code,
  vp.\`Product Line\`, vp.\`Part Number\`, vp.Price, vp.\`Core Price\`,
  vp.\`Quantity On Hand\`, vp.url,
  (SELECT GROUP_CONCAT(pi.ImageName ORDER BY pi.ImageName SEPARATOR ',')
     FROM pies_images pi
    WHERE pi.PartNumber = vp.part_number AND pi.ProductLine = vp.pa_line_code) AS pies_images,
  (SELECT pd.descriptions
     FROM pies_descriptions pd
    WHERE pd.part_number = vp.part_number AND pd.pa_line_code = vp.pa_line_code
    LIMIT 1) AS pies_description`;

const toPartTypeList = (values: unknown): string[] =>
  Array.isArray(values)
    ? Array.from(
        new Set(
          values
            .map((value) => String(value ?? "").trim())
            .filter((value) => value.length > 0 && value.length <= 200),
        ),
      ).slice(0, MAX_PART_TYPES)
    : [];

type PartRow = RowDataPacket & Record<string, unknown>;

const toHit = (row: PartRow): PartSearchHit => {
  const hit: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    hit[key] = typeof value === "number" || typeof value === "bigint" ? String(value) : value;
  });
  return hit as unknown as PartSearchHit;
};

export async function getEngineCategories(engineId: number): Promise<CategoryRow[]> {
  const id = toPositiveInt(engineId);
  if (!id) return [];
  const rows = await query<RowDataPacket & CategoryRow>(
    `SELECT DISTINCT c2.id, c2.title, c1.title AS category_1
       FROM engine_x_category_1 ec
       JOIN engine_x_category_1_x_category_2 ecc ON ecc.engine_x_category_1_id = ec.id
       JOIN category_2 c2 ON c2.id = ecc.category_2_id
       JOIN category_1 c1 ON c1.id = ec.category_1_id
      WHERE ec.engine_id = ?
      ORDER BY c2.title`,
    [id],
  );
  return rows.map((row) => ({
    id: Number(row.id),
    title: row.title,
    category_1: row.category_1,
  }));
}

export async function searchEngineParts({
  engineId,
  categoryIds,
  partNumbers,
  partTypes,
}: {
  engineId: number;
  categoryIds: number[];
  partNumbers?: string[];
  /** Exact part type titles as stored on the part (`EngineCategoryCount.partType`). */
  partTypes?: string[];
}): Promise<PartSearchHit[]> {
  const id = toPositiveInt(engineId);
  if (!id) return [];
  const ids = toIdList(categoryIds);
  const numbers = toPartNumberList(partNumbers);
  const types = toPartTypeList(partTypes);

  const [byPartNumber, byPartType, byCategory] = await Promise.all([
    numbers.length > 0
      ? query<PartRow>(
          `SELECT ${PART_COLUMNS} FROM vw_parts vp
            WHERE vp.engine_id = ? AND vp.part_number IN (?)
            LIMIT ?`,
          [id, numbers, MAX_ENGINE_PARTS],
        )
      : Promise.resolve([] as PartRow[]),
    types.length > 0
      ? query<PartRow>(
          `SELECT ${PART_COLUMNS} FROM vw_parts vp
            WHERE vp.engine_id = ? AND vp.category_2 IN (?)
            ORDER BY vp.id
            LIMIT ?`,
          [id, types, MAX_ENGINE_PARTS],
        )
      : Promise.resolve([] as PartRow[]),
    ids.length > 0
      ? query<PartRow>(
          `SELECT ${PART_COLUMNS} FROM vw_parts vp
            WHERE vp.engine_id = ? AND vp.category_2_id IN (?)
            ORDER BY vp.id
            LIMIT ?`,
          [id, ids, MAX_ENGINE_PARTS],
        )
      : Promise.resolve([] as PartRow[]),
  ]);

  return uniqueById([...byPartNumber, ...byPartType, ...byCategory].map(toHit));
}

const uniqueById = (hits: PartSearchHit[]) => {
  const seen = new Set<string>();
  return hits.filter((hit) => {
    if (seen.has(hit.id)) return false;
    seen.add(hit.id);
    return true;
  });
};

export interface EngineCategoryCount {
  /** The part's own part type title as stored, used to fetch exactly these parts. */
  partType: string;
  title: string;
  category_1: string;
  count: number;
}

/**
 * In-stock part types for an engine, for the category browser. Grouped by the part's own
 * category fields (not the fitment category id, which can map one part to several types),
 * so each part is counted once.
 */
export async function getEngineCategoryCounts(engineId: number): Promise<EngineCategoryCount[]> {
  const id = toPositiveInt(engineId);
  if (!id) return [];
  const rows = await query<
    RowDataPacket & { part_type: string; category_1: string; count: number }
  >(
    `SELECT vp.category_2 AS part_type, vp.category_1, COUNT(DISTINCT vp.id) AS count
       FROM vw_parts vp
      WHERE vp.engine_id = ?
      GROUP BY vp.category_1, vp.category_2`,
    [id],
  );
  return rows
    .map((row) => ({
      partType: String(row.part_type ?? ""),
      title: decodeHtmlEntities(row.part_type).trim(),
      category_1: decodeHtmlEntities(row.category_1).trim(),
      count: Number(row.count),
    }))
    .filter((row) => row.title && row.category_1 && row.count > 0);
}
