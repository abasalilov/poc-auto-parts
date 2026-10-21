// TODO(Aleksandr): PLACEHOLDER. This file was on the list for push 16 but it doesn't exist in
// parts-pass-web-app (checked 2026-10-21). It stays as a stub until the real source is found or written.
//
// What's known:
// - Nothing in parts-pass-web-app imports "@/lib/shipping". Shipping prices and rules currently live in
//   src/lib/shippingRates.ts (SHIPPING_TIERS, DIM_DIVISOR, MAX_BOX_LB, LONG_OR_HEAVY, FREIGHT_LIMITS,
//   REMOTE_STATES / REMOTE_MULTIPLIER, HANDLING_DAYS, TRANSIT_DAYS, SHIP_CUTOFF, billableLb(),
//   shipmentCents(), isFreightOnly(), remoteShippingCents()). Parcel helpers are in
//   src/lib/shippingParcels.ts, and the cart hook is in src/lib/useCartShipping.ts.
// - src/app/api/shipping-countdown/route.ts (in this push) imports SHIP_CUTOFF and TRANSIT_DAYS from
//   "@/lib/shippingRates", NOT from this file. shippingRates.ts isn't in this repo yet, so the route
//   won't type-check until it's published.
//
// TODO: decide which of these to do:
//   1. "shipping.ts" was meant to be shippingRates.ts. Publish src/lib/shippingRates.ts (plus
//      shippingRates.test.ts and shippingParcels.ts) in a later push and delete this stub.
//   2. A new module was planned (e.g. a free-shipping threshold for FreeShippingBanner, such as
//      FREE_SHIPPING_MIN_CENTS and a helper like amountToFreeShippingCents(subtotalCents)). Write it here,
//      basing the shipping math on shippingRates.ts, with unit tests next to it (shipping.test.ts, Vitest).
//   3. Not needed. Delete this file.
//
// It intentionally exports nothing, so it can't change behavior or break the build.
export {};
