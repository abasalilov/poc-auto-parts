"use client";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { CheckoutElementsProvider } from "@stripe/react-stripe-js/checkout";
import { loadStripe } from "@stripe/stripe-js";
import { useShoppingCart } from "use-shopping-cart";

import CheckoutForm from "./CheckoutForm";
import { useCart } from "@/context/CartContext";
import { UserContext } from "@/context/UserContext";
import { trackGa4CheckoutStep } from "@/lib/ga4Analytics";
import {
  isStoredCheckoutCurrent,
  readStoredCheckout,
  type StoredCheckout,
} from "@/lib/onSiteCheckout";
import partsPassHeader from "../../../public/parts_pass_logo_white.png";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
  : null;

const appearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#1759C1",
    colorText: "#111827",
    colorDanger: "#dc2626",
    fontFamily: "Montserrat, system-ui, sans-serif",
    borderRadius: "8px",
  },
};

const fonts = [
  {
    cssSrc:
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap",
  },
];

type Status = "loading" | "ready" | "empty" | "failed";

export default function CheckoutPage() {
  const { user } = useContext(UserContext);
  const { cartDetails } = useShoppingCart();
  const { onSiteCheckout, startOnSiteCheckout, checkoutError } = useCart();
  const [checkout, setCheckout] = useState<StoredCheckout | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const startingRef = useRef(false);
  const viewedSessionRef = useRef<string | null>(null);
  const uid: string | undefined = user?.uid;
  const email: string | undefined = user?.isAnonymous
    ? undefined
    : (user?.email ?? undefined);

  const start = useCallback(
    async (
      items: any[],
      returnPath: string,
      source: StoredCheckout["source"],
    ) => {
      if (startingRef.current) return;
      startingRef.current = true;
      setStatus("loading");
      const started = await startOnSiteCheckout(items, returnPath, source);
      startingRef.current = false;
      setCheckout(started);
      setStatus(started ? "ready" : "failed");
    },
    [startOnSiteCheckout],
  );

  useEffect(() => {
    if (!uid || startingRef.current || status === "failed") return;
    const cartItems = Object.values(cartDetails ?? {});
    const existing = checkout ?? onSiteCheckout ?? readStoredCheckout();
    if (
      existing &&
      isStoredCheckoutCurrent(existing, { uid, cartItems, now: Date.now() })
    ) {
      if (checkout?.sessionId !== existing.sessionId) setCheckout(existing);
      if (status !== "ready") setStatus("ready");
      return;
    }
    const items = existing?.source === "buyNow" ? existing.items : cartItems;
    if (items.length === 0) {
      if (status !== "empty") setStatus("empty");
      return;
    }
    void start(items, existing?.returnPath ?? "/", existing?.source ?? "cart");
  }, [uid, cartDetails, checkout, onSiteCheckout, start, status]);

  useEffect(() => {
    if (
      status !== "ready" ||
      !checkout ||
      viewedSessionRef.current === checkout.sessionId
    )
      return;
    viewedSessionRef.current = checkout.sessionId;
    trackGa4CheckoutStep({
      eventName: "checkout_view",
      userId: uid,
      cartItems: checkout.items,
      params: { checkout_source: checkout.source },
    });
  }, [status, checkout, uid]);

  const restart = useCallback(() => {
    if (!checkout) return;
    void start(checkout.items, checkout.returnPath, checkout.source);
  }, [checkout, start]);

  const backHref = checkout?.returnPath ?? "/";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-white/10 bg-parts-pass-blue">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Parts Pass</span>
            <Image
              className="h-8 w-auto"
              src={partsPassHeader}
              alt="parts pass logo"
              priority
            />
          </Link>
          <Link
            href={backHref}
            onClick={() =>
              trackGa4CheckoutStep({
                eventName: "checkout_back_clicked",
                userId: uid,
              })
            }
            className="font-mont inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back to shopping
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {status === "ready" && checkout && stripePromise ? (
          <CheckoutElementsProvider
            key={checkout.clientSecret}
            stripe={stripePromise}
            options={{
              clientSecret: checkout.clientSecret,
              elementsOptions: { appearance, fonts },
              ...(email ? { defaultValues: { email } } : {}),
            }}
          >
            <CheckoutForm
              checkout={checkout}
              defaultEmail={email}
              onRestart={restart}
            />
          </CheckoutElementsProvider>
        ) : status === "empty" ? (
          <CheckoutMessage
            title="Your cart is empty"
            body="Add some parts to your cart, then come back to check out."
          />
        ) : status === "failed" || (status === "ready" && !stripePromise) ? (
          <CheckoutMessage
            title="We couldn't start checkout"
            body={
              checkoutError ??
              "Something went wrong while preparing your order. Please go back and try again."
            }
          />
        ) : (
          <div className="flex justify-center py-24">
            <p className="font-mont text-sm text-gray-500">Loading checkout…</p>
          </div>
        )}
      </main>
    </div>
  );
}

function CheckoutMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-mont text-2xl font-bold text-gray-900">{title}</h1>
      <p className="font-mont mt-3 text-sm text-gray-600">{body}</p>
      <Link
        href="/"
        className="font-mont mt-6 inline-flex rounded-md bg-parts-pass-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-parts-pass-blue-light"
      >
        Search for parts
      </Link>
    </div>
  );
}
