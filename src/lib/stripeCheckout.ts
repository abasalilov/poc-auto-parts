import { SHIPPING_LABEL } from "@/lib/constants";
import { normalizePriceCents } from "@/lib/priceCents";

interface CheckoutCartItem {
  manufacturer?: string;
  category2?: string;
  partNumber?: string;
  price?: number;
  quantity?: number;
}

export interface StripeCheckoutLineItem {
  price_data: {
    currency: string;
    unit_amount: number;
    tax_behavior: "exclusive";
    product_data: {
      name: string;
      description: string;
    };
  };
  quantity: number;
}

export const SHIPPING_LINE_NAME = "Shipping";

export const shippingLineItem = (shippingCost: number): StripeCheckoutLineItem => ({
  price_data: {
    currency: "USD",
    unit_amount: shippingCost,
    tax_behavior: "exclusive",
    product_data: {
      name: SHIPPING_LINE_NAME,
      description: SHIPPING_LABEL,
    },
  },
  quantity: 1,
});

export const prepareStripeCheckoutLineItems = (
  parts: CheckoutCartItem[],
  shippingCost: number,
): StripeCheckoutLineItem[] => {
  const items: StripeCheckoutLineItem[] = [];

  if (shippingCost > 0) {
    items.push(shippingLineItem(shippingCost));
  }

  parts.forEach((part) => {
    const partTitle = `${part.manufacturer} ${part.category2} ${part.partNumber}`.trim();

    items.push({
      price_data: {
        currency: "USD",
        unit_amount: normalizePriceCents(part.price),
        tax_behavior: "exclusive",
        product_data: {
          name: partTitle,
          description: partTitle,
        },
      },
      quantity: Number(part.quantity) || 1,
    });
  });

  return items;
};
