import type { RowDataPacket } from "mysql2/promise";

import { checkoutLineKey } from "@/lib/checkoutLines";
import { query } from "@/lib/db";
import { FALLBACK_BILLABLE_LB, type Parcel } from "@/lib/shippingRates";

const PARCEL_TIMEOUT_MS = 3000;

/** Columns that size a part; join part_dimensions d and category_shipping_weight c to select them. */
export const PARCEL_COLUMNS = "d.weight_lb, d.length_in, d.width_in, d.height_in, c.median_billable_lb";
export const PARCEL_JOINS = `LEFT JOIN part_dimensions d ON d.line_code = p.pa_line_code AND d.part_number = p.part_number
  LEFT JOIN category_shipping_weight c ON c.category_2 = p.category_2`;

export interface ParcelRow {
  weight_lb: number | string | null;
  length_in: number | string | null;
  width_in: number | string | null;
  height_in: number | string | null;
  median_billable_lb: number | string | null;
}

const size = (value: number | string | null | undefined) => {
  const parsed = Number(value);
  return value !== null && value !== undefined && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const parcelFromRow = (row: Partial<ParcelRow> | undefined): Parcel => ({
  weightLb: size(row?.weight_lb),
  lengthIn: size(row?.length_in),
  widthIn: size(row?.width_in),
  heightIn: size(row?.height_in),
  fallbackLb: size(row?.median_billable_lb) ?? FALLBACK_BILLABLE_LB,
});

export const UNKNOWN_PARCEL = parcelFromRow(undefined);

/**
 * Parcels keyed by checkoutLineKey. Primary-key lookups only; if the lookup fails every part
 * falls back to the default size rather than blocking the page or checkout.
 */
export const loadParcels = async (
  lines: { lineCode: string; partNumber: string }[],
): Promise<Map<string, Parcel>> => {
  const parcels = new Map<string, Parcel>();
  if (lines.length === 0) return parcels;
  try {
    const rows = await query<RowDataPacket & ParcelRow & { pa_line_code: string; part_number: string }>(
      `SELECT /*+ MAX_EXECUTION_TIME(${PARCEL_TIMEOUT_MS}) */ p.pa_line_code, p.part_number, ${PARCEL_COLUMNS}
         FROM part p
         ${PARCEL_JOINS}
        WHERE (p.pa_line_code, p.part_number) IN (?)
        ORDER BY p.id`,
      [lines.map((line) => [line.lineCode, line.partNumber])],
    );
    rows.forEach((row) => {
      const key = checkoutLineKey(row.pa_line_code, row.part_number);
      if (!parcels.has(key)) parcels.set(key, parcelFromRow(row));
    });
  } catch (error) {
    console.error("[shipping] parcel lookup failed", error);
  }
  return parcels;
};

export const parcelFor = (parcels: Map<string, Parcel>, lineCode: string, partNumber: string) =>
  parcels.get(checkoutLineKey(lineCode, partNumber)) ?? UNKNOWN_PARCEL;
