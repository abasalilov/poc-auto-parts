import { getRelatedParts } from "@/lib/relatedParts";

export const runtime = "nodejs";

const MAX_PART_IDS = 20;

/** GET /api/related-parts?partIds=10,11&engine=28400&partType=Brake%20Pad&category1=… → RelatedParts | null */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const partIds = (searchParams.get("partIds") ?? "")
    .split(",")
    .map((value) => Number(value))
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, MAX_PART_IDS);
  const engineId = Number(searchParams.get("engine"));
  const partType = (searchParams.get("partType") ?? "").slice(0, 255);
  const category1 = (searchParams.get("category1") ?? "").slice(0, 255);
  if (partIds.length === 0 || !Number.isInteger(engineId) || engineId <= 0) {
    return Response.json({ error: "partIds and engine are required" }, { status: 400 });
  }

  try {
    const related = await getRelatedParts(partIds, partType, category1, engineId);
    return Response.json(related, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.error("[related-parts]", error);
    return Response.json({ error: "Related parts failed" }, { status: 500 });
  }
}
