import { partFitsEngine } from "@/lib/productQueries";

export const runtime = "nodejs";

const MAX_PART_IDS = 20;

/** GET /api/part-fits?partIds=10,11&engine=28400 → { fits: boolean } */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const partIds = (searchParams.get("partIds") ?? "")
    .split(",")
    .map((value) => Number(value))
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, MAX_PART_IDS);
  const engineId = Number(searchParams.get("engine"));
  if (partIds.length === 0 || !Number.isInteger(engineId) || engineId <= 0) {
    return Response.json({ error: "partIds and engine are required" }, { status: 400 });
  }

  try {
    const fits = await partFitsEngine(partIds, engineId);
    return Response.json(
      { fits },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (error) {
    console.error("part fit check failed", error);
    return Response.json({ error: "Fit check failed" }, { status: 500 });
  }
}
