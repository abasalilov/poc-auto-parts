import type { RowDataPacket } from "mysql2/promise";

import { query } from "@/lib/db";
import { checkoutLineKey, type CheckoutLine } from "@/lib/checkoutLines";
import { checkLiveStock, soldOutParts, type LiveStock } from "@/lib/liveStock";
import { sellPriceCents } from "@/lib/pricing";
import { quoteShipping } from "@/lib/shipments";
import { PARCEL_COLUMNS, PARCEL_JOINS, parcelFromRow, type ParcelRow } from "@/lib/shippingParcels";
import type { Parcel } from "@/lib/shippingRates";
import { prepareStripeCheckoutLineItems, type StripeCheckoutLineItem } from "@/lib/stripeCheckout";

export interface CatalogPartRow extends Partial<ParcelRow> {
  manufacturer: string;
  part_number: string;
  category_2: string | null;
  pa_line_code: string;
  Cost: number | string | null;
  Core_Charge: number | string | null;
  Quantity_Total: number | string | null;
}

export interface PricedCheckoutPart {
  lineCode: string;
  partNumber: string;
  manufacturer: string;
  category2: string;
  price: number;
  quantity: number;
  parcel: Parcel;
}

export type CheckoutProblem = {
  ok: false;
  /** "freight": too big or heavy to ship FedEx Ground, so it needs a quote. */
  reason: "unavailable" | "freight";
  unavailable: string[];
};

export type PricedParts = { ok: true; parts: PricedCheckoutPart[]; subtotalCents: number } | CheckoutProblem;

export type PricedCheckout =
  | {
      ok: true;
      parts: PricedCheckoutPart[];
      lineItems: StripeCheckoutLineItem[];
      subtotalCents: number;
      shippingCents: number;
      shipments: number;
    }
  | CheckoutProblem;

const clean = (value: unknown) => String(value ?? "").replace(/&amp;/g, "&").trim();

/** Prices cart lines from catalog rows; any missing, out-of-stock or unpriced part fails the checkout. */
export const priceCheckoutLinesFromRows = (lines: CheckoutLine[], rows: CatalogPartRow[]): PricedParts => {
  const byKey = new Map<string, CatalogPartRow>();
  rows.forEach((row) => {
    const key = checkoutLineKey(row.pa_line_code, row.part_number);
    if (!byKey.has(key)) byKey.set(key, row);
  });

  const unavailable: string[] = [];
  const parts: PricedCheckoutPart[] = [];
  lines.forEach((line) => {
    const row = byKey.get(checkoutLineKey(line.lineCode, line.partNumber));
    const price = row ? sellPriceCents(row.Cost, row.Core_Charge) : 0;
    if (!row || Number(row.Quantity_Total) <= 0 || price <= 0) {
      unavailable.push(line.partNumber);
      return;
    }
    parts.push({
      lineCode: line.lineCode,
      partNumber: row.part_number,
      manufacturer: clean(row.manufacturer),
      category2: clean(row.category_2),
      price,
      quantity: line.quantity,
      parcel: parcelFromRow(row),
    });
  });

  if (unavailable.length > 0) return { ok: false, reason: "unavailable", unavailable };
  return { ok: true, parts, subtotalCents: parts.reduce((sum, part) => sum + part.price * part.quantity, 0) };
};

/** Blocks sold-out and freight-only parts, then prices shipping by the shipments live stock implies. */
export const finishCheckoutPricing = (
  priced: Extract<PricedParts, { ok: true }>,
  stock: (LiveStock | null)[],
): PricedCheckout => {
  const soldOut = soldOutParts(priced.parts, stock);
  if (soldOut.length > 0) return { ok: false, reason: "unavailable", unavailable: soldOut };

  const quote = quoteShipping(
    priced.parts,
    stock.map((detail) => detail?.warehouses ?? null),
  );
  if (quote.freightOnly.length > 0) return { ok: false, reason: "freight", unavailable: quote.freightOnly };

  return {
    ...priced,
    lineItems: prepareStripeCheckoutLineItems(priced.parts, quote.shippingCents),
    shippingCents: quote.shippingCents,
    shipments: quote.shipments,
  };
};

export const priceCheckoutLines = async (lines: CheckoutLine[]): Promise<PricedCheckout> => {
  const rows = await query<RowDataPacket & CatalogPartRow>(
    `SELECT p.manufacturer, p.part_number, p.category_2, p.pa_line_code,
            pa.Cost, pa.Core_Charge, pa.Quantity_Total, ${PARCEL_COLUMNS}
       FROM part p
       JOIN partsauthority pa ON pa.Line_Code = p.pa_line_code AND pa.MPN = p.part_number
       ${PARCEL_JOINS}
      WHERE (p.pa_line_code, p.part_number) IN (?)
      ORDER BY p.id`,
    [lines.map((line) => [line.lineCode, line.partNumber])],
  );
  const priced = priceCheckoutLinesFromRows(lines, rows);
  if (!priced.ok) return priced;
  return finishCheckoutPricing(priced, await checkLiveStock(priced.parts));
};
