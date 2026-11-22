"use server";

import { headers } from "next/headers";
import Stripe from "stripe";

import { checkoutReturnPath, normalizeCheckoutLines } from "@/lib/checkoutLines";
import { priceCheckoutLines, type PricedCheckoutPart } from "@/lib/checkoutPricing";
import { toOrderSummary, type OrderSummary } from "@/lib/orderSummary";
import { isRemoteState, remoteShippingCents } from "@/lib/shippingRates";
import { SHIPPING_LINE_NAME, shippingLineItem } from "@/lib/stripeCheckout";

const getSiteUrl = () => {
  if (process.env.NODE_ENV === "development") {
    const host = headers().get("host");
    if (host) return `http://${host}`;
  }
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    configuredSiteUrl && !configuredSiteUrl.includes("cloudfunctions.net")
      ? configuredSiteUrl
      : "https://www.partspass.app"
  ).replace(/\/$/, "");
};

const getStripe = () => {
  const stripeApiKey = process.env.STRIPE_API_KEY;
  if (!stripeApiKey) {
    throw new Error("Missing STRIPE_API_KEY.");
  }
  return new Stripe(stripeApiKey);
};

const SESSION_OPTIONS = {
  automatic_tax: { enabled: true },
  mode: "payment",
  shipping_address_collection: { allowed_countries: ["US"] },
  customer_creation: "always",
  allow_promotion_codes: true,
} satisfies Partial<Stripe.Checkout.SessionCreateParams>;

export type CheckoutResult<T> =
  | ({ ok: true; parts: PricedCheckoutPart[] } & T)
  | { ok: false; error: "invalid" | "unavailable" | "freight"; unavailable?: string[] };

const priceLines = async (lines: unknown) => {
  const normalized = normalizeCheckoutLines(lines);
  if (!normalized) return { ok: false as const, error: "invalid" as const };
  const priced = await priceCheckoutLines(normalized);
  if (!priced.ok) {
    return { ok: false as const, error: priced.reason, unavailable: priced.unavailable };
  }
  return priced;
};

/** Read back by updateCheckoutShipping, which reprices shipping once the address is known. */
const shippingMetadata = (priced: { shippingCents: number; shipments: number }) => ({
  shipping_base_cents: String(priced.shippingCents),
  shipments: String(priced.shipments),
});

/** Hosted Stripe Checkout, priced from the catalog rather than the browser's cart. */
export async function createCheckoutSession(
  lines: unknown,
  returnPath?: unknown,
): Promise<CheckoutResult<{ sessionId: string; url: string }>> {
  const priced = await priceLines(lines);
  if (!priced.ok) return priced;

  const siteUrl = getSiteUrl();
  const session = await getStripe().checkout.sessions.create({
    ...SESSION_OPTIONS,
    success_url: `${siteUrl}/orders/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}${checkoutReturnPath(returnPath)}`,
    line_items: priced.lineItems,
    metadata: shippingMetadata(priced),
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return { ok: true, parts: priced.parts, sessionId: session.id, url: session.url };
}

const createElementsSession = async (
  lines: unknown,
  extra: Partial<Stripe.Checkout.SessionCreateParams> = {},
): Promise<CheckoutResult<{ clientSecret: string; sessionId: string }>> => {
  const priced = await priceLines(lines);
  if (!priced.ok) return priced;

  const session = await getStripe().checkout.sessions.create({
    ...SESSION_OPTIONS,
    ...extra,
    return_url: `${getSiteUrl()}/orders/{CHECKOUT_SESSION_ID}`,
    line_items: priced.lineItems,
    metadata: shippingMetadata(priced),
    ui_mode: "elements",
  });

  if (!session.client_secret) {
    throw new Error("Stripe did not return a client secret.");
  }

  return { ok: true, parts: priced.parts, clientSecret: session.client_secret, sessionId: session.id };
};

/** Session for the on-site /checkout page; payment methods come from the Stripe dashboard. */
export async function createOnSiteCheckoutSession(lines: unknown) {
  return createElementsSession(lines);
}

/** Embedded session for the express (Apple Pay / Google Pay) buttons, priced the same way. */
export async function createStripeExpressCheckoutSession(lines: unknown) {
  return createElementsSession(lines, { payment_method_types: ["card"] });
}

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

/**
 * Sets the on-site session's shipping line for the delivery state: the remote price for Alaska,
 * Hawaii and territories, the normal price otherwise. The state comes from the session's own
 * address, or from the browser for wallet payments, whose address Stripe only has at confirmation.
 */
export async function updateCheckoutShipping(
  sessionId: unknown,
  state: unknown,
): Promise<{ ok: boolean; remote: boolean; shippingCents: number }> {
  if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) {
    return { ok: false, remote: false, shippingCents: 0 };
  }
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
  const baseCents = Number(session.metadata?.shipping_base_cents);
  if (session.status !== "open" || !Number.isFinite(baseCents) || baseCents <= 0) {
    return { ok: false, remote: false, shippingCents: 0 };
  }

  const remote =
    isRemoteState(session.collected_information?.shipping_details?.address?.state) ||
    isRemoteState(typeof state === "string" ? state : "");
  const shippingCents = remote ? remoteShippingCents(baseCents) : baseCents;
  const items = session.line_items?.data ?? [];
  const shipping = items.find((item) => item.description === SHIPPING_LINE_NAME);
  if (shipping?.amount_subtotal === shippingCents) return { ok: true, remote, shippingCents };

  await stripe.checkout.sessions.update(sessionId, {
    line_items: [
      ...items.filter((item) => item !== shipping).map((item) => ({ id: item.id, quantity: item.quantity ?? 1 })),
      shippingLineItem(shippingCents),
    ],
  });
  return { ok: true, remote, shippingCents };
}

/** The paid order for the confirmation page; "pending" while the session isn't complete yet. */
export async function getOrderSummary(
  sessionId: unknown,
): Promise<{ status: "paid"; summary: OrderSummary } | { status: "pending" | "invalid" }> {
  if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) return { status: "invalid" };
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    if (session.status !== "complete") return { status: "pending" };
    return { status: "paid", summary: toOrderSummary(session) };
  } catch (error) {
    console.log("getOrderSummary error", error);
    return { status: "invalid" };
  }
}
