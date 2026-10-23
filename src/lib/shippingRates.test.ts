import { describe, expect, it } from "vitest";

import {
  billableLb,
  FALLBACK_BILLABLE_LB,
  isFreightOnly,
  isLongOrHeavy,
  isRemoteState,
  remoteShippingCents,
  shipmentCents,
  type Parcel,
} from "./shippingRates";

const box = (weightLb: number, lengthIn: number, widthIn: number, heightIn: number): Parcel => ({
  weightLb,
  lengthIn,
  widthIn,
  heightIn,
  fallbackLb: FALLBACK_BILLABLE_LB,
});
const unknown = (fallbackLb = FALLBACK_BILLABLE_LB, weightLb: number | null = null): Parcel => ({
  weightLb,
  lengthIn: null,
  widthIn: null,
  heightIn: null,
  fallbackLb,
});

describe("billableLb", () => {
  it("uses actual weight or dimensional weight, whichever is greater, rounded up", () => {
    expect(billableLb([{ parcel: box(0.4, 4, 4, 2), quantity: 1 }])).toBe(1);
    expect(billableLb([{ parcel: box(2.2, 6, 6, 6), quantity: 1 }])).toBe(3);
    // 20×20×10 = 4000 in³ ÷ 139 = 28.8 lb, far more than the 6 lb it weighs.
    expect(billableLb([{ parcel: box(6, 20, 20, 10), quantity: 1 }])).toBe(29);
  });

  it("rounds each side up to a whole inch", () => {
    expect(billableLb([{ parcel: box(1, 11.2, 11.2, 11.2), quantity: 1 }])).toBe(Math.ceil(1728 / 139));
  });

  it("combines everything in the shipment into one box", () => {
    expect(
      billableLb([
        { parcel: box(0.5, 4, 4, 2), quantity: 3 },
        { parcel: box(2, 10, 6, 4), quantity: 1 },
      ]),
    ).toBe(Math.ceil(Math.max(3.5, (32 * 3 + 240) / 139)));
  });

  it("uses the category median when dimensions are missing, but never less than the known weight", () => {
    expect(billableLb([{ parcel: unknown(1.5), quantity: 2 }])).toBe(3);
    expect(billableLb([{ parcel: unknown(1.5, 12), quantity: 1 }])).toBe(12);
  });
});

describe("shipmentCents", () => {
  it("prices by billable weight tier", () => {
    expect(shipmentCents([])).toBe(0);
    expect(shipmentCents([{ parcel: box(0.4, 4, 4, 2), quantity: 1 }])).toBe(799);
    expect(shipmentCents([{ parcel: box(2.5, 6, 6, 6), quantity: 1 }])).toBe(1199);
    expect(shipmentCents([{ parcel: box(8, 12, 10, 6), quantity: 1 }])).toBe(1599);
    expect(shipmentCents([{ parcel: box(15, 12, 10, 6), quantity: 1 }])).toBe(1999);
    expect(shipmentCents([{ parcel: box(35, 30, 20, 6), quantity: 1 }])).toBe(2999);
    expect(shipmentCents([{ parcel: unknown(), quantity: 1 }])).toBe(1599);
  });

  it("adds the long-or-heavy surcharge once per shipment", () => {
    const long = box(10, 50, 6, 6);
    expect(shipmentCents([{ parcel: long, quantity: 1 }])).toBe(1999 + 3000);
    expect(
      shipmentCents([
        { parcel: long, quantity: 1 },
        { parcel: box(0.4, 4, 4, 2), quantity: 1 },
      ]),
    ).toBe(1999 + 3000);
  });

  it("prices a shipment over 150 lb as several boxes", () => {
    // 4 × 45 lb = 180 lb: one full 150 lb box plus a 30 lb box.
    expect(shipmentCents([{ parcel: box(45, 20, 12, 10), quantity: 4 }])).toBe(6099 + 2999);
    expect(shipmentCents([{ parcel: box(55, 20, 12, 10), quantity: 1 }])).toBe(3999 + 3000);
  });
});

describe("size limits", () => {
  it("flags long or heavy parts", () => {
    expect(isLongOrHeavy(box(51, 10, 10, 10))).toBe(true);
    expect(isLongOrHeavy(box(5, 49, 4, 4))).toBe(true);
    expect(isLongOrHeavy(box(50, 48, 4, 4))).toBe(false);
    expect(isLongOrHeavy(unknown())).toBe(false);
  });

  it("marks parts FedEx Ground can't take as freight-only", () => {
    expect(isFreightOnly(box(151, 20, 20, 20))).toBe(true);
    expect(isFreightOnly(box(20, 109, 6, 6))).toBe(true);
    expect(isFreightOnly(box(60, 70, 30, 20))).toBe(true);
    expect(isFreightOnly(box(60, 70, 20, 20))).toBe(false);
    expect(isFreightOnly(unknown(200))).toBe(false);
  });
});

describe("remote addresses", () => {
  it("recognizes Alaska, Hawaii and territories", () => {
    expect(isRemoteState("ak")).toBe(true);
    expect(isRemoteState(" HI ")).toBe(true);
    expect(isRemoteState("PR")).toBe(true);
    expect(isRemoteState("CA")).toBe(false);
    expect(isRemoteState(null)).toBe(false);
  });

  it("charges 2.5 times, rounded up to .99", () => {
    expect(remoteShippingCents(799)).toBe(1999);
    expect(remoteShippingCents(1599)).toBe(3999);
    expect(remoteShippingCents(800)).toBe(2099);
    expect(remoteShippingCents(0)).toBe(0);
  });
});
