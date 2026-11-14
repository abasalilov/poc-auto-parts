/** Live on-hand quantity from Parts Authority; the partsauthority table is only a daily snapshot. */
export const LIVE_STOCK_TIMEOUT_MS = 2000;

export interface LiveStock {
  /** All stock, including the vendor's ("instock"). */
  total: number;
  /** Units per warehouse bucket, e.g. { gastock: 3, venstock: 19 }; vendor stock ships on its own. */
  warehouses: Record<string, number>;
}

/** instock is the total and castock the sum of the California buckets (frstock, ncstock, scstock). */
const SUM_BUCKETS = new Set(["instock", "castock"]);

export const parseLiveStock = (detail: unknown): LiveStock | null => {
  if (!detail || typeof detail !== "object") return null;
  const values = detail as Record<string, unknown>;
  const total = Number.parseInt(String(values.instock ?? ""), 10);
  if (!Number.isFinite(total)) return null;
  const warehouses: Record<string, number> = {};
  Object.entries(values).forEach(([key, value]) => {
    if (!/^[a-z]+stock$/.test(key) || SUM_BUCKETS.has(key)) return;
    const qty = Number.parseInt(String(value ?? ""), 10);
    if (Number.isFinite(qty) && qty > 0) warehouses[key] = qty;
  });
  return { total, warehouses };
};

/** Stock by warehouse, or null when the check can't be made (not configured, slow, or erroring). */
export const fetchStockDetail = async (
  lineCode: string,
  partNumber: string,
  timeoutMs = LIVE_STOCK_TIMEOUT_MS,
): Promise<LiveStock | null> => {
  const endpoint = process.env.PA_ENDPOINT;
  if (!endpoint) return null;

  const reqData = JSON.stringify({
    accountNum: process.env.PA_ACCT_NUM,
    client: process.env.PA_CLIENT,
    userName: process.env.PA_UNAME,
    userPass: process.env.PA_USER_PASSWORD,
    line_code: lineCode,
    part_number: partNumber,
    action: "checkStock",
  });

  try {
    const url = new URL(endpoint);
    url.searchParams.set("reqData", reqData);
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return parseLiveStock(data?.responseDetail);
  } catch {
    return null;
  }
};

/** On-hand quantity, or null when the check can't be made. */
export const fetchLiveStock = async (
  lineCode: string,
  partNumber: string,
  timeoutMs = LIVE_STOCK_TIMEOUT_MS,
): Promise<number | null> => (await fetchStockDetail(lineCode, partNumber, timeoutMs))?.total ?? null;

/** Live stock for each part, in order; checks run in parallel. */
export const checkLiveStock = async (
  parts: { lineCode: string; partNumber: string }[],
): Promise<(LiveStock | null)[]> => {
  const started = Date.now();
  const stock = await Promise.all(parts.map((part) => fetchStockDetail(part.lineCode, part.partNumber)));
  const unknown = stock.filter((detail) => detail === null).length;
  console.info(
    `live stock: ${parts.length} parts in ${Date.now() - started}ms${unknown ? `, ${unknown} unknown` : ""}`,
  );
  return stock;
};

/**
 * Part numbers Parts Authority says can't cover the requested quantity right now.
 * A part whose check failed or timed out (null) is not blocked.
 */
export const soldOutParts = (
  parts: { partNumber: string; quantity: number }[],
  stock: (LiveStock | null)[],
): string[] =>
  parts
    .filter((part, index) => stock[index] !== null && (stock[index] as LiveStock).total < part.quantity)
    .map((part) => part.partNumber);

export const findSoldOutParts = async (
  parts: { lineCode: string; partNumber: string; quantity: number }[],
): Promise<string[]> => soldOutParts(parts, await checkLiveStock(parts));
