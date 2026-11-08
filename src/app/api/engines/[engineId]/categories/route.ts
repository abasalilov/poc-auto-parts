import { getEngineCategories } from "@/lib/partSearchQueries";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { engineId: string } }) {
  const engineId = Number(params.engineId);
  if (!Number.isSafeInteger(engineId) || engineId <= 0) {
    return Response.json({ error: "Invalid engine id" }, { status: 400 });
  }

  try {
    const categories = await getEngineCategories(engineId);
    return Response.json(categories, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.error("getEngineCategories failed", error);
    return Response.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
