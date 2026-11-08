import type { RowDataPacket } from "mysql2/promise";

import { query } from "@/lib/db";

export const runtime = "nodejs";

const VALID = /^[A-Za-z0-9-]{1,40}$/;

/**
 * GET /api/part-images?lineCode=BS&partNumber=BE1012H
 * Image file names for a part, for items that weren't loaded with them (saved carts, orders).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lineCode = searchParams.get("lineCode")?.trim() ?? "";
  const partNumber = searchParams.get("partNumber")?.trim() ?? "";
  if (!VALID.test(lineCode) || !VALID.test(partNumber)) {
    return Response.json({ error: "lineCode and partNumber are required" }, { status: 400 });
  }

  try {
    const rows = await query<RowDataPacket & { ImageName: string }>(
      `SELECT ImageName FROM pies_images WHERE PartNumber = ? AND ProductLine = ? ORDER BY ImageName`,
      [partNumber, lineCode],
    );
    return Response.json(
      { images: rows.map((row) => row.ImageName).filter(Boolean) },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (error) {
    console.error("part images lookup failed", error);
    return Response.json({ error: "Image lookup failed" }, { status: 500 });
  }
}
