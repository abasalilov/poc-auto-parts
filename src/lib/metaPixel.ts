type MetaItem = {
  partNumber?: string | number;
  part_number?: string | number;
  manufacturer?: string;
  category1?: string;
  category2?: string;
  price?: string | number;
  value?: string | number;
  qtyInCart?: string | number;
  quantity?: string | number;
};

import { getCanonicalProductId } from "@/lib/canonicalProductId";
import { normalizePriceCents } from "@/lib/priceCents";

type MetaEventName = "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

const normalizeMetaValueCents = (value: unknown) => {
  const cents = normalizePriceCents(value);
  if (cents <= 0) {
    return undefined;
  }
  return Number((cents / 100).toFixed(2));
};

const getMetaItemId = (item: MetaItem) => getCanonicalProductId(item);

const getMetaItemQuantity = (item: MetaItem, fallback = 1) => {
  const quantity = Number(item.qtyInCart ?? item.quantity ?? fallback);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : fallback;
};

const buildMetaPayload = (items: MetaItem[], value?: number) => {
  const normalizedItems = items
    .map((item) => {
      const id = getMetaItemId(item);
      if (!id) {
        console.warn("[Meta Pixel] Missing canonical product ID", {
          manufacturer: item.manufacturer,
          partNumber: item.partNumber ?? item.part_number,
        });
        return null;
      }

      const quantity = getMetaItemQuantity(item);
      const itemPrice = normalizeMetaValueCents(item.price ?? item.value);

      return {
        id,
        quantity,
        itemPrice,
        manufacturer: item.manufacturer,
        category1: item.category1,
        category2: item.category2,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    quantity: number;
    itemPrice?: number;
    manufacturer?: string;
    category1?: string;
    category2?: string;
  }>;

  if (normalizedItems.length === 0) {
    return null;
  }

  const firstItem = normalizedItems[0];
  const computedValue = normalizedItems.reduce((sum, item) => {
    return sum + (item.itemPrice ?? 0) * item.quantity;
  }, 0);
  const resolvedValue = value
    ? normalizeMetaValueCents(value)
    : computedValue > 0
      ? Number(computedValue.toFixed(2))
      : undefined;

  return {
    content_type: "product",
    content_ids: normalizedItems.map((item) => item.id),
    contents: normalizedItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      ...(item.itemPrice ? { item_price: item.itemPrice } : {}),
    })),
    content_name: `${firstItem.manufacturer ?? ""} ${firstItem.category2 ?? ""}`.trim(),
    content_category: firstItem.category1,
    currency: "USD",
    num_items: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
    ...(resolvedValue ? { value: resolvedValue } : {}),
  };
};

const trackMeta = (
  method: "track" | "trackCustom",
  eventName: string,
  items: MetaItem[],
  value?: number,
) => {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  const payload = buildMetaPayload(items, value);
  if (!payload) {
    return;
  }

  console.log("[Meta Pixel] canonical IDs", {
    eventName,
    content_ids: payload.content_ids,
  });
  window.fbq(method, eventName, payload);
};

export const trackMetaViewContent = (item: MetaItem, value?: number) => {
  trackMeta("track", "ViewContent", [item], value);
};

export const trackMetaAddToCart = (item: MetaItem, value?: number) => {
  trackMeta("track", "AddToCart", [item], value);
};

export const trackMetaViewCart = (items: MetaItem[], value?: number) => {
  trackMeta("trackCustom", "ViewCart", items, value);
};

export const trackMetaInitiateCheckout = (items: MetaItem[], value?: number) => {
  trackMeta("track", "InitiateCheckout", items, value);
};

export const trackMetaPurchase = (items: MetaItem[], value?: number) => {
  trackMeta("track", "Purchase", items, value);
};
