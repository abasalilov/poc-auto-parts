import { describe, expect, it } from "vitest";

import { groupShipments, quoteShipping } from "./shipments";
import { FALLBACK_BILLABLE_LB, type Parcel } from "./shippingRates";

const small: Parcel = { weightLb: 0.4, lengthIn: 4, widthIn: 4, heightIn: 2, fallbackLb: FALLBACK_BILLABLE_LB };
const item = (partNumber: string, quantity = 1, parcel = small) => ({ partNumber, quantity, parcel });
const names = (groups: { partNumber: string }[][]) => groups.map((group) => group.map((i) => i.partNumber));

describe("groupShipments", () => {
  it("ships everything from one warehouse when one has it all", () => {
    const groups = groupShipments(
      [item("A"), item("B")],
      [{ gastock: 2, nystock: 1 }, { nystock: 3 }],
    );
    expect(names(groups)).toEqual([["A", "B"]]);
  });

  it("uses as few warehouses as possible", () => {
    const groups = groupShipments(
      [item("A"), item("B"), item("C")],
      [{ gastock: 1 }, { gastock: 1, wastock: 1 }, { wastock: 1 }],
    );
    expect(groups).toHaveLength(2);
  });

  it("only counts a warehouse that has the full quantity", () => {
    const groups = groupShipments([item("A", 3), item("B")], [{ gastock: 2, nystock: 3 }, { gastock: 5 }]);
    expect(names(groups)).toEqual([["B"], ["A"]]);
  });

  it("ships vendor stock separately", () => {
    const groups = groupShipments([item("A"), item("B")], [{ gastock: 4 }, { venstock: 19 }]);
    expect(groups).toHaveLength(2);
  });

  it("adds parts with unknown stock to the largest shipment", () => {
    expect(names(groupShipments([item("A"), item("B")], [null, null]))).toEqual([["A", "B"]]);
    expect(names(groupShipments([item("A"), item("B")], [{ gastock: 1 }, null]))).toEqual([["A", "B"]]);
  });

  it("ships a part on its own when no single warehouse can fill it", () => {
    expect(names(groupShipments([item("A", 4), item("B")], [{ gastock: 2, nystock: 2 }, { gastock: 1 }]))).toEqual([
      ["B"],
      ["A"],
    ]);
  });
});

describe("quoteShipping", () => {
  it("charges per shipment", () => {
    expect(quoteShipping([item("A"), item("B")], [{ gastock: 1 }, { gastock: 1 }])).toEqual({
      shippingCents: 799,
      shipments: 1,
      freightOnly: [],
    });
    expect(quoteShipping([item("A"), item("B")], [{ gastock: 1 }, { wastock: 1 }])).toMatchObject({
      shippingCents: 799 * 2,
      shipments: 2,
    });
  });

  it("lists freight-only parts", () => {
    const pallet: Parcel = { weightLb: 300, lengthIn: 48, widthIn: 40, heightIn: 40, fallbackLb: 5 };
    expect(quoteShipping([item("A"), item("BIG", 1, pallet)], [null, null]).freightOnly).toEqual(["BIG"]);
  });
});
