import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ query: vi.fn() }));

const { finishCheckoutPricing, priceCheckoutLinesFromRows } = await import("./checkoutPricing");
const { normalizeCheckoutLines, toCheckoutLines, withCheckoutPrices } = await import(
  "./checkoutLines"
);

const row = (overrides: Record<string, unknown> = {}) => ({
  manufacturer: "BOSCH",
  part_number: "BC1058",
  category_2: "Brake Pad",
  pa_line_code: "BS",
  Cost: "37.89",
  Core_Charge: "0",
  Quantity_Total: 4,
  weight_lb: "2.10",
  length_in: "7.00",
  width_in: "6.00",
  height_in: "3.00",
  median_billable_lb: "2.50",
  ...overrides,
});

const priceFully = (
  lines: { lineCode: string; partNumber: string; quantity: number }[],
  rows: ReturnType<typeof row>[],
  stock: ({ total: number; warehouses: Record<string, number> } | null)[] = [null],
) => {
  const priced = priceCheckoutLinesFromRows(lines, rows);
  return priced.ok ? finishCheckoutPricing(priced, stock) : priced;
};

describe("normalizeCheckoutLines", () => {
  it("rejects malformed input", () => {
    expect(normalizeCheckoutLines([])).toBeNull();
    expect(normalizeCheckoutLines("x")).toBeNull();
    expect(normalizeCheckoutLines([{ lineCode: "BS", partNumber: "BC1058", quantity: 0 }])).toBeNull();
    expect(normalizeCheckoutLines([{ lineCode: "B S';", partNumber: "BC1058", quantity: 1 }])).toBeNull();
  });

  it("merges duplicates and caps quantity", () => {
    expect(
      normalizeCheckoutLines([
        { lineCode: "bs", partNumber: "bc1058", quantity: 6 },
        { lineCode: "BS", partNumber: "BC1058", quantity: 6 },
      ]),
    ).toEqual([{ lineCode: "BS", partNumber: "BC1058", quantity: 10 }]);
  });
});

describe("priceCheckoutLinesFromRows", () => {
  const lines = [{ lineCode: "BS", partNumber: "BC1058", quantity: 2 }];

  it("charges the catalog price, ignoring anything the browser had", () => {
    const priced = priceFully(lines, [row()]);
    expect(priced.ok).toBe(true);
    if (!priced.ok) return;
    expect(priced.parts[0].price).toBe(4547);
    expect(priced.subtotalCents).toBe(9094);
    const partLine = priced.lineItems.find((item) => item.price_data.product_data.name !== "Shipping");
    expect(partLine?.price_data.unit_amount).toBe(4547);
    expect(partLine?.quantity).toBe(2);
    expect(partLine?.price_data.product_data.name).toBe("BOSCH Brake Pad BC1058");
  });

  it("adds the core charge", () => {
    const priced = priceCheckoutLinesFromRows(lines, [row({ Core_Charge: "10" })]);
    expect(priced.ok && priced.parts[0].price).toBe(5547);
  });

  it("charges shipping by the weight of everything in the box, with no free threshold", () => {
    // 2 × 2.1 lb = 4.2 lb → the 3–10 lb tier.
    const priced = priceFully(lines, [row()]);
    expect(priced.ok && priced.shippingCents).toBe(1599);
    expect(priced.ok && priced.lineItems.find((item) => item.price_data.product_data.name === "Shipping"))
      .toMatchObject({ price_data: { unit_amount: 1599 }, quantity: 1 });
    const expensive = priceFully([{ lineCode: "BS", partNumber: "BC1058", quantity: 1 }], [row({ Cost: "500" })]);
    expect(expensive.ok && expensive.shippingCents).toBe(1199);
  });

  it("charges a shipment per warehouse", () => {
    const two = [...lines, { lineCode: "WA", partNumber: "ZD1012A", quantity: 1 }];
    const rows = [row(), row({ pa_line_code: "WA", part_number: "ZD1012A" })];
    const priced = priceFully(two, rows, [
      { total: 5, warehouses: { gastock: 5 } },
      { total: 1, warehouses: { wastock: 1 } },
    ]);
    expect(priced.ok && priced.shipments).toBe(2);
    expect(priced.ok && priced.shippingCents).toBe(1599 + 1199);
  });

  it("uses the category median when the part has no dimensions", () => {
    const priced = priceFully(lines, [
      row({ weight_lb: null, length_in: null, width_in: null, height_in: null, median_billable_lb: "12" }),
    ]);
    expect(priced.ok && priced.shippingCents).toBe(2999);
  });

  it("blocks parts that only ship by freight", () => {
    expect(priceFully(lines, [row({ weight_lb: "180" })])).toEqual({
      ok: false,
      reason: "freight",
      unavailable: ["BC1058"],
    });
  });

  it("fails when a part is missing, out of stock or unpriced", () => {
    const more = [...lines, { lineCode: "WA", partNumber: "ZD1012A", quantity: 1 }];
    const unavailable = (partNumber: string) => ({ ok: false, reason: "unavailable", unavailable: [partNumber] });
    expect(priceCheckoutLinesFromRows(more, [row()])).toEqual(unavailable("ZD1012A"));
    expect(priceCheckoutLinesFromRows(lines, [row({ Quantity_Total: 0 })])).toEqual(unavailable("BC1058"));
    expect(priceCheckoutLinesFromRows(lines, [row({ Cost: null })])).toEqual(unavailable("BC1058"));
    expect(priceFully(lines, [row()], [{ total: 1, warehouses: { gastock: 1 } }])).toEqual(unavailable("BC1058"));
  });
});

describe("cart helpers", () => {
  it("sends only line code, part number and quantity", () => {
    expect(
      toCheckoutLines([{ productLine: "BS", partNumber: "BC1058", quantity: 1, price: 1 }]),
    ).toEqual([{ lineCode: "BS", partNumber: "BC1058", quantity: 1 }]);
  });

  it("replaces cart prices with the charged prices", () => {
    const items = [{ productLine: "BS", partNumber: "BC1058", quantity: 1, price: 1, image: "x" }];
    expect(
      withCheckoutPrices(items, [{ lineCode: "BS", partNumber: "BC1058", price: 4547 }]),
    ).toEqual([{ ...items[0], price: 4547 }]);
  });
});
