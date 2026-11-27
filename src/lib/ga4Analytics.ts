"use client";

import { getCanonicalProductId } from "@/lib/canonicalProductId";
import { sumCartLinesArrayCents } from "@/lib/priceCents";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type Ga4CartItem = Record<string, any> & {
  manufacturer?: string;
  category1?: string;
  category2?: string;
  partNumber?: string | number;
  part_number?: string | number;
  price?: string | number;
  quantity?: unknown;
  qtyInCart?: unknown;
};

type Ga4Line = {
  unitPriceCents: number;
  unitPriceDollars: number;
  quantity: number;
  valueDollars: number;
};

type Ga4ProductEventParams = {
  userId?: string;
  item: Ga4CartItem;
  line?: Ga4Line;
  quantity?: unknown;
  itemVariant?: string;
};

type Ga4CartEventParams = {
  userId?: string;
  cartItems: Ga4CartItem[];
  itemVariant?: string;
  valueCents?: number;
};

const GA4_CURRENCY = "USD";

const centsToDollars = (cents: unknown) => {
  const numericCents = Number(cents);
  if (!Number.isFinite(numericCents) || numericCents <= 0) {
    return 0;
  }
  return Number((numericCents / 100).toFixed(2));
};

const getItemQuantity = (item: Ga4CartItem, fallback = 1) => {
  const quantity = Number(item.qtyInCart ?? item.quantity ?? fallback);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : fallback;
};

const getLineFromCartItem = (item: Ga4CartItem): Ga4Line => {
  const unitPriceCents = Math.round(Number(item.price ?? item.value ?? 0) || 0);
  const quantity = getItemQuantity(item);
  const unitPriceDollars = centsToDollars(unitPriceCents);
  return {
    unitPriceCents,
    unitPriceDollars,
    quantity,
    valueDollars: Number((unitPriceDollars * quantity).toFixed(2)),
  };
};

const getProductLine = (
  item: Ga4CartItem,
  line?: Ga4Line,
  quantity?: unknown,
): Ga4Line => {
  if (line) {
    return line;
  }

  return getLineFromCartItem({
    ...item,
    qtyInCart: quantity ?? item.qtyInCart,
  });
};

const sendGa4Event = (eventName: string, payload: Record<string, unknown>) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", eventName, payload);
};

const buildGa4Item = (
  item: Ga4CartItem,
  line: Ga4Line,
  itemVariant?: string,
) => ({
  item_id: getCanonicalProductId(item),
  item_name: `${item.manufacturer ?? ""} ${item.category2 ?? ""} ${
    item.partNumber ?? item.part_number ?? ""
  }`.trim(),
  item_brand: item.manufacturer,
  item_category: item.category1,
  ...(itemVariant ? { item_variant: itemVariant } : {}),
  item_category2: item.category2,
  price: line.unitPriceDollars,
  quantity: line.quantity,
});

export const trackGa4PageView = ({
  userId,
  pageName,
}: {
  userId?: string;
  pageName: string;
}) => {
  sendGa4Event("page_view", {
    ...(userId ? { user_id: userId } : {}),
    page_name: pageName,
  });
};

export const trackGa4Login = ({ userId, method }: { userId?: string; method: string }) => {
  sendGa4Event("login", {
    ...(userId ? { user_id: userId } : {}),
    method,
  });
};

export const trackGa4SignUp = ({ userId, method }: { userId?: string; method: string }) => {
  sendGa4Event("sign_up", {
    ...(userId ? { user_id: userId } : {}),
    method,
  });
};

export const trackGa4Search = ({
  userId,
  searchTerm,
}: {
  userId?: string;
  searchTerm: string;
}) => {
  sendGa4Event("search", {
    ...(userId ? { user_id: userId } : {}),
    search_term: searchTerm,
  });
};

export const trackGa4RelatedSearchTerm = ({
  userId,
  relatedSearchTerm,
  sourceSearchTerm,
}: {
  userId?: string;
  relatedSearchTerm: string;
  sourceSearchTerm: string;
}) => {
  sendGa4Event("select_related_search_term", {
    ...(userId ? { user_id: userId } : {}),
    related_search_term: relatedSearchTerm,
    source_search_term: sourceSearchTerm,
  });
};

export const trackGa4AddVehicle = ({
  userId,
  make,
  model,
  engine,
  bodyType = "",
  color = "",
}: {
  userId?: string;
  make?: string;
  model?: string;
  engine?: unknown;
  bodyType?: string;
  color?: string;
}) => {
  sendGa4Event("add_vehicle", {
    ...(userId ? { user_id: userId } : {}),
    make,
    model,
    engine,
    bodyType,
    color,
  });
};

export const trackGa4ViewItem = ({
  userId,
  item,
  line,
  quantity,
  itemVariant,
}: Ga4ProductEventParams) => {
  const productLine = getProductLine(item, line, quantity);

  sendGa4Event("view_item", {
    ...(userId ? { user_id: userId } : {}),
    currency: GA4_CURRENCY,
    value: productLine.valueDollars,
    items: [buildGa4Item(item, productLine, itemVariant)],
  });
};

export const trackGa4AddToCart = ({
  userId,
  item,
  line,
  quantity,
  itemVariant,
}: Ga4ProductEventParams) => {
  const productLine = getProductLine(item, line, quantity);

  sendGa4Event("add_to_cart", {
    ...(userId ? { user_id: userId } : {}),
    currency: GA4_CURRENCY,
    value: productLine.valueDollars,
    items: [buildGa4Item(item, productLine, itemVariant)],
  });
};

export const trackGa4ViewCart = ({
  userId,
  cartItems,
  itemVariant,
}: Ga4CartEventParams) => {
  if (cartItems.length === 0) {
    return;
  }

  const items = cartItems.map((item) =>
    buildGa4Item(item, getLineFromCartItem(item), itemVariant),
  );
  const valueCents = sumCartLinesArrayCents(cartItems);

  sendGa4Event("view_cart", {
    ...(userId ? { user_id: userId } : {}),
    currency: GA4_CURRENCY,
    value: centsToDollars(valueCents),
    items,
  });
};

export const trackGa4BeginCheckout = ({
  userId,
  cartItems,
  itemVariant,
}: Ga4CartEventParams) => {
  if (cartItems.length === 0) {
    return;
  }

  const items = cartItems.map((item) =>
    buildGa4Item(item, getLineFromCartItem(item), itemVariant),
  );
  const valueCents = sumCartLinesArrayCents(cartItems);

  sendGa4Event("begin_checkout", {
    ...(userId ? { user_id: userId } : {}),
    currency: GA4_CURRENCY,
    value: centsToDollars(valueCents),
    items,
  });
};

/**
 * A step on the on-site checkout page, e.g. GA4's `add_shipping_info` / `add_payment_info`
 * or our own `checkout_payment_failed`. `cartItems` adds the standard value and items.
 */
export const trackGa4CheckoutStep = ({
  eventName,
  userId,
  cartItems = [],
  params = {},
}: {
  eventName: string;
  userId?: string;
  cartItems?: Ga4CartItem[];
  params?: Record<string, unknown>;
}) => {
  sendGa4Event(eventName, {
    ...(userId ? { user_id: userId } : {}),
    ...(cartItems.length > 0
      ? {
          currency: GA4_CURRENCY,
          value: centsToDollars(sumCartLinesArrayCents(cartItems)),
          items: cartItems.map((item) => buildGa4Item(item, getLineFromCartItem(item))),
        }
      : {}),
    ...params,
  });
};

export const trackGa4Purchase = ({
  userId,
  cartItems,
  itemVariant,
  valueCents,
}: Ga4CartEventParams) => {
  if (cartItems.length === 0) {
    return;
  }

  const items = cartItems.map((item) =>
    buildGa4Item(item, getLineFromCartItem(item), itemVariant),
  );

  sendGa4Event("purchase", {
    ...(userId ? { user_id: userId } : {}),
    currency: GA4_CURRENCY,
    value: centsToDollars(valueCents ?? sumCartLinesArrayCents(cartItems)),
    items,
  });
};
