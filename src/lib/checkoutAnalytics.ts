"use client";

import { trackGa4BeginCheckout } from "@/lib/ga4Analytics";
import { trackMetaInitiateCheckout } from "@/lib/metaPixel";

interface CheckoutAnalyticsItem extends Record<string, unknown> {
  value?: string | number;
  price?: string | number;
  qtyInCart?: string | number;
  quantity?: string | number;
  manufacturer?: string;
  category1?: string;
  category2?: string;
  partNumber?: string | number;
}

interface TrackCheckoutStartedParams {
  cartItems: CheckoutAnalyticsItem[];
  userId?: string;
  itemVariant?: string;
  metaValueCents?: number;
}

export const trackCheckoutStarted = ({
  cartItems,
  userId,
  itemVariant,
  metaValueCents,
}: TrackCheckoutStartedParams) => {
  if (typeof window === "undefined" || cartItems.length === 0) {
    return;
  }

  trackGa4BeginCheckout({ cartItems, userId, itemVariant });

  trackMetaInitiateCheckout(cartItems, metaValueCents);
};
