import type { RowDataPacket } from "mysql2/promise";

import { query } from "@/lib/db";
import { decodeHtmlEntities } from "@/lib/categorySearch";

export interface VehicleOption {
  id: number;
  title: string;
}

const toYear = (value: unknown): string | null => {
  const year = String(value ?? "").trim();
  return /^\d{4}$/.test(year) ? year : null;
};

const toMake = (value: unknown): string | null => {
  const make = String(value ?? "").trim();
  return make.length > 0 && make.length <= 60 ? make : null;
};

const toPositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

type OptionRow = RowDataPacket & { id: number; title: string };

const toOptions = (rows: OptionRow[]): VehicleOption[] =>
  rows.map((row) => ({ id: Number(row.id), title: decodeHtmlEntities(row.title) }));

export async function getMakesByYear(year: string): Promise<string[]> {
  const y = toYear(year);
  if (!y) return [];
  const rows = await query<RowDataPacket & { make: string }>(
    `SELECT DISTINCT make FROM year WHERE title = ? ORDER BY make`,
    [y],
  );
  return rows.map((row) => decodeHtmlEntities(row.make));
}

export async function getModelsByYearMake(year: string, make: string): Promise<VehicleOption[]> {
  const y = toYear(year);
  const mk = toMake(make);
  if (!y || !mk) return [];
  const rows = await query<OptionRow>(
    `SELECT m.id, m.title
       FROM year y
       JOIN model m ON m.year_id = y.id
      WHERE y.title = ? AND y.make = ?
      ORDER BY m.title`,
    [y, mk],
  );
  return toOptions(rows);
}

export async function getEnginesByModel(modelId: number): Promise<VehicleOption[]> {
  const id = toPositiveInt(modelId);
  if (!id) return [];
  const rows = await query<OptionRow>(
    `SELECT id, title FROM engine WHERE model_id = ? ORDER BY title`,
    [id],
  );
  return toOptions(rows);
}
