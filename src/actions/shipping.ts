"use server";

import { normalizeCheckoutLines } from "@/lib/checkoutLines";
import { checkLiveStock } from "@/lib/liveStock";
import { quoteShipping, type ShippingQuote } from "@/lib/shipments";
import { loadParcels, parcelFor } from "@/lib/shippingParcels";

/** The cart's shipping price, split by warehouse the same way checkout charges it. */
export async function quoteCartShipping(lines: unknown): Promise<({ ok: true } & ShippingQuote) | { ok: false }> {
  const normalized = normalizeCheckoutLines(lines);
  if (!normalized) return { ok: false };
  const [parcels, stock] = await Promise.all([loadParcels(normalized), checkLiveStock(normalized)]);
  const items = normalized.map((line) => ({
    partNumber: line.partNumber,
    quantity: line.quantity,
    parcel: parcelFor(parcels, line.lineCode, line.partNumber),
  }));
  return { ok: true, ...quoteShipping(items, stock.map((detail) => detail?.warehouses ?? null)) };
}
