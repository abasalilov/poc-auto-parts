import { getMakesByYear } from "@/lib/vehicleQueries";
import { respondWith } from "../respond";

export const runtime = "nodejs";

/** GET /api/vehicles/makes?year=2011 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return respondWith("makes", () => getMakesByYear(searchParams.get("year") ?? ""));
}
