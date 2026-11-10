import { itemsFittingEngine } from "@/lib/productQueries";
import type { ItemKey } from "@/lib/productUrl";

export const runtime = "nodejs";

const MAX_ITEMS = 48;
const ITEM = /^([A-Z0-9]{1,20}):([A-Z0-9-]{1,40})$/;

/** GET /api/listing-fits?engine=28400&items=BS:0986424481,CR:13119 → { fits: ["BS:0986424481"] } */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const items = (searchParams.get("items") ?? "")
    .toUpperCase()
    .split(",")
    .flatMap((value): ItemKey[] => {
      const match = ITEM.exec(value.trim());
      return match ? [{ lineCode: match[1], partNumber: match[2] }] : [];
    })
    .slice(0, MAX_ITEMS);
  const engineId = Number(searchParams.get("engine"));
  if (items.length === 0 || !Number.isInteger(engineId) || engineId <= 0) {
    return Response.json({ error: "items and engine are required" }, { status: 400 });
  }

  try {
    const fits = await itemsFittingEngine(items, engineId);
    return Response.json(
      { fits },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (error) {
    console.error("listing fit check failed", error);
    return Response.json({ error: "Fit check failed" }, { status: 500 });
  }
}
