"use client";

import { useEffect, useState } from "react";

import { quoteCartShipping } from "@/actions/shipping";
import { toCheckoutLines } from "@/lib/checkoutLines";
import { checkoutLinesKey } from "@/lib/onSiteCheckout";
import type { ShippingQuote } from "@/lib/shipments";

export type CartShipping =
  | { status: "empty" | "loading" | "error" }
  | ({ status: "ready" } & ShippingQuote);

const quotes = new Map<string, Promise<CartShipping>>();

const fetchQuote = (key: string, items: Record<string, any>[]) => {
  let quote = quotes.get(key);
  if (!quote) {
    quote = quoteCartShipping(toCheckoutLines(items))
      .then((result): CartShipping => (result.ok ? { ...result, status: "ready" } : { status: "error" }))
      .catch((): CartShipping => ({ status: "error" }));
    quotes.set(key, quote);
    void quote.then((result) => result.status === "error" && quotes.delete(key));
  }
  return quote;
};

/** Shipping for the cart as checkout will charge it; refetched only when the lines change. */
export const useCartShipping = (items: Record<string, any>[]): CartShipping => {
  const key = checkoutLinesKey(items);
  const [state, setState] = useState<{ key: string; shipping: CartShipping }>({
    key: "",
    shipping: { status: "empty" },
  });

  useEffect(() => {
    if (!key) return;
    let current = true;
    void fetchQuote(key, items).then((shipping) => current && setState({ key, shipping }));
    return () => {
      current = false;
    };
    // Items are read only when their key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!key) return { status: "empty" };
  return state.key === key ? state.shipping : { status: "loading" };
};
