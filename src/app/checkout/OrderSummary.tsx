"use client";
import { useState, type ReactNode } from "react";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCheckout } from "@stripe/react-stripe-js/checkout";
import { formatCurrencyString } from "use-shopping-cart";

import PartThumbnail from "@/components/partThumbnail";
import ShippingCountdownBanner from "@/components/ShippingCountdownBanner";
import { isRemoteState, SHIPPING_SERVICE } from "@/lib/shippingRates";

const usd = (cents: number) =>
  formatCurrencyString({ value: cents, currency: "USD" });

type Props = {
  items: Record<string, any>[];
  onPromo: (eventName: string, params: Record<string, unknown>) => void;
};

export default function OrderSummary({ items, onPromo }: Props) {
  const checkoutState = useCheckout();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [applying, setApplying] = useState(false);

  if (checkoutState.type !== "success") return null;
  const { checkout } = checkoutState;

  const shippingLine = checkout.lineItems.find(
    (line) => line.name === "Shipping",
  );
  const partLines = checkout.lineItems.filter((line) => line !== shippingLine);
  const subtotalCents = partLines.reduce(
    (sum, line) => sum + line.subtotal.minorUnitsAmount,
    0,
  );
  const unitCount = partLines.reduce((sum, line) => sum + line.quantity, 0);
  const discounts = checkout.discountAmounts ?? [];

  const applyCode = async () => {
    const value = code.trim();
    if (!value || applying) return;
    setApplying(true);
    const result = await checkout.applyPromotionCode(value);
    setApplying(false);
    if (result.type === "error") {
      setPromoError(result.error.message);
      onPromo("checkout_promo_failed", { promo_code: value.toUpperCase() });
      return;
    }
    setPromoError("");
    setCode("");
    onPromo("checkout_promo_applied", { promo_code: value.toUpperCase() });
  };

  const details = (
    <div className="space-y-5">
      <ul className="divide-y divide-gray-100">
        {items.map((item, index) => {
          const quantity = Number(item.quantity ?? item.qtyInCart ?? 1) || 1;
          return (
            <li
              key={`${item.partNumber ?? index}`}
              className="flex gap-3 py-3 first:pt-0"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
                <PartThumbnail part={item} sizes="64px" compact />
                {quantity > 1 && (
                  <span className="font-mont absolute right-0.5 top-0.5 rounded-full bg-gray-700 px-1.5 text-[10px] font-semibold text-white">
                    {quantity}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mont line-clamp-2 text-sm font-medium text-gray-900">
                  {[item.manufacturer, item.category2]
                    .filter(Boolean)
                    .join(" ")}
                </p>
                <p className="font-mont text-xs text-gray-500">
                  #{item.partNumber}
                  {quantity > 1 ? ` · Qty ${quantity}` : ""}
                </p>
              </div>
              <p className="font-mont text-sm font-medium text-gray-900">
                {usd((Number(item.price) || 0) * quantity)}
              </p>
            </li>
          );
        })}
      </ul>

      <div>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              if (promoError) setPromoError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void applyCode();
            }}
            placeholder="Promo code"
            className="font-mont min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase text-gray-900 placeholder:normal-case focus:border-parts-pass-blue focus:outline-none focus:ring-1 focus:ring-parts-pass-blue"
          />
          <button
            type="button"
            onClick={applyCode}
            disabled={!code.trim() || applying}
            className="font-mont rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {applying ? "Applying…" : "Apply"}
          </button>
        </div>
        {promoError && (
          <p className="font-mont mt-1.5 text-sm text-red-600">{promoError}</p>
        )}
      </div>

      <dl className="space-y-2 border-t border-gray-200 pt-4">
        <Row
          label={`Subtotal (${unitCount} ${unitCount === 1 ? "item" : "items"})`}
        >
          {usd(subtotalCents)}
        </Row>
        <Row
          label={
            <span>
              {SHIPPING_SERVICE} shipping
              {isRemoteState(checkout.shippingAddress?.address.state) && (
                <span className="block text-xs text-gray-500">
                  Alaska, Hawaii and U.S. territories rate
                </span>
              )}
            </span>
          }
        >
          {shippingLine ? shippingLine.subtotal.amount : usd(0)}
        </Row>
        {discounts.map((discount) => (
          <Row
            key={discount.promotionCode ?? discount.displayName}
            label={
              <span className="inline-flex items-center gap-1">
                {discount.promotionCode ?? discount.displayName}
                <button
                  type="button"
                  onClick={async () => {
                    await checkout.removePromotionCode();
                    onPromo("checkout_promo_removed", {
                      promo_code: discount.promotionCode,
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Remove promo code"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            }
          >
            <span className="text-parts-pass-green">−{discount.amount}</span>
          </Row>
        ))}
        <Row label="Tax">
          {checkout.tax.status === "ready" ? (
            checkout.total.taxExclusive.amount
          ) : (
            <span className="text-gray-500">Calculated after address</span>
          )}
        </Row>
        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <dt className="font-mont text-base font-semibold text-gray-900">
            Total
          </dt>
          <dd className="font-mont text-lg font-bold text-gray-900">
            {checkout.total.total.amount}
          </dd>
        </div>
      </dl>

      <ShippingCountdownBanner inline />
    </div>
  );

  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-6">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between lg:hidden"
        aria-expanded={open}
      >
        <span className="font-mont inline-flex items-center gap-1 text-sm font-semibold text-parts-pass-blue">
          {open ? "Hide" : "Show"} order summary
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
        <span className="font-mont text-base font-bold text-gray-900">
          {checkout.total.total.amount}
        </span>
      </button>
      <h2 className="font-mont mb-4 hidden text-lg font-semibold text-gray-900 lg:block">
        Order summary
      </h2>
      <div className={`${open ? "mt-4 block" : "hidden"} lg:mt-0 lg:block`}>
        {details}
      </div>
    </aside>
  );
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="font-mont text-sm text-gray-600">{label}</dt>
      <dd className="font-mont text-sm text-gray-900">{children}</dd>
    </div>
  );
}
