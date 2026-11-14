import type { RowDataPacket } from "mysql2/promise";
import { unstable_cache } from "next/cache";

import type { ListedPart } from "@/lib/catalog";
import { query } from "@/lib/db";
import { buildPartImageUrl } from "@/lib/partImages";
import { sellPriceCents } from "@/lib/pricing";
import { clean, FITMENT_ROW_LIMIT } from "@/lib/productQueries";
import { relatedPartTypes, storedTitles } from "@/lib/repairJobs";

export const RELATED_PART_LIMIT = 12;
const PER_TYPE_LIMIT = 3;
/** Safety cap on matches read for an engine; a system-wide fallback can match thousands. */
const CANDIDATE_LIMIT = 2000;
const RELATED_TIMEOUT_MS = 5000;

export interface RelatedParts {
  /** The vehicle every related part fits, e.g. "2014 Chevrolet Silverado 1500 5.3L V8". */
  vehicle: string;
  /** True when the parts are for the same repair job, false for the same system. */
  sameJob: boolean;
  parts: ListedPart[];
}

type VehicleRow = RowDataPacket & { id: number; year: string; make: string; model: string; title: string };

type CandidateRow = RowDataPacket & {
  path: string;
  brand_name: string;
  part_type: string;
  line_code: string;
  part_number: string;
  image: string;
  Cost: string | null;
  Core_Charge: string | null;
  part_id: number;
};

const loadEngine = async (engineId: number) =>
  (
    await query<VehicleRow>(`SELECT id, year, make, model, title FROM engine WHERE id = ?`, [engineId])
  )[0];

/** The newest vehicle among the part's first fitment rows, read in index order like the fitment list. */
const loadVehicle = async (partIds: number[]) =>
  (
    await query<VehicleRow>(
      `SELECT /*+ MAX_EXECUTION_TIME(${RELATED_TIMEOUT_MS}) */ e.id, e.year, e.make, e.model, e.title
         FROM (SELECT eccp.engine_x_category_1_x_category_2_id AS ecc_id
                 FROM engine_x_category_1_x_category_2_x_part eccp
                WHERE eccp.part_id IN (?)
                ORDER BY eccp.part_id, eccp.id
                LIMIT ${FITMENT_ROW_LIMIT}) capped
         JOIN engine_x_category_1_x_category_2 ecc ON ecc.id = capped.ecc_id
         JOIN engine_x_category_1 ec ON ec.id = ecc.engine_x_category_1_id
         JOIN engine e ON e.id = ec.engine_id
        ORDER BY e.year DESC, e.id
        LIMIT 1`,
      [partIds],
    )
  )[0];

/**
 * Listed parts (in the sitemap: photo, description, price) that are in stock and fit the engine,
 * a few per part type so one type can't crowd out the rest. Starts from the engine's category
 * rows so it stays fast however many vehicles the original part fits.
 */
const loadCandidates = (
  engineId: number,
  partIds: number[],
  filter: string,
  filterValues: string[][],
  exclude: string[],
) =>
  query<CandidateRow>(
    `SELECT /*+ MAX_EXECUTION_TIME(${RELATED_TIMEOUT_MS}) */ r.*
       FROM (SELECT c.*, ROW_NUMBER() OVER (PARTITION BY c.part_type ORDER BY c.part_number) AS rn
               FROM (SELECT cl.path, cl.brand_name, cl.part_type, cl.line_code, cl.part_number, cl.image,
                            pa.Cost, pa.Core_Charge, MIN(p.id) AS part_id
                       FROM engine_x_category_1 ec
                       STRAIGHT_JOIN engine_x_category_1_x_category_2 ecc
                         ON ecc.engine_x_category_1_id = ec.id
                       STRAIGHT_JOIN engine_x_category_1_x_category_2_x_part eccp
                         ON eccp.engine_x_category_1_x_category_2_id = ecc.id
                       STRAIGHT_JOIN part p ON p.id = eccp.part_id
                       STRAIGHT_JOIN catalog_listing cl
                         ON cl.line_code = p.pa_line_code AND cl.part_number = p.part_number
                       STRAIGHT_JOIN partsauthority pa
                         ON pa.Line_Code = cl.line_code AND pa.MPN = cl.part_number
                        AND pa.Quantity_Total > 0
                      WHERE ec.engine_id = ?
                        AND ${filter}
                        AND p.id NOT IN (?)
                        AND p.category_2 NOT IN (?)
                      GROUP BY cl.path, cl.brand_name, cl.part_type, cl.line_code, cl.part_number,
                               cl.image, pa.Cost, pa.Core_Charge
                      LIMIT ${CANDIDATE_LIMIT}) c) r
      WHERE r.rn <= ${PER_TYPE_LIMIT}`,
    [engineId, ...filterValues, partIds, exclude],
  );

const toCard = (row: CandidateRow): ListedPart | null => {
  const priceCents = sellPriceCents(row.Cost, row.Core_Charge);
  if (priceCents <= 0) return null;
  return {
    path: row.path,
    title: [row.brand_name, row.part_type, row.part_number].filter(Boolean).join(" "),
    manufacturer: row.brand_name,
    lineCode: row.line_code,
    partNumber: row.part_number,
    partType: row.part_type,
    image: buildPartImageUrl(row.line_code, row.image),
    priceCents,
    id: String(row.part_id),
  };
};

/**
 * Takes parts from each part type in turn, in `order` (unknown types last), so a brake pad page
 * shows rotors, calipers and hardware rather than twelve rotors.
 */
export const interleaveByType = (cards: ListedPart[], order: string[], limit = RELATED_PART_LIMIT) => {
  const rank = new Map(order.map((type, i) => [type.toLowerCase(), i]));
  const groups = new Map<string, ListedPart[]>();
  const seen = new Set<string>();
  cards.forEach((card) => {
    if (seen.has(card.path)) return;
    seen.add(card.path);
    const key = card.partType.toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), card]);
  });
  const queues = Array.from(groups)
    .sort(([a], [b]) => (rank.get(a) ?? order.length) - (rank.get(b) ?? order.length) || a.localeCompare(b))
    .map(([, list]) => list);

  const picked: ListedPart[] = [];
  for (let round = 0; picked.length < limit && queues.some((list) => list.length > round); round += 1) {
    queues.forEach((list) => {
      if (picked.length < limit && list[round]) picked.push(list[round]);
    });
  }
  return picked;
};

const loadRelatedParts = async (
  partIds: number[],
  partType: string,
  category1: string,
  engineId: number | null,
): Promise<RelatedParts | null> => {
  if (partIds.length === 0) return null;
  const vehicle = await (engineId ? loadEngine(engineId) : loadVehicle(partIds));
  if (!vehicle) return null;

  const jobTypes = relatedPartTypes(partType);
  const sameJob = jobTypes.length > 0;
  const rows = await loadCandidates(
    Number(vehicle.id),
    partIds,
    // The fitment category can differ from the part's own (a transmission bearing filed under
    // Wheel Bearing), so the part's own type or system must match too.
    sameJob
      ? "ecc.category_2_id IN (SELECT id FROM category_2 WHERE title IN (?)) AND p.category_2 IN (?)"
      : "ec.category_1_id IN (SELECT id FROM category_1 WHERE title IN (?)) AND p.category_1 IN (?)",
    Array(2).fill(storedTitles(sameJob ? jobTypes : [category1])),
    storedTitles([partType]),
  );
  const parts = interleaveByType(
    rows.map(toCard).filter((card): card is ListedPart => card !== null),
    jobTypes,
  );
  if (parts.length === 0) return null;

  return {
    vehicle: [vehicle.year, vehicle.make, vehicle.model, vehicle.title].map(clean).filter(Boolean).join(" "),
    sameJob,
    parts,
  };
};

const loadCachedRelatedParts = unstable_cache(loadRelatedParts, ["related-parts"], { revalidate: 86400 });

/**
 * Parts for the same repair, cached for a day: on the shopper's engine when given, otherwise on
 * the newest vehicle the part fits.
 */
export const getRelatedParts = (partIds: number[], partType: string, category1: string, engineId: number | null = null) =>
  loadCachedRelatedParts([...partIds].sort((a, b) => a - b), partType, category1, engineId);
