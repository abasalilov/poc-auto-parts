//multiples
export const CARTS = "carts";
export const USERS = "users";
export const VEHICLES = "vehicles";
export const ORDERS = "orders";
export const SEARCHES = "searches";

// singles
export const PART = "part";
export const ENGINE = "engine";
export const MAKE = "make";
export const MODEL = "model";
export const TITLE = "title";
export const YEAR = "year";

// firestore document/query properties
export const AUTHOR = "author";
export const ID = "id";
export const ENGINE_ID = "engine_id";
export const CATEGORY_1 = "category_1";
export const MODEL_ID = "modelId";
export const PART_KEY = "partkey";
export const STRIPE_SESSION_ID = "stripeSessionId";

// Shipping — single source of truth for site-wide consistency
/** NaN for a missing or blank value, so callers fall back to their default instead of $0. */
const parseEnvDollars = (value: string | undefined) => {
  const cleaned = (value ?? "").trim().replace(/[$,\s]/g, "");
  return cleaned ? Number(cleaned) : NaN;
};

const shippingCostDollars = parseEnvDollars(
  process.env.SHIPPING_COST ?? process.env.NEXT_PUBLIC_SHIPPING_COST,
);
export const SHIPPING_COST_CENTS =
  Number.isFinite(shippingCostDollars) && shippingCostDollars >= 0
    ? Math.round(shippingCostDollars * 100)
    : 1999;

const freeShippingThresholdDollars = parseEnvDollars(
  process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD ??
    process.env.FREE_SHIPPING_THRESHOLD,
);
/** Subtotal at or above this amount (cents) qualifies for free shipping. Default $200. */
export const FREE_SHIPPING_THRESHOLD_CENTS =
  Number.isFinite(freeShippingThresholdDollars) && freeShippingThresholdDollars > 0
    ? Math.round(freeShippingThresholdDollars * 100)
    : 20000;
export const FREE_SHIPPING_THRESHOLD_DOLLARS = FREE_SHIPPING_THRESHOLD_CENTS / 100;
export const SHIPPING_LABEL = "FedEx 3–5 Day Ground Shipping";
export const SHIPPING_DESCRIPTION =
  "With over 20 distribution centers nationwide, we ensure that your order is shipped from the nearest center to your location for fast delivery. We offer FedEx 3–5 Day Ground Shipping.";

/** Set NEXT_PUBLIC_CHECKOUT_MODE=hosted to send shoppers to Stripe's hosted page instead of /checkout. */
export const CHECKOUT_MODE: "onsite" | "hosted" =
  process.env.NEXT_PUBLIC_CHECKOUT_MODE === "hosted" ? "hosted" : "onsite";
