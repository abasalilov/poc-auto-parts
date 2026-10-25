import { getEnginesByModel } from "@/lib/vehicleQueries";
import { respondWith } from "../respond";

export const runtime = "nodejs";

/** GET /api/vehicles/engines?modelId=5776 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return respondWith("engines", () => getEnginesByModel(Number(searchParams.get("modelId"))));
}
