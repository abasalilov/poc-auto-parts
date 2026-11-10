export const normalizePriceCents = (value: unknown): number => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.round(numericValue);
};

/**
 * How a catalog/API `price` field is encoded before cart normalization.
 * - `cents`: integer cents (Firestore / `formatSearchResults`), or a numeric string like `"5049.00"` from `.toFixed(2)` on cents.
 * - `dollars`: decimal dollars (manufacturer list API).
 */
export type CatalogListPriceEncoding = "cents" | "dollars";

/**
 * Unit price in integer cents from a catalog row `price` field.
 * Centralizes rules so cart + GA4 `add_to_cart` stay aligned.
 */
export function unitPriceCentsFromCatalogListPrice(
  raw: unknown,
  encoding: CatalogListPriceEncoding,
): number {
  if (encoding === "dollars") {
    return normalizeDollarsToCents(raw);
  }

  if (raw === null || raw === undefined) {
    return 0;
  }

  const normalizedString =
    typeof raw === "string"
      ? raw
          .trim()
          .replace(/[$,\s]/g, "")
      : "";
  const numericValue = Number(
    typeof raw === "string" ? normalizedString : raw,
  );

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.round(numericValue);
};

export const normalizeDollarsToCents = (value: unknown): number => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return normalizePriceCents(numericValue * 100);
};

type CartLineWithPrice = {
  price?: unknown;
  value?: unknown;
  quantity?: unknown;
  qtyInCart?: unknown;
};

export const sumCartLinesArrayCents = (
  cartItems: CartLineWithPrice[],
): number => {
  return cartItems.reduce((sum, item) => {
    const unitPriceCents = normalizePriceCents(item.price ?? item.value);
    const quantity = Number(item.quantity ?? item.qtyInCart ?? 1);
    const normalizedQuantity =
      Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;

    return sum + unitPriceCents * normalizedQuantity;
  }, 0);
};
