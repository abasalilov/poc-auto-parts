"use client";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useFirestore } from "reactfire";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { formatCurrencyString, useShoppingCart } from "use-shopping-cart";

import { getOrderSummary } from "@/actions/checkout";
import { UserContext } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { useVehicle } from "@/context/VehicleContext";
import {
  AUTHOR,
  CARTS,
  ORDERS,
  SHIPPING_LABEL,
  STRIPE_SESSION_ID,
} from "@/lib/constants";
import { trackGa4Purchase } from "@/lib/ga4Analytics";
import { trackMetaPurchase } from "@/lib/metaPixel";
import { clearStoredCheckout } from "@/lib/onSiteCheckout";
import type { OrderSummary } from "@/lib/orderSummary";
import { SHIPPING_SERVICE } from "@/lib/shippingRates";
import Footer from "@/components/footer";
import Header from "@/components/header";
import PartThumbnail from "@/components/partThumbnail";

const usd = (cents: number) =>
  formatCurrencyString({ value: cents, currency: "USD" });

interface OrderConfirmationPageProps {
  params: {
    CHECKOUT_SESSION_ID: string;
  };
}

type SummaryState =
  | { status: "loading" }
  | { status: "paid"; summary: OrderSummary }
  | { status: "pending" | "invalid" };

export default function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const firestore = useFirestore();
  const { clearCart, cartDetails } = useShoppingCart();
  const { CHECKOUT_SESSION_ID } = params;
  const { user } = useContext(UserContext);
  const { startedCheckout, setStartedCheckout } = useCart();
  const { engineTitle, make, model, year } = useVehicle();
  const uid: string | undefined = user?.uid;
  const purchaseLogRequestedRef = useRef(false);

  const [summaryState, setSummaryState] = useState<SummaryState>({
    status: "loading",
  });
  const [cartLines, setCartLines] = useState<any[] | null>(null);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    clearStoredCheckout();
  }, []);

  useEffect(() => {
    const hasCartItems = Object.values(cartDetails ?? {}).length > 0;
    if (startedCheckout || hasCartItems) {
      setStartedCheckout(false);
      clearCart();
    }
  }, [clearCart, setStartedCheckout, startedCheckout]);

  useEffect(() => {
    let alive = true;
    getOrderSummary(CHECKOUT_SESSION_ID).then((result) => {
      if (alive) setSummaryState(result);
    });
    return () => {
      alive = false;
    };
  }, [CHECKOUT_SESSION_ID]);

  useEffect(() => {
    if (!uid) return;
    const carts = query(
      collection(firestore, CARTS),
      where(STRIPE_SESSION_ID, "==", CHECKOUT_SESSION_ID),
      where(AUTHOR, "==", uid),
    );
    getDocs(carts)
      .then(({ docs }) => setCartLines(docs[0]?.data()?.cart ?? []))
      .catch((error) => {
        console.log("order cart lookup error", error);
        setCartLines([]);
      });
  }, [CHECKOUT_SESSION_ID, firestore, uid]);

  // The webhook creates the order a few seconds after payment; watch for it.
  useEffect(() => {
    if (!uid) return;
    const orders = query(
      collection(firestore, ORDERS),
      where(AUTHOR, "==", uid),
      where(STRIPE_SESSION_ID, "==", CHECKOUT_SESSION_ID),
    );
    return onSnapshot(
      orders,
      ({ docs }) => {
        if (docs[0]) setOrder({ ...docs[0].data(), id: docs[0].id });
      },
      (error) => console.log("order lookup error", error),
    );
  }, [CHECKOUT_SESSION_ID, firestore, uid]);

  const summary = summaryState.status === "paid" ? summaryState.summary : null;

  useEffect(() => {
    if (
      !order ||
      order.originate !== "web" ||
      order.purchaseLogged !== false ||
      purchaseLogRequestedRef.current ||
      !summary ||
      !cartLines?.length
    ) {
      return;
    }
    purchaseLogRequestedRef.current = true;
    updateDoc(doc(firestore, ORDERS, order.id), { purchaseLogged: true }).catch(
      (error) => console.log("purchase log error", error),
    );
    trackGa4Purchase({
      userId: uid,
      cartItems: cartLines,
      itemVariant: `${year} ${make} ${model} ${engineTitle}`,
      valueCents: summary.totalCents,
    });
    trackMetaPurchase(cartLines, summary.totalCents / 100);
  }, [
    order,
    summary,
    cartLines,
    firestore,
    uid,
    year,
    make,
    model,
    engineTitle,
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {summaryState.status === "loading" ? (
          <OrderSkeleton />
        ) : summary ? (
          <>
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-9 w-9 flex-shrink-0 text-parts-pass-green" />
              <div>
                <h1 className="font-mont text-2xl font-bold text-gray-900 sm:text-3xl">
                  {summary.firstName
                    ? `Thanks, ${summary.firstName}!`
                    : "Thank you!"}{" "}
                  Your order is confirmed.
                </h1>
                <p className="font-mont mt-1 text-sm text-gray-600">
                  {order?.pa_order_id ? (
                    <>
                      Order{" "}
                      <span className="font-semibold text-gray-900">
                        #{order.pa_order_id}
                      </span>
                      {" · "}
                    </>
                  ) : null}
                  {summary.email
                    ? `A confirmation is on its way to ${summary.email}.`
                    : "We'll email you when it ships."}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="font-mont mb-4 text-lg font-semibold text-gray-900">
                  Items
                </h2>
                <OrderLines cartLines={cartLines} summary={summary} />
                <dl className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                  <Row label="Subtotal">{usd(summary.subtotalCents)}</Row>
                  <Row label={`${SHIPPING_SERVICE} shipping`}>
                    {summary.shippingCents > 0 ? (
                      usd(summary.shippingCents)
                    ) : (
                      <span className="font-semibold text-parts-pass-green">
                        FREE
                      </span>
                    )}
                  </Row>
                  {summary.discountCents > 0 && (
                    <Row label="Discount">
                      <span className="text-parts-pass-green">
                        −{usd(summary.discountCents)}
                      </span>
                    </Row>
                  )}
                  <Row label="Tax">{usd(summary.taxCents)}</Row>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <dt className="font-mont text-base font-semibold text-gray-900">
                      Total paid
                    </dt>
                    <dd className="font-mont text-lg font-bold text-gray-900">
                      {usd(summary.totalCents)}
                    </dd>
                  </div>
                </dl>
              </section>

              <aside className="space-y-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:self-start">
                {summary.address && (
                  <div>
                    <h2 className="font-mont text-sm font-semibold text-gray-900">
                      Shipping to
                    </h2>
                    <address className="font-mont mt-2 text-sm not-italic leading-6 text-gray-600">
                      {summary.address.name}
                      <br />
                      {summary.address.line1}
                      {summary.address.line2 && (
                        <>
                          <br />
                          {summary.address.line2}
                        </>
                      )}
                      <br />
                      {`${summary.address.city}, ${summary.address.state} ${summary.address.postalCode}`}
                    </address>
                  </div>
                )}
                <div>
                  <h2 className="font-mont text-sm font-semibold text-gray-900">
                    Shipping method
                  </h2>
                  <p className="font-mont mt-2 text-sm text-gray-600">
                    {SHIPPING_LABEL}
                  </p>
                  <p className="font-mont mt-1 text-xs text-gray-500">
                    We&apos;ll email tracking details as soon as it ships.
                  </p>
                </div>
                <Link
                  href="/"
                  className="font-mont flex w-full items-center justify-center rounded-lg bg-parts-pass-blue px-4 py-3 text-sm font-semibold text-white hover:bg-parts-pass-blue-light"
                >
                  Continue shopping
                </Link>
              </aside>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-md py-16 text-center">
            <h1 className="font-mont text-2xl font-bold text-gray-900">
              {summaryState.status === "pending"
                ? "This order hasn't been paid yet"
                : "We couldn't find that order"}
            </h1>
            <p className="font-mont mt-3 text-sm text-gray-600">
              If you just placed an order, check your email for a confirmation,
              or contact us and we&apos;ll help.
            </p>
            <Link
              href="/"
              className="font-mont mt-6 inline-flex rounded-md bg-parts-pass-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-parts-pass-blue-light"
            >
              Search for parts
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

/** Parts from the cart saved at checkout (with images), or Stripe's line names if it's missing. */
function OrderLines({
  cartLines,
  summary,
}: {
  cartLines: any[] | null;
  summary: OrderSummary;
}) {
  if (cartLines === null) {
    return <div className="h-20 animate-pulse rounded-lg bg-gray-100" />;
  }
  if (cartLines.length === 0) {
    return (
      <ul className="divide-y divide-gray-100">
        {summary.lines.map((line, index) => (
          <li
            key={index}
            className="flex justify-between gap-3 py-3 first:pt-0"
          >
            <p className="font-mont text-sm text-gray-900">
              {line.name}
              {line.quantity > 1 ? ` × ${line.quantity}` : ""}
            </p>
            <p className="font-mont text-sm font-medium text-gray-900">
              {usd(line.totalCents)}
            </p>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="divide-y divide-gray-100">
      {cartLines.map((item, index) => {
        const quantity = Number(item.quantity ?? item.qtyInCart ?? 1) || 1;
        return (
          <li
            key={`${item.partNumber ?? ""}-${index}`}
            className="flex gap-4 py-3 first:pt-0"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white sm:h-20 sm:w-20">
              <PartThumbnail part={item} sizes="80px" compact />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mont text-sm font-medium text-gray-900">
                {[item.manufacturer, item.category2].filter(Boolean).join(" ")}
              </p>
              <p className="font-mont text-xs text-gray-500">
                #{item.partNumber} · Qty {quantity}
              </p>
            </div>
            <p className="font-mont text-sm font-medium text-gray-900">
              {usd((Number(item.price) || 0) * quantity)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="font-mont text-sm text-gray-600">{label}</dt>
      <dd className="font-mont text-sm text-gray-900">{children}</dd>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading your order">
      <div className="h-8 w-2/3 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-72 rounded-xl bg-gray-200" />
        <div className="h-56 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
