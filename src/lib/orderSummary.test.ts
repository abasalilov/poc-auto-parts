import type Stripe from "stripe";
import { describe, expect, it } from "vitest";

import { toOrderSummary } from "./orderSummary";

const session = (overrides: Record<string, unknown> = {}) =>
  ({
    amount_total: 13_582,
    total_details: {
      amount_discount: 500,
      amount_tax: 1_576,
      amount_shipping: 0,
    },
    customer_details: { email: "pat@example.com", name: "Card Name" },
    collected_information: {
      shipping_details: {
        name: "Pat Smith",
        address: {
          line1: "1212 E Bethany Home Rd",
          line2: null,
          city: "Phoenix",
          state: "AZ",
          postal_code: "85014",
          country: "US",
        },
      },
    },
    line_items: {
      data: [
        { description: "Shipping", quantity: 1, amount_subtotal: 4_856 },
        {
          description: "WAGNER Brake Pad ZD1012A",
          quantity: 2,
          amount_subtotal: 5_194,
        },
        {
          description: "NATIONAL Crankshaft Seal 710837",
          quantity: 1,
          amount_subtotal: 546,
        },
      ],
    },
    ...overrides,
  }) as unknown as Stripe.Checkout.Session;

describe("toOrderSummary", () => {
  it("separates the shipping line from the parts", () => {
    const summary = toOrderSummary(session());
    expect(summary.lines.map((line) => line.name)).toEqual([
      "WAGNER Brake Pad ZD1012A",
      "NATIONAL Crankshaft Seal 710837",
    ]);
    expect(summary.subtotalCents).toBe(5_740);
    expect(summary.shippingCents).toBe(4_856);
  });

  it("reads tax, discount, total and the shipping contact", () => {
    const summary = toOrderSummary(session());
    expect(summary).toMatchObject({
      discountCents: 500,
      taxCents: 1_576,
      totalCents: 13_582,
      email: "pat@example.com",
      firstName: "Pat",
      address: {
        name: "Pat Smith",
        line2: "",
        city: "Phoenix",
        postalCode: "85014",
      },
    });
  });

  it("skips initials as a first name", () => {
    const base = session();
    const summary = toOrderSummary({
      ...base,
      collected_information: {
        shipping_details: { ...base.collected_information!.shipping_details!, name: "I B" },
      },
    } as Stripe.Checkout.Session);
    expect(summary.firstName).toBe("");
  });

  it("treats a missing shipping line as free shipping", () => {
    const summary = toOrderSummary(
      session({
        line_items: {
          data: [
            {
              description: "BOSCH Brake Pad BC1058",
              quantity: 1,
              amount_subtotal: 21_000,
            },
          ],
        },
      }),
    );
    expect(summary.shippingCents).toBe(0);
    expect(summary.subtotalCents).toBe(21_000);
  });
});
