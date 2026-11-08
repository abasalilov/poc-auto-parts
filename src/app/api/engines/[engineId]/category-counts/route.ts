import { getEngineCategoryCounts } from "@/lib/partSearchQueries";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { engineId: string } }) {
  const engineId = Number(params.engineId);
  if (!Number.isSafeInteger(engineId) || engineId <= 0) {
    return Response.json({ error: "Invalid engine id" }, { status: 400 });
  }

  try {
    const counts = await getEngineCategoryCounts(engineId);
    return Response.json(counts, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("getEngineCategoryCounts failed", error);
    return Response.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
