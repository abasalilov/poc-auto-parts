"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckoutElementsProvider,
  ExpressCheckoutElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";
import {
  loadStripe,
  type StripeCheckoutExpressCheckoutElementOptions,
} from "@stripe/stripe-js";

import { createStripeExpressCheckoutSession } from "@/actions/checkout";
import { useCart } from "@/context/CartContext";
import { withCheckoutPrices, type CheckoutLine } from "@/lib/checkoutLines";
import type { PricedCheckoutPart } from "@/lib/checkoutPricing";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
  : null;

const expressCheckoutOptions = {
  buttonHeight: 52,
  layout: {
    maxColumns: 2,
    maxRows: 1,
    overflow: "auto",
  },
  paymentMethodOrder: ["applePay", "googlePay"],
  buttonType: {
    applePay: "check-out",
    googlePay: "checkout",
  },
  buttonTheme: {
    applePay: "black",
    googlePay: "black",
  },
  paymentMethods: {
    applePay: "always",
    googlePay: "always",
  },
} as const satisfies StripeCheckoutExpressCheckoutElementOptions;

interface ExpressCheckoutSessionData {
  clientSecret: string;
  sessionId: string;
  parts: PricedCheckoutPart[];
}

const expressCheckoutSessionCache = new Map<string, ExpressCheckoutSessionData>();
const expressCheckoutSessionRequestCache = new Map<
  string,
  Promise<ExpressCheckoutSessionData>
>();

const getOrCreateExpressCheckoutSession = async (
  lineItemsKey: string,
  lines: CheckoutLine[],
) => {
  const cachedSession = expressCheckoutSessionCache.get(lineItemsKey);
  if (cachedSession) {
    return cachedSession;
  }

  const pendingRequest = expressCheckoutSessionRequestCache.get(lineItemsKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  const nextRequest = createStripeExpressCheckoutSession(lines)
    .then((result) => {
      if (!result.ok) {
        throw new Error(`Express checkout unavailable: ${result.error}`);
      }
      const nextSession = {
        clientSecret: result.clientSecret,
        sessionId: result.sessionId,
        parts: result.parts,
      };
      expressCheckoutSessionCache.set(lineItemsKey, nextSession);
      return nextSession;
    })
    .finally(() => {
      expressCheckoutSessionRequestCache.delete(lineItemsKey);
    });

  expressCheckoutSessionRequestCache.set(lineItemsKey, nextRequest);

  return nextRequest;
};

export const prefetchExpressCheckoutSession = async (lines: CheckoutLine[]) => {
  if (!stripePromise || lines.length === 0) {
    return null;
  }

  return getOrCreateExpressCheckoutSession(JSON.stringify(lines), lines);
};

interface ExpressCheckoutButtonsProps {
  cartItems: any[];
  disabled: boolean;
  lines: CheckoutLine[];
  onCheckoutStart: () => void;
  onCheckoutReadyReset: () => void;
}

function ExpressCheckoutContent({
  cartItems,
  onCheckoutReadyReset,
  onCheckoutStart,
  session,
}: {
  cartItems: any[];
  onCheckoutReadyReset: () => void;
  onCheckoutStart: () => void;
  session: ExpressCheckoutSessionData;
}) {
  const checkoutState = useCheckout();
  const { saveCart, setStartedCheckout } = useCart();
  const [hasAvailableWallets, setHasAvailableWallets] = useState(false);
  const [readyResolved, setReadyResolved] = useState(false);

  const handleConfirm = async (event: any) => {
    if (checkoutState.type !== "success") {
      onCheckoutReadyReset();
      return;
    }

    onCheckoutStart();

    try {
      const cartSaved = await saveCart(
        withCheckoutPrices(cartItems, session.parts),
        session.sessionId,
      );
      if (!cartSaved) {
        onCheckoutReadyReset();
        return;
      }

      setStartedCheckout(true);
      await checkoutState.checkout.confirm({ expressCheckoutConfirmEvent: event });
    } catch (error) {
      console.log("express checkout confirmation error", error);
      onCheckoutReadyReset();
    }
  };

  return (
    <div
      className="mt-3"
      style={{
        display: readyResolved && hasAvailableWallets ? "block" : "none",
      }}
    >
      <ExpressCheckoutElement
        options={expressCheckoutOptions}
        onConfirm={handleConfirm}
        onReady={({ availablePaymentMethods }: any) => {
          setReadyResolved(true);
          setHasAvailableWallets(Boolean(availablePaymentMethods));
        }}
      />
    </div>
  );
}

export default function ExpressCheckoutButtons({
  cartItems,
  disabled,
  lines,
  onCheckoutStart,
  onCheckoutReadyReset,
}: ExpressCheckoutButtonsProps) {
  const [session, setSession] = useState<ExpressCheckoutSessionData | null>(null);
  const lineItemsKey = useMemo(() => JSON.stringify(lines), [lines]);

  useEffect(() => {
    if (!stripePromise || disabled || lines.length === 0) {
      setSession(null);
      return;
    }

    let cancelled = false;

    const createSession = async () => {
      try {
        const nextSession = await getOrCreateExpressCheckoutSession(
          lineItemsKey,
          lines,
        );
        if (!cancelled) {
          setSession(nextSession);
        }
      } catch (error) {
        console.log("express checkout session error", error);
        if (!cancelled) {
          setSession(null);
        }
      }
    };

    void createSession();

    return () => {
      cancelled = true;
    };
  }, [disabled, lines, lineItemsKey]);

  if (!stripePromise || !session?.clientSecret) {
    return null;
  }

  return (
    <CheckoutElementsProvider
      key={session.clientSecret}
      stripe={stripePromise}
      options={{ clientSecret: session.clientSecret }}
    >
      <ExpressCheckoutContent
        cartItems={cartItems}
        onCheckoutReadyReset={onCheckoutReadyReset}
        onCheckoutStart={onCheckoutStart}
        session={session}
      />
    </CheckoutElementsProvider>
  );
}
