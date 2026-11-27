import type Stripe from "stripe";

export interface OrderSummaryLine {
  name: string;
  quantity: number;
  totalCents: number;
}

export interface OrderSummaryAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}

/** What the order confirmation page shows, read from the paid Stripe Checkout Session. */
export interface OrderSummary {
  lines: OrderSummaryLine[];
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  email: string;
  firstName: string;
  address: OrderSummaryAddress | null;
}

const SHIPPING_LINE_NAME = "Shipping";

export const toOrderSummary = (
  session: Stripe.Checkout.Session,
): OrderSummary => {
  const items = session.line_items?.data ?? [];
  const shippingItem = items.find(
    (item) => item.description === SHIPPING_LINE_NAME,
  );
  const lines = items
    .filter((item) => item !== shippingItem)
    .map((item) => ({
      name: item.description ?? "",
      quantity: item.quantity ?? 1,
      totalCents: item.amount_subtotal,
    }));
  const shipping = session.collected_information?.shipping_details;
  const name = shipping?.name || session.customer_details?.name || "";
  const firstName = name.trim().split(/\s+/)[0] ?? "";

  return {
    lines,
    subtotalCents: lines.reduce((sum, line) => sum + line.totalCents, 0),
    shippingCents: shippingItem?.amount_subtotal ?? 0,
    discountCents: session.total_details?.amount_discount ?? 0,
    taxCents: session.total_details?.amount_tax ?? 0,
    totalCents: session.amount_total ?? 0,
    email: session.customer_details?.email ?? "",
    firstName: firstName.length > 1 ? firstName : "",
    address: shipping
      ? {
          name: shipping.name ?? "",
          line1: shipping.address.line1 ?? "",
          line2: shipping.address.line2 ?? "",
          city: shipping.address.city ?? "",
          state: shipping.address.state ?? "",
          postalCode: shipping.address.postal_code ?? "",
        }
      : null,
  };
};
