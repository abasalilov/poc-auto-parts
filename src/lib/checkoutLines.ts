/** What the browser sends to checkout: which parts and how many, never prices. */
export interface CheckoutLine {
  lineCode: string;
  partNumber: string;
  quantity: number;
}

export const MAX_CHECKOUT_QUANTITY = 10;

export const checkoutLineKey = (lineCode: string, partNumber: string) =>
  `${lineCode.trim().toUpperCase()}|${partNumber.trim().toUpperCase()}`;

const VALID_CODE = /^[A-Z0-9-]{1,40}$/;

export const toCheckoutLines = (items: Record<string, any>[]): CheckoutLine[] =>
  items.map((item) => ({
    lineCode: String(item?.productLine ?? item?.lineCode ?? item?.["Product Line"] ?? "").trim(),
    partNumber: String(item?.partNumber ?? item?.part_number ?? "").trim(),
    quantity: Number(item?.quantity ?? item?.qtyInCart ?? 1),
  }));

/** Cart items with each price replaced by the price checkout actually charged. */
export const withCheckoutPrices = <T extends Record<string, any>>(
  items: T[],
  parts: { lineCode: string; partNumber: string; price: number }[],
): T[] => {
  const prices = new Map(parts.map((part) => [checkoutLineKey(part.lineCode, part.partNumber), part.price]));
  return items.map((item) => {
    const [line] = toCheckoutLines([item]);
    const price = prices.get(checkoutLineKey(line.lineCode, line.partNumber));
    return price === undefined ? item : { ...item, price };
  });
};

/** Validated, de-duplicated lines, or null when any line is malformed. */
export const normalizeCheckoutLines = (lines: unknown): CheckoutLine[] | null => {
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > 50) return null;
  const merged = new Map<string, CheckoutLine>();
  for (const line of lines) {
    const lineCode = String(line?.lineCode ?? "").trim().toUpperCase();
    const partNumber = String(line?.partNumber ?? "").trim().toUpperCase();
    const quantity = Math.floor(Number(line?.quantity));
    if (!VALID_CODE.test(lineCode) || !VALID_CODE.test(partNumber)) return null;
    if (!Number.isFinite(quantity) || quantity < 1) return null;
    const key = checkoutLineKey(lineCode, partNumber);
    const existing = merged.get(key);
    merged.set(key, {
      lineCode,
      partNumber,
      quantity: Math.min(MAX_CHECKOUT_QUANTITY, (existing?.quantity ?? 0) + quantity),
    });
  }
  return Array.from(merged.values());
};

/** Where Stripe's back link returns to: a same-site path, or the home page for anything else. */
export const checkoutReturnPath = (path: unknown): string => {
  if (typeof path !== "string" || path.length > 300) return "/";
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
  return path;
};
