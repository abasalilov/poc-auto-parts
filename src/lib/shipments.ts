import { isFreightOnly, shipmentCents, type Parcel } from "@/lib/shippingRates";

export interface ShippingItem {
  partNumber: string;
  quantity: number;
  parcel: Parcel;
}

export interface ShippingQuote {
  shippingCents: number;
  shipments: number;
  /** Part numbers too big or heavy for FedEx Ground. */
  freightOnly: string[];
}

/** Units on hand per warehouse, or null when the stock check failed. */
export type WarehouseStock = Record<string, number> | null;

/**
 * Packs items into as few warehouses as possible, assuming each warehouse ships one box.
 * Each round picks the warehouse that can fill the most remaining items. Items no single
 * warehouse can fill ship on their own; items with unknown stock join the largest shipment.
 */
export const groupShipments = <T extends { quantity: number }>(items: T[], stock: WarehouseStock[]): T[][] => {
  const unknown = items.filter((_, index) => !stock[index]);
  let remaining = items.map((item, index) => ({ item, warehouses: stock[index] })).filter((entry) => entry.warehouses);
  const groups: T[][] = [];

  while (remaining.length > 0) {
    const counts = new Map<string, number>();
    remaining.forEach(({ item, warehouses }) => {
      Object.entries(warehouses ?? {}).forEach(([warehouse, qty]) => {
        if (qty >= item.quantity) counts.set(warehouse, (counts.get(warehouse) ?? 0) + 1);
      });
    });
    const best = Array.from(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
    if (!best) {
      remaining.forEach(({ item }) => groups.push([item]));
      break;
    }
    groups.push(remaining.filter(({ item, warehouses }) => (warehouses?.[best] ?? 0) >= item.quantity).map(({ item }) => item));
    remaining = remaining.filter(({ item, warehouses }) => (warehouses?.[best] ?? 0) < item.quantity);
  }

  if (unknown.length > 0) {
    if (groups.length === 0) return [unknown];
    groups.sort((a, b) => b.length - a.length)[0].push(...unknown);
  }
  return groups;
};

export const quoteShipping = (items: ShippingItem[], stock: WarehouseStock[]): ShippingQuote => {
  const groups = groupShipments(items, stock);
  return {
    shippingCents: groups.reduce((sum, group) => sum + shipmentCents(group), 0),
    shipments: groups.length,
    freightOnly: items.filter((item) => isFreightOnly(item.parcel)).map((item) => item.partNumber),
  };
};
