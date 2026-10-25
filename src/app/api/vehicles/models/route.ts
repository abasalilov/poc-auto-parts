import { getModelsByYearMake } from "@/lib/vehicleQueries";
import { respondWith } from "../respond";

export const runtime = "nodejs";

/** GET /api/vehicles/models?year=2011&make=CHRYSLER */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return respondWith("models", () =>
    getModelsByYearMake(searchParams.get("year") ?? "", searchParams.get("make") ?? ""),
  );
}
