import { searchEngineParts } from "@/lib/partSearchQueries";

export const runtime = "nodejs";

const toList = (value: string | null) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * GET /api/part-search?engineId=7057&categoryIds=1,2&partNumbers=AD0868&partTypes=Brake%20Pad
 * (part types are repeated params, since titles can contain commas)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const engineId = searchParams.get("engineId");
  if (!engineId) {
    return Response.json({ error: "engineId is required" }, { status: 400 });
  }

  try {
    const hits = await searchEngineParts({
      engineId: Number(engineId),
      categoryIds: toList(searchParams.get("categoryIds")).map(Number),
      partNumbers: toList(searchParams.get("partNumbers")),
      partTypes: searchParams.getAll("partTypes"),
    });
    return Response.json(hits, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.error("part search failed", error);
    return Response.json({ error: "Part search failed" }, { status: 500 });
  }
}
