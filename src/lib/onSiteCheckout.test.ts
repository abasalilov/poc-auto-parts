import { describe, expect, it } from "vitest";

import {
  checkoutLinesKey,
  isStoredCheckoutCurrent,
  parseStoredCheckout,
  type StoredCheckout,
} from "./onSiteCheckout";

const brakes = { productLine: "WAG", partNumber: "ZD1012A", quantity: 1 };
const battery = { productLine: "BOS", partNumber: "BC1058", quantity: 2 };

const stored = (overrides: Partial<StoredCheckout> = {}): StoredCheckout => ({
  clientSecret: "cs_secret",
  sessionId: "cs_test_1",
  items: [brakes, battery],
  returnPath: "/",
  source: "cart",
  authorUid: "user-1",
  linesKey: checkoutLinesKey([brakes, battery]),
  createdAt: 1_000,
  ...overrides,
});

describe("checkoutLinesKey", () => {
  it("ignores item order", () => {
    expect(checkoutLinesKey([brakes, battery])).toBe(
      checkoutLinesKey([battery, brakes]),
    );
  });

  it("changes with quantity", () => {
    expect(checkoutLinesKey([brakes])).not.toBe(
      checkoutLinesKey([{ ...brakes, quantity: 2 }]),
    );
  });
});

describe("parseStoredCheckout", () => {
  it("round-trips a stored checkout", () => {
    expect(parseStoredCheckout(JSON.stringify(stored()))).toEqual(stored());
  });

  it("rejects missing or malformed data", () => {
    expect(parseStoredCheckout(null)).toBeNull();
    expect(parseStoredCheckout("not json")).toBeNull();
    expect(
      parseStoredCheckout(JSON.stringify({ ...stored(), items: [] })),
    ).toBeNull();
    expect(
      parseStoredCheckout(JSON.stringify({ ...stored(), clientSecret: 1 })),
    ).toBeNull();
  });

  it("only keeps same-site return paths", () => {
    const parsed = parseStoredCheckout(
      JSON.stringify(stored({ returnPath: "https://evil.example" })),
    );
    expect(parsed?.returnPath).toBe("/");
  });
});

describe("isStoredCheckoutCurrent", () => {
  const context = { uid: "user-1", cartItems: [battery, brakes], now: 2_000 };

  it("reuses a checkout for the same shopper and cart", () => {
    expect(isStoredCheckoutCurrent(stored(), context)).toBe(true);
  });

  it("starts over when the shopper signs in as someone else", () => {
    expect(
      isStoredCheckoutCurrent(stored(), { ...context, uid: "user-2" }),
    ).toBe(false);
  });

  it("starts over when the cart changed", () => {
    expect(
      isStoredCheckoutCurrent(stored(), { ...context, cartItems: [brakes] }),
    ).toBe(false);
  });

  it("ignores the cart for Buy now checkouts", () => {
    const buyNow = stored({
      source: "buyNow",
      items: [brakes],
      linesKey: checkoutLinesKey([brakes]),
    });
    expect(isStoredCheckoutCurrent(buyNow, context)).toBe(true);
  });

  it("starts over before Stripe expires the session", () => {
    expect(
      isStoredCheckoutCurrent(stored(), {
        ...context,
        now: 24 * 60 * 60 * 1000,
      }),
    ).toBe(false);
  });
});
