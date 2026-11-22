"use client";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import {
  ExpressCheckoutElement,
  PaymentElement,
  ShippingAddressElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";
import type { StripeCheckoutExpressCheckoutElementOptions } from "@stripe/stripe-js";

import OrderSummary from "./OrderSummary";
import { updateCheckoutShipping } from "@/actions/checkout";
import { UserContext } from "@/context/UserContext";
import { trackGa4CheckoutStep } from "@/lib/ga4Analytics";
import type { StoredCheckout } from "@/lib/onSiteCheckout";
import { isRemoteState } from "@/lib/shippingRates";

const expressCheckoutOptions = {
  buttonHeight: 48,
  layout: { maxColumns: 2, maxRows: 1, overflow: "auto" },
  paymentMethodOrder: ["applePay", "googlePay"],
  buttonType: { applePay: "check-out", googlePay: "checkout" },
  buttonTheme: { applePay: "black", googlePay: "black" },
  paymentMethods: { applePay: "auto", googlePay: "auto" },
} as const satisfies StripeCheckoutExpressCheckoutElementOptions;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  checkout: StoredCheckout;
  defaultEmail?: string;
  /** Starts a fresh Stripe session for the same items, e.g. after this one expired. */
  onRestart: () => void;
};

export default function CheckoutForm({
  checkout: stored,
  defaultEmail,
  onRestart,
}: Props) {
  const checkoutState = useCheckout();
  const { user } = useContext(UserContext);
  const userId: string | undefined = user?.uid;
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [emailError, setEmailError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paying, setPaying] = useState(false);
  const [hasExpressWallets, setHasExpressWallets] = useState(false);
  const [updatingShipping, setUpdatingShipping] = useState(false);
  /** Whether the shipping line is the remote (Alaska, Hawaii, territories) price; null until first checked. */
  const pricedRemote = useRef<boolean | null>(null);
  const tracked = useRef(new Set<string>());

  const track = (
    eventName: string,
    params: Record<string, unknown> = {},
    withItems = false,
  ) =>
    trackGa4CheckoutStep({
      eventName,
      userId,
      cartItems: withItems ? stored.items : [],
      params,
    });

  const trackOnce = (
    eventName: string,
    params: Record<string, unknown> = {},
    withItems = false,
  ) => {
    if (tracked.current.has(eventName)) return;
    tracked.current.add(eventName);
    track(eventName, params, withItems);
  };

  /** Reprices shipping when the delivery state moves into or out of the remote areas; false if that failed. */
  const priceShippingFor = async (state: string | null | undefined) => {
    if (checkoutState.type !== "success") return true;
    const remote = isRemoteState(state);
    if (remote === pricedRemote.current || (pricedRemote.current === null && !state)) return true;
    setUpdatingShipping(true);
    const result = await checkoutState.checkout.runServerUpdate(() =>
      updateCheckoutShipping(stored.sessionId, state ?? ""),
    );
    setUpdatingShipping(false);
    if (result.type === "error") {
      setPaymentError("We couldn't update shipping for this address. Please try again.");
      return false;
    }
    pricedRemote.current = remote;
    return true;
  };

  const shippingState =
    checkoutState.type === "success"
      ? (checkoutState.checkout.shippingAddress?.address.state ?? "")
      : "";
  useEffect(() => {
    void priceShippingFor(shippingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingState]);

  const status =
    checkoutState.type === "success" ? checkoutState.checkout.status : null;
  useEffect(() => {
    if (status?.type === "complete") {
      window.location.assign(`/orders/${stored.sessionId}`);
    } else if (status?.type === "expired") {
      track("checkout_session_expired");
      onRestart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.type]);

  if (checkoutState.type === "loading") {
    return (
      <p className="font-mont py-24 text-center text-sm text-gray-500">
        Loading checkout…
      </p>
    );
  }

  if (checkoutState.type === "error") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="font-mont text-sm text-gray-700">
          {checkoutState.error.message}
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="font-mont mt-4 rounded-md bg-parts-pass-blue px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  const { checkout } = checkoutState;
  const isSignedIn = Boolean(user?.uid && !user?.isAnonymous);

  /** Card declines and other payment failures, versus fields the shopper left incomplete. */
  const trackConfirmError = (
    error: {
      message: string;
      code: string | null;
      paymentFailed?: { declineCode: string | null };
    },
    paymentType?: string,
  ) => {
    const message = error.message.slice(0, 100);
    if (error.code === "paymentFailed") {
      track("checkout_payment_failed", {
        payment_type: paymentType,
        decline_code: error.paymentFailed?.declineCode ?? "",
        error_message: message,
      });
    } else {
      track("checkout_validation_error", {
        payment_type: paymentType,
        error_message: message,
      });
    }
  };

  const saveEmail = async () => {
    const value = email.trim();
    if (!value) return true;
    if (!EMAIL_PATTERN.test(value)) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    if (value === checkout.email) return true;
    const result = await checkout.updateEmail(value);
    if (result.type === "error") {
      setEmailError(result.error.message);
      return false;
    }
    setEmailError("");
    trackOnce("checkout_email_entered");
    return true;
  };

  const handlePay = async () => {
    if (paying) return;
    setPaymentError("");
    if (!email.trim()) {
      setEmailError("Enter your email so we can send your receipt.");
      track("checkout_validation_error", { error_message: "email" });
      return;
    }
    if (!(await saveEmail())) {
      track("checkout_validation_error", { error_message: "email" });
      return;
    }
    if (!(await priceShippingFor(checkout.shippingAddress?.address.state))) return;

    setPaying(true);
    track(
      "checkout_pay_clicked",
      { tax_ready: checkout.tax.status === "ready" },
      true,
    );
    const result = await checkout.confirm();
    if (result.type === "error") {
      setPaying(false);
      setPaymentError(result.error.message);
      trackConfirmError(result.error);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
      <div className="order-2 lg:order-1">
        <h1 className="font-mont mb-8 hidden text-2xl font-bold text-gray-900 lg:block">
          Checkout
        </h1>
        <div className="space-y-8">
          <div hidden={!hasExpressWallets}>
            <p className="font-mont mb-3 text-sm font-medium text-gray-700">
              Express checkout
            </p>
            <ExpressCheckoutElement
              options={expressCheckoutOptions}
              onReady={({ availablePaymentMethods }: any) =>
                setHasExpressWallets(Boolean(availablePaymentMethods))
              }
              onConfirm={async (event: any) => {
                const walletState = event?.shippingAddress?.address?.state;
                if (isRemoteState(walletState) && !pricedRemote.current) {
                  event.paymentFailed({ reason: "fail" });
                  if (await priceShippingFor(walletState)) {
                    setPaymentError(
                      "Shipping to Alaska, Hawaii and U.S. territories costs more, so your total has been updated. Please review it and pay again.",
                    );
                  }
                  return;
                }
                track(
                  "checkout_pay_clicked",
                  { payment_type: event?.expressPaymentType },
                  true,
                );
                const result = await checkout.confirm({
                  expressCheckoutConfirmEvent: event,
                });
                if (result.type === "error") {
                  setPaymentError(result.error.message);
                  trackConfirmError(result.error, event?.expressPaymentType);
                }
              }}
            />
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="font-mont text-xs uppercase tracking-wide text-gray-400">
                or
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          </div>

          <Section title="Contact">
            <label
              htmlFor="checkout-email"
              className="font-mont mb-1 block text-sm text-gray-700"
            >
              Email
            </label>
            <input
              id="checkout-email"
              type="email"
              autoComplete="email"
              data-clarity-mask="true"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError("");
              }}
              onBlur={() => void saveEmail()}
              className="font-mont block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-parts-pass-blue focus:outline-none focus:ring-1 focus:ring-parts-pass-blue"
              placeholder="you@example.com"
            />
            {emailError && (
              <p className="font-mont mt-1.5 text-sm text-red-600">
                {emailError}
              </p>
            )}
            {!isSignedIn && (
              <p className="font-mont mt-2 text-xs text-gray-500">
                Have an account?{" "}
                <Link
                  href="/login?next=/checkout"
                  className="font-semibold text-parts-pass-blue hover:underline"
                >
                  Log in
                </Link>
              </p>
            )}
          </Section>

          <Section title="Shipping address">
            <div data-clarity-mask="true">
              <ShippingAddressElement
                onChange={(event: any) => {
                  if (event?.complete) {
                    trackOnce(
                      "add_shipping_info",
                      { shipping_tier: "fedex_ground" },
                      true,
                    );
                  }
                }}
              />
            </div>
          </Section>

          <Section title="Payment">
            <PaymentElement
              options={{
                layout: "tabs",
                wallets: { applePay: "never", googlePay: "never" },
              }}
              onChange={(event: any) => {
                if (event?.complete) {
                  trackOnce(
                    "add_payment_info",
                    { payment_type: event?.value?.type },
                    true,
                  );
                }
              }}
            />
          </Section>

          <div>
            {paymentError && (
              <p className="font-mont mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {paymentError}
              </p>
            )}
            <button
              type="button"
              onClick={handlePay}
              disabled={paying || updatingShipping}
              className="font-mont flex w-full items-center justify-center gap-2 rounded-lg bg-parts-pass-blue px-4 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-parts-pass-blue-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
              {paying
                ? "Processing…"
                : updatingShipping
                  ? "Updating shipping…"
                  : `Pay ${checkout.total.total.amount}`}
            </button>
            <p className="font-mont mt-3 text-center text-xs text-gray-500">
              Payments are processed securely by Stripe. Card details never
              touch our servers.
            </p>
          </div>
        </div>
      </div>

      <div className="order-1 lg:order-2">
        <OrderSummary items={stored.items} onPromo={track} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-mont mb-3 text-lg font-semibold text-gray-900">
        {title}
      </h2>
      {children}
    </section>
  );
}
