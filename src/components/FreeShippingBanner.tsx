"use client";

// TODO(Aleksandr): PLACEHOLDER. This component was on the list for push 16 but it doesn't exist in
// parts-pass-web-app (checked 2026-10-21). It renders nothing until it's implemented.
//
// What's known:
// - Nothing in parts-pass-web-app imports or renders a FreeShippingBanner today.
// - The shipping UI that exists is ShippingCountdownBanner.tsx (in this push). It polls
//   /api/shipping-countdown every 60s and shows the "order in the next X to ship today" line, either as a
//   banner or inline in CartTotals.
// - Shipping is currently always charged. src/lib/shippingRates.ts prices by billable weight (FedEx
//   Ground tiers, long/heavy surcharge, x2.5 for remote states) and has no free-shipping threshold.
//
// TODO before building this:
//   - Decide the business rule: the free-shipping minimum (subtotal in cents), whether it covers remote
//     states (AK/HI/territories/military), and whether long/heavy or freight-only parts are excluded.
//   - Put the rule in one place (src/lib/shipping.ts or shippingRates.ts) and apply it to the real
//     price everywhere: checkoutPricing.ts, useCartShipping.ts, the Stripe line items, and the merchant
//     feed's shipping field. Otherwise the banner will promise something checkout doesn't charge.
//   - UI: show "You're $X away from free shipping" with a progress bar in the cart/CartTotals and on
//     BuyBox. Show "You've unlocked free shipping" once the subtotal qualifies. Match the amber card style
//     of ShippingCountdownBanner.
//   - Props idea: { subtotalCents: number; inline?: boolean }.
//   - Tests: the threshold math in the lib, not in this component.
//   - If free shipping isn't planned, delete this file and drop the name from the push list.

type Props = {
  /** Cart subtotal in cents (TODO: confirm whether discounts count toward the threshold). */
  subtotalCents?: number;
  /** Render as a single line inside CartTotals, like ShippingCountdownBanner's inline mode. */
  inline?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function FreeShippingBanner(_props: Props) {
  // TODO: implement once the free-shipping rule exists (see notes above).
  return null;
}
